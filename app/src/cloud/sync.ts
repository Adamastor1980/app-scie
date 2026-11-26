import { create } from 'zustand';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { fb } from './firebase';
import { useStore } from '../store';
import type { Projeto } from '../data/types';
import { logoLeve } from '../ui/primitives';
import { fichaPublica, type FichaPublicaDoc } from '../engine/manutencao';

/** fichas públicas de manutenção já enviadas (por projeto): só se reenvia quando mudam */
const publicosEnviados = new Map<string, string>();

/**
 * Sincronização com o Firestore.
 * Estrutura: users/{uid}                 → { perfil: { empresa, autor } }
 *            users/{uid}/projetos/{pid}  → projeto (sem empresa/autor e sem as imagens das plantas)
 *            users/{uid}/plantas/{id}    → { pid, imagem } (cada imagem num documento: limite de 1 MiB por documento)
 * Regra de conflito: prevalece a versão com «atualizadoEm» mais recente.
 */

export type EstadoNuvem = 'local' | 'a_ligar' | 'a_sincronizar' | 'sincronizado' | 'offline' | 'erro';

interface NuvemState {
  estado: EstadoNuvem;
  user: { uid: string; nome: string; email: string; foto?: string } | null;
  erro?: string;
  /** a sessão Google já foi verificada (evita mostrar o ecrã de entrada por instantes) */
  verificado: boolean;
}

export const useNuvem = create<NuvemState>(() => ({ estado: 'local', user: null, verificado: false }));

const limpo = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

let pararFns: (() => void)[] = [];
let enviados = new Map<string, number>(); // pid → atualizadoEm enviado/recebido
/** imagens já na nuvem: id → assinatura do conteúdo (uma imagem editada tem a mesma id mas outro conteúdo) */
let imagensEnviadas = new Map<string, string>();
const assin = (s: string) => `${s.length}:${s.slice(-48)}`;
/** imagens apagadas pelo utilizador NESTE aparelho (só estas são apagadas da nuvem) */
let imagensApagar = new Set<string>();
let perfilEnviado = '';
/** JSON com as chaves por ordem: a nuvem devolve os campos noutra ordem e a comparação tem de ser pelo conteúdo */
const estavel = (x: unknown): string => JSON.stringify(x, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
// projetos apagados: registo («lápide») guardado na nuvem para que os outros aparelhos não os voltem a enviar
type Lapides = Record<string, number>;
const CHAVE_LAPIDES = 'cautela-apagados-por-enviar';
let lapidesNuvem: Lapides = {};
const lapidesPorEnviar = (): Lapides => { try { return JSON.parse(localStorage.getItem(CHAVE_LAPIDES) || '{}'); } catch { return {}; } };
const guardarPorEnviar = (l: Lapides) => localStorage.setItem(CHAVE_LAPIDES, JSON.stringify(l));
const apagadoDepois = (p: Projeto, l: Lapides) => l[p.id] != null && (p.atualizadoEm ?? 0) <= l[p.id];
const todasLapides = (): Lapides => ({ ...lapidesNuvem, ...lapidesPorEnviar() });
// projetos que este aparelho já viu na nuvem (id → versão): se desaparecerem da nuvem sem alterações locais, foram apagados noutro aparelho
const CHAVE_VISTOS = 'cautela-vistos-na-nuvem';
const vistosGuardados = (): Lapides => { try { return JSON.parse(localStorage.getItem(CHAVE_VISTOS) || '{}'); } catch { return {}; } };
const guardarVistos = () => localStorage.setItem(CHAVE_VISTOS, JSON.stringify(Object.fromEntries([...enviados].filter(([, t]) => t > 0))));
let aplicarRemoto = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** imagens grandes (plantas, levantamento das UT, fotografias dos registos) vão em documentos próprios; o projeto leva só a referência (id) */
function comImagens(p: Projeto, img: (id: string, atual?: string) => string): Projeto {
  return {
    ...p,
    plantas: (p.plantas ?? []).map((pl) => ({ ...pl, imagem: img(pl.id, pl.imagem) })),
    edificios: (p.edificios ?? []).map((e) => ({
      ...e,
      uts: e.uts.map((u) => (u.levantamento?.length ? { ...u, levantamento: u.levantamento.map((a) => ({ ...a, imagem: img(a.id, a.imagem) })) } : u)),
    })),
    ...(p.autoprotecao
      ? { autoprotecao: { ...p.autoprotecao, registos: p.autoprotecao.registos.map((r) => (r.anexos?.length ? { ...r, anexos: r.anexos.map((a) => ({ ...a, imagem: img(a.id, a.imagem) })) } : r)) } }
      : {}),
  };
}
function imagensDe(p: Projeto): { id: string; imagem: string }[] {
  return [
    ...p.plantas.map((pl) => ({ id: pl.id, imagem: pl.imagem })),
    ...p.edificios.flatMap((e) => e.uts.flatMap((u) => (u.levantamento ?? []).map((a) => ({ id: a.id, imagem: a.imagem })))),
    ...(p.autoprotecao?.registos ?? []).flatMap((r) => (r.anexos ?? []).map((a) => ({ id: a.id, imagem: a.imagem }))),
  ];
}
const faltaImagem = (p: Projeto, imagens: Map<string, string>) => imagensDe(p).some((x) => !x.imagem && imagens.get(x.id));

function semPerfil(p: Projeto) {
  const { empresa: _e, autor: _a, ...resto } = comImagens(p, () => '');
  void _e; void _a;
  return limpo(resto);
}

export async function iniciarSincronizacao(user: User) {
  const f = fb();
  if (!f) return;
  pararSincronizacao();
  const { db } = f;
  const uid = user.uid;
  useNuvem.setState({ estado: 'a_ligar', user: { uid, nome: user.displayName ?? user.email ?? '', email: user.email ?? '', foto: user.photoURL ?? undefined }, erro: undefined });

  const colP = collection(db, 'users', uid, 'projetos');
  const colI = collection(db, 'users', uid, 'plantas');
  const docU = doc(db, 'users', uid);

  try {
    // 1) leitura inicial e junção com o que está neste computador
    const [sp, si, su] = await Promise.all([getDocs(colP), getDocs(colI), getDoc(docU)]);
    const imagens = new Map<string, string>();
    si.forEach((d) => imagens.set(d.id, (d.data() as { imagem: string }).imagem));
    imagensEnviadas = new Map([...imagens].map(([k, v]) => [k, assin(v)]));
    imagensApagar = new Set();

    const local = useStore.getState();
    lapidesNuvem = (su.exists() ? (su.data() as { apagados?: Lapides }).apagados : undefined) ?? {};
    const lapides: Lapides = { ...lapidesNuvem, ...lapidesPorEnviar() };
    const perfilRemoto = (su.exists() ? (su.data() as { perfil?: { empresa: Projeto['empresa']; autor: Projeto['autor'] } }).perfil : undefined) ?? null;
    const preenche = <T extends object>(base: T | null | undefined, extra: T | null | undefined): T =>
      ({ ...(extra ?? {}), ...Object.fromEntries(Object.entries(base ?? {}).filter(([, v]) => v)) }) as T;
    const empresa = preenche(perfilRemoto?.empresa, local.empresaPadrao);
    const autor = preenche(perfilRemoto?.autor, local.autorPadrao);

    // imagens guardadas neste aparelho (podem ainda não ter chegado à nuvem)
    const imagensLocais = new Map(local.projetos.flatMap((p) => imagensDe(p)).filter((x) => x.imagem).map((x) => [x.id, x.imagem]));
    const remotos = new Map<string, Projeto>();
    sp.forEach((d) => {
      const r = d.data() as Projeto;
      if (apagadoDepois(r, lapides)) return; // apagado noutro aparelho (o documento é removido no envio)
      remotos.set(d.id, comImagens({ ...r, empresa, autor }, (id) => imagens.get(id) ?? imagensLocais.get(id) ?? ''));
    });

    const juntos = new Map<string, Projeto>();
    const vistos = vistosGuardados();
    const idsNuvem = new Set<string>();
    sp.forEach((d) => idsNuvem.add(d.id));
    for (const p of local.projetos) {
      if (apagadoDepois(p, lapides)) continue;
      // já esteve na nuvem, desapareceu e não foi alterado aqui depois: foi apagado noutro aparelho
      if (!sp.metadata.fromCache && !idsNuvem.has(p.id) && vistos[p.id] != null && (p.atualizadoEm ?? 0) <= vistos[p.id]) continue; // só com a lista lida do servidor (nunca da cache)
      juntos.set(p.id, p);
    }
    for (const [id, r] of remotos) {
      const l = juntos.get(id);
      if (!l || (r.atualizadoEm ?? 0) >= (l.atualizadoEm ?? 0)) juntos.set(id, r);
    }
    const lista = [...juntos.values()].map((p) => ({ ...p, empresa, autor })).sort((a, b) => b.atualizadoEm - a.atualizadoEm);
    enviados = new Map([...remotos.values()].map((r) => [r.id, r.atualizadoEm]));
    sp.forEach((d) => { if (!remotos.has(d.id)) enviados.set(d.id, -1); }); // documentos de projetos apagados: o envio remove-os
    guardarVistos();
    aplicarRemoto = true;
    useStore.setState({ projetos: lista, empresaPadrao: empresa, autorPadrao: autor });
    aplicarRemoto = false;

    // 2) envia o que só existe (ou é mais recente) neste computador, incluindo o perfil
    await enviar(true);

    // 3) ouve alterações feitas noutros dispositivos
    pararFns.push(onSnapshot(colI, (snap) => {
      let removidas = false;
      const alteradas = new Set<string>();
      snap.docChanges().forEach((c) => {
        if (c.type === 'removed') {
          // apagada na nuvem: se este aparelho ainda a tiver (e não a apagou), volta a enviá-la
          imagens.delete(c.doc.id);
          imagensEnviadas.delete(c.doc.id);
          removidas = true;
          return;
        }
        const im = (c.doc.data() as { imagem: string }).imagem;
        imagens.set(c.doc.id, im);
        imagensEnviadas.set(c.doc.id, assin(im));
        if (c.type === 'modified' && !c.doc.metadata.hasPendingWrites) alteradas.add(c.doc.id); // editada noutro aparelho
      });
      if (removidas) { if (timer) clearTimeout(timer); timer = setTimeout(() => { enviar(false).catch(falha); }, 1500); }
      // completa imagens que chegaram depois do projeto
      const st = useStore.getState();
      const temAlterada = (p: Projeto) => imagensDe(p).some((x) => alteradas.has(x.id) && x.imagem !== imagens.get(x.id));
      if (st.projetos.some((p) => faltaImagem(p, imagens) || temAlterada(p))) {
        aplicarRemoto = true;
        useStore.setState({ projetos: st.projetos.map((p) => (faltaImagem(p, imagens) || temAlterada(p) ? comImagens(p, (id, atual) => (alteradas.has(id) ? imagens.get(id) ?? atual ?? '' : atual || (imagens.get(id) ?? ''))) : p)) });
        aplicarRemoto = false;
      }
    }));
    pararFns.push(onSnapshot(colP, { includeMetadataChanges: true }, (snap) => {
      const st = useStore.getState();
      let projetos = st.projetos;
      let mudou = false;
      snap.docChanges().forEach((c) => {
        if (c.doc.metadata.hasPendingWrites) return;
        if (c.type === 'removed') {
          if (projetos.some((p) => p.id === c.doc.id)) {
            projetos = projetos.filter((p) => p.id !== c.doc.id);
            enviados.delete(c.doc.id);
            mudou = true;
          }
          return;
        }
        const r = c.doc.data() as Projeto;
        if (apagadoDepois(r, todasLapides())) {
          // reenviado por um aparelho com uma versão antiga: continua apagado e o documento é removido
          enviados.set(r.id, -1);
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => { enviar(false).catch(falha); }, 1200);
          return;
        }
        const l = projetos.find((p) => p.id === c.doc.id);
        if (l && (l.atualizadoEm ?? 0) >= (r.atualizadoEm ?? 0)) return;
        const locais = new Map(l ? imagensDe(l).map((x) => [x.id, x.imagem]) : []);
        const novo: Projeto = comImagens({ ...r, empresa: st.empresaPadrao ?? r.empresa, autor: st.autorPadrao ?? r.autor }, (id) => imagens.get(id) ?? locais.get(id) ?? '');
        enviados.set(r.id, r.atualizadoEm);
        projetos = l ? projetos.map((p) => (p.id === r.id ? novo : p)) : [novo, ...projetos];
        mudou = true;
      });
      guardarVistos();
      if (mudou) {
        aplicarRemoto = true;
        useStore.setState({ projetos });
        aplicarRemoto = false;
      }
      useNuvem.setState({ estado: snap.metadata.fromCache && !navigator.onLine ? 'offline' : snap.metadata.hasPendingWrites ? 'a_sincronizar' : 'sincronizado' });
    }));
    pararFns.push(onSnapshot(docU, (d) => {
      if (d.metadata.hasPendingWrites || !d.exists()) return;
      lapidesNuvem = (d.data() as { apagados?: Lapides }).apagados ?? {};
      const stA = useStore.getState();
      if (stA.projetos.some((p) => apagadoDepois(p, lapidesNuvem))) {
        aplicarRemoto = true;
        useStore.setState({ projetos: stA.projetos.filter((p) => !apagadoDepois(p, lapidesNuvem)) });
        aplicarRemoto = false;
      }
      const pr = (d.data() as { perfil?: { empresa: Projeto['empresa']; autor: Projeto['autor'] } }).perfil;
      if (!pr) return;
      const s = estavel(pr);
      if (s === perfilEnviado) return;
      // alteração do perfil feita aqui e ainda não enviada (ex.: assinatura acabada de guardar): prevalece a local, que vai ser enviada
      if (estavel(limpo({ empresa: stA.empresaPadrao, autor: stA.autorPadrao })) !== perfilEnviado) return;
      perfilEnviado = s;
      aplicarRemoto = true;
      useStore.setState((st) => ({ empresaPadrao: pr.empresa, autorPadrao: pr.autor, projetos: st.projetos.map((p) => ({ ...p, empresa: pr.empresa, autor: pr.autor })) }));
      aplicarRemoto = false;
    }));

    // 4) envia as alterações locais (com um pequeno atraso para agrupar a escrita)
    pararFns.push(useStore.subscribe((novo, antigo) => {
      if (aplicarRemoto) return;
      const vivos = new Set(novo.projetos.map((p) => p.id));
      const removidos = antigo.projetos.filter((p) => !vivos.has(p.id) && !p.exemplo);
      if (removidos.length) {
        const l = lapidesPorEnviar();
        for (const p of removidos) l[p.id] = Math.max(Date.now(), p.atualizadoEm ?? 0);
        guardarPorEnviar(l);
      }
      const ids = (ps: Projeto[]) => new Set(ps.flatMap((p) => imagensDe(p).map((x) => x.id)));
      const antes = ids(antigo.projetos);
      const depois = ids(novo.projetos);
      for (const id of antes) if (!depois.has(id)) imagensApagar.add(id);
      useNuvem.setState({ estado: 'a_sincronizar' });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { enviar(false).catch(falha); }, 1200);
    }));
    const online = () => useNuvem.setState({ estado: 'a_sincronizar' });
    const offline = () => useNuvem.setState({ estado: 'offline' });
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    pararFns.push(() => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); });
    useNuvem.setState({ estado: navigator.onLine ? 'sincronizado' : 'offline' });
  } catch (e) {
    falha(e);
  }
}

function falha(e: unknown) {
  console.error(e);
  useNuvem.setState({ estado: 'erro', erro: (e as Error)?.message ?? String(e) });
}

async function enviar(inicial: boolean) {
  const f = fb();
  const u = useNuvem.getState().user;
  if (!f || !u) return;
  const { db } = f;
  const st = useStore.getState();
  const tarefas: Promise<unknown>[] = [];

  const perfil = limpo({ empresa: st.empresaPadrao, autor: st.autorPadrao });
  const sPerfil = estavel(perfil);
  if (sPerfil !== perfilEnviado && (st.empresaPadrao || st.autorPadrao)) {
    perfilEnviado = sPerfil;
    tarefas.push(setDoc(doc(db, 'users', u.uid), { perfil }, { merge: true }).catch((e) => { perfilEnviado = ''; throw e; }));
  }

  const ids = new Set(st.projetos.map((p) => p.id));
  const pend = lapidesPorEnviar();
  const novas = Object.entries(pend).filter(([id, t]) => lapidesNuvem[id] !== t && !ids.has(id));
  if (novas.length) {
    const apagados = Object.fromEntries(novas);
    tarefas.push(
      Promise.all([
        setDoc(doc(db, 'users', u.uid), { apagados }, { merge: true }),
        ...novas.map(([id]) => deleteDoc(doc(db, 'users', u.uid, 'projetos', id))),
      ]).then(() => {
        Object.assign(lapidesNuvem, apagados);
        const l = lapidesPorEnviar();
        for (const [id] of novas) delete l[id];
        guardarPorEnviar(l);
        for (const [id] of novas) enviados.delete(id);
      }),
    );
  }
  // imagens que existem neste aparelho mas ainda não estão na nuvem (ex.: envio interrompido): enviar sempre
  for (const p of st.projetos) {
    if (p.exemplo) continue;
    for (const pl of imagensDe(p)) {
      if (!pl.imagem || imagensEnviadas.get(pl.id) === assin(pl.imagem)) continue;
      imagensEnviadas.set(pl.id, assin(pl.imagem));
      tarefas.push(setDoc(doc(db, 'users', u.uid, 'plantas', pl.id), { pid: p.id, imagem: pl.imagem }).catch((e) => { imagensEnviadas.delete(pl.id); throw e; }));
    }
  }
  for (const p of st.projetos) {
    if (p.exemplo) continue; // o exemplo nunca vai para a nuvem
    if (enviados.get(p.id) === p.atualizadoEm) continue;
    // logótipo do cliente demasiado grande (o documento do projeto tem o limite de 1 MiB): reduz primeiro e envia depois
    if (p.clienteLogo && p.clienteLogo.length > 250_000) {
      const original = p.clienteLogo;
      logoLeve(original).then((d) => {
        useStore.setState((s2) => ({ projetos: s2.projetos.map((x) => (x.id === p.id && x.clienteLogo === original ? { ...x, clienteLogo: d, atualizadoEm: Date.now() } : x)) }));
      });
      continue;
    }
    enviados.set(p.id, p.atualizadoEm);
    tarefas.push(
      setDoc(doc(db, 'users', u.uid, 'projetos', p.id), semPerfil(p)).catch((e) => {
        enviados.delete(p.id); // volta a tentar no próximo envio
        throw e;
      }),
    );
  }
  for (const [pid, t] of [...enviados]) {
    if (t !== -1 || ids.has(pid)) continue;
    enviados.delete(pid);
    tarefas.push(deleteDoc(doc(db, 'users', u.uid, 'projetos', pid)));
  }
  // fichas públicas dos planos de manutenção partilhados com o cliente (só leitura, pelo QR)
  for (const p of st.projetos) {
    if (p.exemplo || !p.manutencao?.partilhar) continue;
    const f = fichaPublica(p, u.uid);
    const sf = estavel(f);
    if (publicosEnviados.get(p.id) === sf) continue;
    publicosEnviados.set(p.id, sf);
    tarefas.push(setDoc(doc(db, 'publico', p.id), limpo(f)).catch((e) => { publicosEnviados.delete(p.id); throw e; }));
  }
  if (!inicial) {
    for (const pid of [...enviados.keys()]) {
      if (ids.has(pid)) continue;
      enviados.delete(pid);
      tarefas.push(deleteDoc(doc(db, 'users', u.uid, 'projetos', pid)));
    }
    // imagens apagadas pelo utilizador neste aparelho (nunca se apagam imagens só porque este aparelho ainda não conhece o projeto que as usa)
    const vivas = new Set(st.projetos.flatMap((p) => imagensDe(p).map((pl) => pl.id)));
    for (const id of [...imagensApagar]) {
      imagensApagar.delete(id);
      if (vivas.has(id)) continue;
      imagensEnviadas.delete(id);
      tarefas.push(deleteDoc(doc(db, 'users', u.uid, 'plantas', id)));
    }
  }
  await Promise.all(tarefas);
  guardarVistos();
  useNuvem.setState({ estado: navigator.onLine ? 'sincronizado' : 'offline' });
}

export function pararSincronizacao() {
  pararFns.forEach((f) => f());
  pararFns = [];
  if (timer) clearTimeout(timer);
  enviados = new Map();
  imagensEnviadas = new Map();
  perfilEnviado = '';
}

/** Ao sair: termina a sincronização e apaga a cópia local (os dados ficam na nuvem) */
export async function terminarSessao() {
  if (timer) {
    clearTimeout(timer);
    await enviar(false).catch(() => {});
  }
  pararSincronizacao();
  aplicarRemoto = true;
  useStore.setState({ projetos: [], empresaPadrao: null, autorPadrao: null });
  aplicarRemoto = false;
  useNuvem.setState({ estado: 'local', user: null });
}


/** Deixa de partilhar: apaga a ficha pública do projeto */
export async function apagarPublico(pid: string) {
  const f = fb();
  if (!f || !useNuvem.getState().user) return;
  publicosEnviados.delete(pid);
  await deleteDoc(doc(f.db, 'publico', pid));
}

/** Ficha pública de um projeto (lida sem sessão iniciada); null se não estiver partilhada */
export async function lerPublico(pid: string): Promise<FichaPublicaDoc | null> {
  const f = fb();
  if (!f) return null;
  try {
    const d = await getDoc(doc(f.db, 'publico', pid));
    return d.exists() ? (d.data() as FichaPublicaDoc) : null;
  } catch (e) {
    // sem permissão = ficha não partilhada (ou regras por atualizar): não é falta de rede
    if ((e as { code?: string }).code === 'permission-denied') return null;
    throw e;
  }
}
