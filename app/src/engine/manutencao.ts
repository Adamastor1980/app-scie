import type { AgenteInv, ExtintorInv, PlanoManut, Projeto, RegistoManut, TipoManut } from '../data/types';
import { dimensionarExtintores } from './extintores';
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
