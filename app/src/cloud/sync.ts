import { create } from 'zustand';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { fb } from './firebase';
import { useStore } from '../store';
import type { Projeto } from '../data/types';

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
let imagensEnviadas = new Set<string>();
let perfilEnviado = '';
let aplicarRemoto = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function semPerfil(p: Projeto) {
  const { empresa: _e, autor: _a, ...resto } = p;
  void _e; void _a;
  return limpo({ ...resto, plantas: p.plantas.map((pl) => ({ ...pl, imagem: '' })) });
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
    imagensEnviadas = new Set(imagens.keys());

    const local = useStore.getState();
    const perfilRemoto = (su.exists() ? (su.data() as { perfil?: { empresa: Projeto['empresa']; autor: Projeto['autor'] } }).perfil : undefined) ?? null;
    const preenche = <T extends object>(base: T | null | undefined, extra: T | null | undefined): T =>
      ({ ...(extra ?? {}), ...Object.fromEntries(Object.entries(base ?? {}).filter(([, v]) => v)) }) as T;
    const empresa = preenche(perfilRemoto?.empresa, local.empresaPadrao);
    const autor = preenche(perfilRemoto?.autor, local.autorPadrao);

    const remotos = new Map<string, Projeto>();
    sp.forEach((d) => {
      const r = d.data() as Projeto;
      remotos.set(d.id, { ...r, empresa, autor, plantas: (r.plantas ?? []).map((pl) => ({ ...pl, imagem: imagens.get(pl.id) ?? '' })) });
    });

    const juntos = new Map<string, Projeto>();
    for (const p of local.projetos) juntos.set(p.id, p);
    for (const [id, r] of remotos) {
      const l = juntos.get(id);
      if (!l || (r.atualizadoEm ?? 0) >= (l.atualizadoEm ?? 0)) juntos.set(id, r);
    }
    const lista = [...juntos.values()].map((p) => ({ ...p, empresa, autor })).sort((a, b) => b.atualizadoEm - a.atualizadoEm);
    enviados = new Map([...remotos.values()].map((r) => [r.id, r.atualizadoEm]));
    aplicarRemoto = true;
    useStore.setState({ projetos: lista, empresaPadrao: empresa, autorPadrao: autor });
    aplicarRemoto = false;

    // 2) envia o que só existe (ou é mais recente) neste computador, incluindo o perfil
    await enviar(true);

    // 3) ouve alterações feitas noutros dispositivos
    pararFns.push(onSnapshot(colI, (snap) => {
      snap.docChanges().forEach((c) => {
        if (c.type === 'removed') return;
        imagens.set(c.doc.id, (c.doc.data() as { imagem: string }).imagem);
        imagensEnviadas.add(c.doc.id);
      });
      // completa imagens que chegaram depois do projeto
      const st = useStore.getState();
      if (st.projetos.some((p) => p.plantas.some((pl) => !pl.imagem && imagens.get(pl.id)))) {
        aplicarRemoto = true;
        useStore.setState({ projetos: st.projetos.map((p) => ({ ...p, plantas: p.plantas.map((pl) => (pl.imagem ? pl : { ...pl, imagem: imagens.get(pl.id) ?? '' })) })) });
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
        const l = projetos.find((p) => p.id === c.doc.id);
        if (l && (l.atualizadoEm ?? 0) >= (r.atualizadoEm ?? 0)) return;
        const novo: Projeto = { ...r, empresa: st.empresaPadrao ?? r.empresa, autor: st.autorPadrao ?? r.autor, plantas: (r.plantas ?? []).map((pl) => ({ ...pl, imagem: imagens.get(pl.id) ?? l?.plantas.find((x) => x.id === pl.id)?.imagem ?? '' })) };
        enviados.set(r.id, r.atualizadoEm);
        projetos = l ? projetos.map((p) => (p.id === r.id ? novo : p)) : [novo, ...projetos];
        mudou = true;
      });
      if (mudou) {
        aplicarRemoto = true;
        useStore.setState({ projetos });
        aplicarRemoto = false;
      }
      useNuvem.setState({ estado: snap.metadata.fromCache && !navigator.onLine ? 'offline' : snap.metadata.hasPendingWrites ? 'a_sincronizar' : 'sincronizado' });
    }));
    pararFns.push(onSnapshot(docU, (d) => {
      if (d.metadata.hasPendingWrites || !d.exists()) return;
      const pr = (d.data() as { perfil?: { empresa: Projeto['empresa']; autor: Projeto['autor'] } }).perfil;
      if (!pr) return;
      const s = JSON.stringify(pr);
      if (s === perfilEnviado) return;
      perfilEnviado = s;
      aplicarRemoto = true;
      useStore.setState((st) => ({ empresaPadrao: pr.empresa, autorPadrao: pr.autor, projetos: st.projetos.map((p) => ({ ...p, empresa: pr.empresa, autor: pr.autor })) }));
      aplicarRemoto = false;
    }));

    // 4) envia as alterações locais (com um pequeno atraso para agrupar a escrita)
    pararFns.push(useStore.subscribe(() => {
      if (aplicarRemoto) return;
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
  const sPerfil = JSON.stringify(perfil);
  if (sPerfil !== perfilEnviado && (st.empresaPadrao || st.autorPadrao)) {
    perfilEnviado = sPerfil;
    tarefas.push(setDoc(doc(db, 'users', u.uid), { perfil }, { merge: true }));
  }

  const ids = new Set(st.projetos.map((p) => p.id));
  for (const p of st.projetos) {
    if (enviados.get(p.id) === p.atualizadoEm) continue;
    enviados.set(p.id, p.atualizadoEm);
    tarefas.push(setDoc(doc(db, 'users', u.uid, 'projetos', p.id), semPerfil(p)));
    for (const pl of p.plantas) {
      if (!pl.imagem || imagensEnviadas.has(pl.id)) continue;
      imagensEnviadas.add(pl.id);
      tarefas.push(setDoc(doc(db, 'users', u.uid, 'plantas', pl.id), { pid: p.id, imagem: pl.imagem }));
    }
  }
  if (!inicial) {
    for (const pid of [...enviados.keys()]) {
      if (ids.has(pid)) continue;
      enviados.delete(pid);
      tarefas.push(deleteDoc(doc(db, 'users', u.uid, 'projetos', pid)));
    }
    // imagens de plantas apagadas
    const vivas = new Set(st.projetos.flatMap((p) => p.plantas.map((pl) => pl.id)));
    for (const id of [...imagensEnviadas]) {
      if (vivas.has(id)) continue;
      imagensEnviadas.delete(id);
      tarefas.push(deleteDoc(doc(db, 'users', u.uid, 'plantas', id)));
    }
  }
  await Promise.all(tarefas);
  useNuvem.setState({ estado: navigator.onLine ? 'sincronizado' : 'offline' });
}

export function pararSincronizacao() {
  pararFns.forEach((f) => f());
  pararFns = [];
  if (timer) clearTimeout(timer);
  enviados = new Map();
  imagensEnviadas = new Set();
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
