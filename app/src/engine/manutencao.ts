import type { AgenteInv, ExtintorInv, PlanoManut, Projeto, RegistoManut, TipoManut } from '../data/types';
import { CONVERSAO, dimensionarExtintores, exigidosPorArea } from './extintores';
import { classificar } from './calc';

/**
 * Plano de manutenção de extintores.
 * Registo das ações de manutenção: RT-SCIE, art. 201.º n.º 1 c) (elemento, tipo e motivo, data e responsável).
 * Programa com calendário: RT-SCIE, art. 202.º n.º 4. Empresa de manutenção registada na ANEPC: RJ-SCIE, art. 23.º.
 * Periodicidade: 12 meses por omissão — critério da NP 4413 (norma de manutenção para que remete o anexo I, art. 8.º n.º 9); configurável.
 */

export const NOME_AGENTE_INV: Record<AgenteInv, string> = { agua: 'Água', espuma: 'Espuma', po: 'Pó químico ABC', co2: 'CO₂', outro: 'Outro' };
export const UNID_INV: Record<AgenteInv, string> = { agua: 'L', espuma: 'L', po: 'kg', co2: 'kg', outro: '' };
export const TIPO_MANUT: Record<TipoManut, string> = {
  manutencao: 'Manutenção periódica', recarga: 'Recarga', prova: 'Prova hidráulica', substituicao: 'Substituição do extintor', outra: 'Outra intervenção',
};
/** dias de antecedência a partir dos quais o aviso passa a laranja */
export const AVISO_DIAS = 60;

export const descExt = (e: ExtintorInv) => (e.agente ? `${NOME_AGENTE_INV[e.agente]}${e.cap > 0 ? ` ${String(e.cap).replace('.', ',')} ${UNID_INV[e.agente]}` : ''}` : e.eficacia ? `agente por indicar (eficácia ${e.eficacia})` : '—');
export const rotuloPisoInv = (n: number | null) => (n === null ? '—' : n === 0 ? 'Piso 0 (r/c)' : `Piso ${n}`);
export const dataPt = (iso?: string) => (iso ? new Date(iso + 'T00:00').toLocaleDateString('pt-PT') : '—');
export const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** soma meses a uma data ISO (fim de mês ajustado: 31/01 + 1 mês = 28 ou 29/02) */
export function somaMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ult = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ult));
  return alvo.toISOString().slice(0, 10);
}
export function diasEntre(deISO: string, ateISO: string): number {
  const f = (s: string) => { const [a, m, d] = s.split('-').map(Number); return Date.UTC(a, m - 1, d); };
  return Math.round((f(ateISO) - f(deISO)) / 86_400_000);
}

export type Nivel = 'sem' | 'ok' | 'breve' | 'atraso';
export interface EstadoExt { ultima?: RegistoManut; proxima?: string; dias?: number; nivel: Nivel; naoConforme: boolean; texto: string }

/** Estado de um extintor: a próxima manutenção conta a partir da última intervenção registada */
export function estadoExt(e: ExtintorInv, periodoMeses: number, hoje = hojeISO()): EstadoExt {
  const regs = e.registos.filter((r) => r.data).sort((a, b) => b.data.localeCompare(a.data));
  const ultima = regs[0];
  if (!ultima) return { nivel: 'sem', naoConforme: false, texto: 'Sem manutenção registada' };
  const proxima = somaMeses(ultima.data, periodoMeses);
  const dias = diasEntre(hoje, proxima);
  const nivel: Nivel = dias < 0 ? 'atraso' : dias <= AVISO_DIAS ? 'breve' : 'ok';
  const texto = dias < 0 ? `Em atraso há ${-dias} ${-dias === 1 ? 'dia' : 'dias'}` : dias === 0 ? 'Manutenção hoje' : `Faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  return { ultima, proxima, dias, nivel, naoConforme: ultima.resultado === 'nao_conforme', texto };
}

/** Campos obrigatórios do extintor por preencher: [campo, para que serve] */
export function faltaExt(e: ExtintorInv): [string, string][] {
  const f: [string, string][] = [];
  if (e.piso === null) f.push(['Piso', 'para a listagem por andar e para encontrar o extintor']);
  if (!e.local.trim()) f.push(['Local', 'onde está o extintor dentro do piso (ex.: junto à saída da receção)']);
  if (!e.agente) f.push(['Agente', 'tipo de extintor (água, espuma, pó, CO₂)']);
  if (!(e.cap > 0)) f.push(['Capacidade', 'carga do extintor (L ou kg)']);
  return f;
}
/** Campos obrigatórios do registo — RT-SCIE, art. 201.º n.º 1 c); RJ-SCIE, art. 23.º */
export function faltaReg(r: RegistoManut): [string, string][] {
  const f: [string, string][] = [];
  if (!r.data) f.push(['Data', 'conta a próxima manutenção a partir dela (RT-SCIE, art. 201.º n.º 1 c))']);
  if (!r.empresa.trim()) f.push(['Empresa', 'responsável pela intervenção (RT-SCIE, art. 201.º n.º 1 c))']);
  if (!r.registoAnepc.trim()) f.push(['N.º de registo ANEPC', 'a empresa de manutenção tem de estar registada na ANEPC (RJ-SCIE, art. 23.º)']);
  if (!r.tecnico.trim()) f.push(['Técnico', 'quem fez a intervenção (responsável — RT-SCIE, art. 201.º n.º 1 c))']);
  if (!r.resultado) f.push(['Resultado', 'conforme ou não conforme, como indicado pela empresa']);
  return f;
}

/** Próximo n.º livre: EXT-01, EXT-02… */
export function proximoNum(lista: ExtintorInv[]): string {
  const max = lista.reduce((m, e) => { const k = /(\d+)\s*$/.exec(e.num); return k ? Math.max(m, Number(k[1])) : m; }, 0);
  return `EXT-${String(max + 1).padStart(2, '0')}`;
}

/** Ordem da listagem: edifício (ordem do projeto), piso, n.º */
export function ordenar(lista: ExtintorInv[], ordemEd: string[]): ExtintorInv[] {
  return [...lista].sort((a, b) => (ordemEd.indexOf(a.edificio) - ordemEd.indexOf(b.edificio)) || ((a.piso ?? 999) - (b.piso ?? 999)) || a.num.localeCompare(b.num, 'pt', { numeric: true }));
}

export function resumoManut(pl: PlanoManut | undefined, hoje = hojeISO()) {
  const r = { total: 0, atraso: 0, breve: 0, ok: 0, sem: 0, naoConforme: 0, incompletos: 0 };
  for (const e of pl?.extintores ?? []) {
    const s = estadoExt(e, pl!.periodoMeses, hoje);
    r.total++; r[s.nivel]++;
    if (s.naoConforme) r.naoConforme++;
    if (faltaExt(e).length) r.incompletos++;
  }
  return r;
}

/* ---------- inventário gerado a partir do mapa de extintores (projetos de dimensionamento) ---------- */

const pisoDeTexto = (t: string): number | null => { const m = /piso\s*([−-]?\d+)/i.exec(t); return m ? Number(m[1].replace('−', '-')) : null; };
const agenteDeTexto = (t: string): AgenteInv | '' => (/CO₂/.test(t) ? 'co2' : /pó/i.test(t) ? 'po' : /água/i.test(t) ? 'agua' : /espuma/i.test(t) ? 'espuma' : '');
const capDeTexto = (t: string): number => { const m = /(\d+(?:,\d+)?)\s*(kg|L)\b/.exec(t); return m ? Number(m[1].replace(',', '.')) : 0; };
const eficaciaDeTexto = (t: string): string => { const m = /eficácia mínima (?:de )?([0-9][0-9A-Z /]*[A-Z])/.exec(t); return m ? m[1].trim() : ''; };

/**
 * Um extintor do inventário por cada extintor do mapa: pisos (agente e capacidade escolhidos), locais e situações próprias,
 * móveis e complemento de CO₂. Os itens sem número fixo («1 em cada», «1 por compartimento») não entram: ficam em «porContar».
 */
export function inventarioDoMapa(p: Projeto, existentes: ExtintorInv[] = []): { novos: ExtintorInv[]; porContar: string[] } {
  const novos: ExtintorInv[] = [];
  const porContar: string[] = [];
  let k = existentes.reduce((m, e) => { const x = /(\d+)\s*$/.exec(e.num); return x ? Math.max(m, Number(x[1])) : m; }, 0);
  const mk = (edificio: string, x: Partial<ExtintorInv>): ExtintorInv => ({
    id: `${Date.now().toString(36)}-${(++k).toString(36)}-${Math.random().toString(36).slice(2, 7)}`, num: `EXT-${String(k).padStart(2, '0')}`,
    edificio, piso: null, local: '', agente: '', cap: 0, eficacia: '', fabricante: '', serie: '', registos: [], ...x,
  });
  for (const ed of p.edificios) for (const ut of ed.uts) {
    const r = dimensionarExtintores(ut, classificar(ut).cat);
    for (const pi of r.pisos) for (let i = 0; i < (pi.area > 0 ? pi.qtd : 0); i++) novos.push(mk(ed.id, { piso: pi.n, agente: pi.agente, cap: pi.cap }));
    for (const l of r.mapa) for (const it of l.itens) {
      if (it.cat === 'outro' || it.base === 'RT-SCIE, art. 163.º n.º 2') continue; // manta e areia não são extintores; pisos já contados
      if (it.qtd == null) { porContar.push(`${it.desc} (${it.qtdTxt})`); continue; }
      const movel = it.cat === 'movel';
      for (let i = 0; i < it.qtd; i++) novos.push(mk(ed.id, {
        piso: pisoDeTexto(l.onde), local: movel ? `${l.onde} — extintor móvel` : l.onde,
        agente: agenteDeTexto(it.desc), cap: movel && /50 kg/.test(it.desc) ? 50 : capDeTexto(it.desc), eficacia: eficaciaDeTexto(it.desc) || (/25F/.test(it.desc) ? '25F' : ''),
      }));
    }
  }
  return { novos, porContar };
}

/* ---------- existente × exigido por piso (RT-SCIE, art. 163.º n.º 2) ---------- */

/** Litros de água equivalentes de um extintor existente: água e espuma 1:1 (critério técnico, D-40); pó pela conversão do critério técnico (D-36); CO₂ e móveis não contam */
export function litrosEqInv(e: ExtintorInv): number {
  if (!(e.cap > 0) || e.cap >= 25) return 0;
  if (e.agente === 'agua' || e.agente === 'espuma') return e.cap;
  if (e.agente === 'po') return e.cap / CONVERSAO.po.fator;
  return 0;
}
export const contaParaN2 = (e: ExtintorInv) => litrosEqInv(e) > 0;

export interface ComparaPiso { piso: number; area: number; minN: number; litros: number; n: number; litrosEx: number; cumpre: boolean; faltaN: number; faltaL: number; sugestao: number }
export function comparaPiso(piso: number, area: number, exts: ExtintorInv[]): ComparaPiso {
  const { minN, litros } = exigidosPorArea(area);
  const conta = exts.filter(contaParaN2);
  const n = conta.length;
  const litrosEx = conta.reduce((s, e) => s + litrosEqInv(e), 0);
  const faltaN = Math.max(0, minN - n);
  const faltaL = Math.max(0, litros - litrosEx);
  // sugestão: n.º de extintores de pó ABC 6 kg (= 12 L) que resolve as duas alíneas
  const sugestao = Math.max(faltaN, Math.ceil(faltaL / (6 / CONVERSAO.po.fator)));
  return { piso, area, minN, litros, n, litrosEx, cumpre: area > 0 && faltaN === 0 && faltaL === 0, faltaN, faltaL, sugestao };
}

/** Pisos a verificar num edifício: os que têm extintores ou área indicada */
export function comparaEdificio(pl: PlanoManut, edificio: string): ComparaPiso[] {
  const areas = pl.areas?.[edificio] ?? {};
  const doEd = pl.extintores.filter((e) => e.edificio === edificio && e.piso !== null);
  const pisos = [...new Set([...doEd.map((e) => e.piso as number), ...Object.keys(areas).map(Number)])].sort((a, b) => a - b);
  return pisos.map((pi) => comparaPiso(pi, areas[String(pi)] ?? 0, doEd.filter((e) => e.piso === pi)));
}

/* ---------- QR, pesquisa pelo número e registo rápido ---------- */

/** Endereço gravado no QR de cada extintor: abre a ficha (dono) ou a ficha pública (cliente) */
export const urlExt = (pid: string, eid: string, base = `${location.origin}${location.pathname}`) => `${base}#/x/${pid}/${eid}`;
/** Lê um QR (endereço da app) → { pid, eid } */
export function lerUrlExt(t: string): { pid: string; eid: string } | null {
  const m = /#\/x\/([^/?#\s]+)\/([^/?#\s]+)/.exec(t);
  return m ? { pid: decodeURIComponent(m[1]), eid: decodeURIComponent(m[2]) } : null;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s._-]+/g, '');
/** Pesquisa pelo número escrito no extintor: exato primeiro («7» encontra EXT-07), depois parcial; também pelo local */
export function procurarExt(lista: ExtintorInv[], q: string): ExtintorInv[] {
  const n = norm(q);
  if (!n) return [];
  const so = n.replace(/^0+/, '');
  const num = (e: ExtintorInv) => norm(e.num);
  const digitos = (e: ExtintorInv) => (/(\d+)\s*$/.exec(e.num)?.[1] ?? '').replace(/^0+/, '');
  const exatos = lista.filter((e) => num(e) === n || (/^\d+$/.test(n) && digitos(e) === so));
  const parciais = lista.filter((e) => !exatos.includes(e) && (num(e).includes(n) || norm(e.local).includes(n) || norm(e.serie).includes(n)));
  return [...exatos, ...parciais];
}

/** Registo rápido «manutenção efetuada, tudo conforme» com a empresa indicada */
export const registoOK = (empresa: PlanoManut['empresa'], data = hojeISO(), id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`): RegistoManut => ({
  id, data, tipo: 'manutencao', resultado: 'conforme', empresa: empresa.nome, registoAnepc: empresa.registoAnepc, tecnico: empresa.tecnico, obs: 'Manutenção efetuada — tudo conforme',
});
export const faltaEmpresa = (empresa: PlanoManut['empresa']): [string, string][] => faltaReg({ id: '', data: hojeISO(), tipo: 'manutencao', resultado: 'conforme', empresa: empresa.nome, registoAnepc: empresa.registoAnepc, tecnico: empresa.tecnico, obs: '' });

/** Ficha pública (só leitura): o mínimo para o cliente ver o estado e o histórico de cada extintor */
export interface FichaPublicaDoc {
  dono: string; atualizadoEm: number; projeto: string; cliente: string; morada: string;
  empresa: { nome: string; telefone: string; email: string };
  periodoMeses: number;
  extintores: { id: string; num: string; edificio: string; piso: number | null; local: string; desc: string; eficacia: string; ano?: number; registos: Omit<RegistoManut, 'id'>[] }[];
}
export function fichaPublica(p: Projeto, dono: string): FichaPublicaDoc {
  const pl = p.manutencao!;
  const nomeEd = (id: string) => p.edificios.find((e) => e.id === id)?.nome ?? '';
  return {
    dono, atualizadoEm: p.atualizadoEm, projeto: p.nome, cliente: p.cliente, morada: [p.morada, p.concelho].filter(Boolean).join(', '),
    empresa: { nome: p.empresa.nome, telefone: p.empresa.telefone, email: p.empresa.email },
    periodoMeses: pl.periodoMeses,
    extintores: pl.extintores.map((e) => ({
      id: e.id, num: e.num, edificio: nomeEd(e.edificio), piso: e.piso, local: e.local, desc: descExt(e), eficacia: e.eficacia, ...(e.ano ? { ano: e.ano } : {}),
      registos: [...e.registos].sort((a, b) => b.data.localeCompare(a.data)).map(({ id: _i, ...r }) => r), // eslint-disable-line @typescript-eslint/no-unused-vars
    })),
  };
}
