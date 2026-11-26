import type { Edificio, ExtintorInv, PlanoManut } from '../data/types';
import { classificar, pisosUT } from './calc';
import { dimensionarExtintores } from './extintores';
import { comparaPiso, litrosEqInv } from './manutencao';
import { nomeUT } from '../nome';
import { ROMANO } from '../data/rjscie';

/**
 * Verificação completa dos extintores existentes (plano de manutenção) contra o que a lei exige:
 * RT-SCIE, art. 163.º n.os 1 a 8 e condições específicas da UT (arts. 209.º a 211.º, 226.º, 273.º, 286.º, 307.º).
 * As exigências vêm do mesmo cálculo do dimensionamento (dimensionarExtintores); cada extintor existente
 * serve o geral do piso (sem indicação) ou uma exigência própria (campo «serve»).
 */

export type EstadoReq = 'cumpre' | 'falta' | 'verificar' | 'dados';
export interface Req {
  key: string; utId: string; ut: string;
  tipo: 'piso' | 'item' | 'outro' | 'manual';
  titulo: string; onde: string; base: string;
  qtd: number | null; qtdTxt?: string;
  piso?: number; area?: number; semAgua?: boolean;
  /** eficácia mínima por classe (ex.: { F: 25 } ou { A: 21, B: 113 }) */
  efic?: Record<string, number>;
  agentes?: ('po' | 'co2')[];
  capMin?: number;
}
export interface ResReq extends Req { estado: EstadoReq; texto: string; exts: ExtintorInv[]; problemas: string[] }

/** «21 A/113 B/C» → { A: 21, B: 113 }; «25F» → { F: 25 } */
export function parseEficacia(t: string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const m of t.matchAll(/(\d+)\s*([ABF])\b/g)) r[m[2]] = Math.max(r[m[2]] ?? 0, Number(m[1]));
  return r;
}
const eficReq = (desc: string): Record<string, number> | undefined => {
  if (/25F/.test(desc)) return { F: 25 };
  const m = /eficácia mínima (?:de )?([0-9][0-9A-Z /]*[A-Z])/.exec(desc) ?? /para riscos elétricos ([0-9]+ ?B)/.exec(desc);
  const e = m ? parseEficacia(m[1]) : {};
  return Object.keys(e).length ? e : undefined;
};
const agentesReq = (desc: string): ('po' | 'co2')[] | undefined => (/CO₂ ou pó/.test(desc) ? ['co2', 'po'] : /pó (químico )?(ABC|BC)|pó BC\/ABC/.test(desc) ? ['po'] : undefined);

const MANUAL = [
  { k: '15m', titulo: 'Distância a percorrer de qualquer saída de um local de risco até ao extintor mais próximo ≤ 15 m', base: 'RT-SCIE, art. 163.º n.º 1' },
  { k: 'instal', titulo: 'Extintores distribuídos, sinalizados, em suporte ou nicho, desimpedidos e com o manípulo a ≤ 1,2 m do pavimento', base: 'RT-SCIE, art. 163.º n.º 3' },
];

/** Exigências de um edifício (todas as UT) */
export function requisitos(ed: Edificio): { reqs: Req[]; porUT: { utId: string; ut: string; motivo: string; falta: string[] }[] } {
  const reqs: Req[] = [];
  const porUT: { utId: string; ut: string; motivo: string; falta: string[] }[] = [];
  for (const ut of ed.uts) {
    const r = dimensionarExtintores(ut, classificar(ut).cat);
    const nome = `UT ${ROMANO[ut.tipo]} — ${nomeUT(ut).nome}`;
    porUT.push({ utId: ut.id, ut: nome, motivo: r.motivo, falta: r.falta });
    const gareEl = ut.tipo === 8 && ut.extintores?.gare === 'eletrica';
    if (r.geral) for (const p of pisosUT(ut)) {
      const pi = r.pisos.find((x) => x.n === p.n);
      reqs.push({ key: `${ut.id}:piso:${p.n}`, utId: ut.id, ut: nome, tipo: 'piso', titulo: `${p.nome} — extintores do piso`, onde: p.nome, base: 'RT-SCIE, art. 163.º n.º 2', qtd: pi?.minN ?? null, piso: p.n, area: p.area, semAgua: gareEl });
    }
    for (const l of r.mapa) for (const it of l.itens) {
      if (it.cat === 'complemento' || it.base === 'RT-SCIE, art. 163.º n.º 2') continue;
      const key = `${ut.id}:${it.desc}|${l.onde}`;
      const movel = it.cat === 'movel';
      reqs.push({
        key, utId: ut.id, ut: nome, tipo: it.cat === 'outro' ? 'outro' : 'item', titulo: it.desc, onde: l.onde, base: it.base,
        qtd: it.qtd, qtdTxt: it.qtdTxt, efic: it.cat === 'outro' ? undefined : eficReq(it.desc), agentes: agentesReq(it.desc),
        capMin: movel ? (/50 kg/.test(it.desc) ? 50 : 20) : undefined,
      });
    }
  }
  if (ed.uts.length) for (const m of MANUAL) reqs.push({ key: `${ed.id}:${m.k}`, utId: '', ut: '', tipo: 'manual', titulo: m.titulo, onde: 'Todos os extintores', base: m.base, qtd: null });
  return { reqs, porUT };
}

/** Problemas de um extintor face a uma exigência (eficácia, agente, capacidade) */
function problemasExt(e: ExtintorInv, r: Req): { erro: string[]; verificar: string[] } {
  const erro: string[] = [], verificar: string[] = [];
  if (r.agentes && e.agente && !r.agentes.includes(e.agente as 'po' | 'co2')) erro.push(`${e.num}: agente ${e.agente === 'agua' ? 'água' : e.agente} — exige ${r.agentes.map((a) => (a === 'po' ? 'pó' : 'CO₂')).join(' ou ')}`);
  if (r.capMin && !(e.cap >= r.capMin)) erro.push(`${e.num}: ${e.cap || '?'} kg — exige extintor móvel${r.capMin >= 50 ? ' de 50 kg' : ''}`);
  if (r.efic) {
    const tem = parseEficacia(e.eficacia);
    if (!Object.keys(tem).length) verificar.push(`${e.num}: indique a eficácia (exige ${Object.entries(r.efic).map(([c, v]) => `${v} ${c}`).join('/')})`);
    else for (const [c, v] of Object.entries(r.efic)) if (!((tem[c] ?? 0) >= v)) erro.push(`${e.num}: eficácia ${e.eficacia} — exige ${v} ${c}`);
  }
  return { erro, verificar };
}

/** Verificação de um edifício: estado de cada exigência */
export function verificarEdificio(ed: Edificio, pl: PlanoManut): { porUT: ReturnType<typeof requisitos>['porUT']; res: ResReq[] } {
  const { reqs, porUT } = requisitos(ed);
  const exts = pl.extintores.filter((e) => e.edificio === ed.id);
  const keys = new Set(reqs.map((r) => r.key));
  const conf = pl.confirmados ?? {};
  // extintores sem exigência própria (ou com uma que já não existe) servem o geral do piso: a primeira UT com esse piso
  const geralDe = (e: ExtintorInv) => reqs.find((r) => r.tipo === 'piso' && r.piso === e.piso)?.key;
  const servidos = (r: Req) => exts.filter((e) => (e.serve && keys.has(e.serve) ? e.serve === r.key : r.tipo === 'piso' && geralDe(e) === r.key));
  const res = reqs.map((r): ResReq => {
    const ex = servidos(r);
    if (r.tipo === 'manual' || r.tipo === 'outro') {
      const ok = !!conf[r.key];
      return { ...r, exts: ex, problemas: [], estado: ok ? 'cumpre' : 'verificar', texto: ok ? 'Confirmado' : 'Confirmar no local' };
    }
    if (r.tipo === 'piso') {
      if (!(r.area && r.area > 0)) return { ...r, exts: ex, problemas: [], estado: 'dados', texto: 'Falta a área do piso' };
      const c = comparaPiso(r.piso!, r.area, ex);
      const prob = r.semAgua ? ex.filter((e) => e.agente === 'agua' || e.agente === 'espuma').map((e) => `${e.num}: água proibida com tração elétrica (art. 273.º n.º 1)`) : [];
      const naoContam = ex.filter((e) => litrosEqInv(e) === 0).map((e) => e.num);
      const t = c.cumpre ? `Exige ${c.minN} e ${c.litros} L · existem ${c.n} (${Math.round(c.litrosEx * 10) / 10} L)` : `Exige ${c.minN} e ${c.litros} L · existem ${c.n} (${Math.round(c.litrosEx * 10) / 10} L) — ${c.sugestao === 1 ? 'falta 1' : `faltam ${c.sugestao}`} (ex.: pó ABC 6 kg)`;
      return { ...r, exts: ex, problemas: [...prob, ...(naoContam.length ? [`Não contam para este critério: ${naoContam.join(', ')} (CO₂, móveis ou sem capacidade)`] : [])], estado: c.cumpre && !prob.length ? 'cumpre' : 'falta', texto: t };
    }
    const pr = ex.map((e) => problemasExt(e, r));
    const erro = pr.flatMap((x) => x.erro), verif = pr.flatMap((x) => x.verificar);
    if (r.qtd == null) {
      const ok = ex.length > 0 && !!conf[r.key] && !erro.length && !verif.length;
      return { ...r, exts: ex, problemas: [...erro, ...verif], estado: ok ? 'cumpre' : erro.length || !ex.length ? 'falta' : 'verificar', texto: `Exige ${r.qtdTxt} · ${ex.length ? `indicados ${ex.length}` : 'nenhum indicado'}${ex.length && !conf[r.key] ? ' — confirmar que chegam' : ''}` };
    }
    const falta = Math.max(0, r.qtd - ex.length);
    const estado: EstadoReq = falta || erro.length ? 'falta' : verif.length ? 'verificar' : 'cumpre';
    return { ...r, exts: ex, problemas: [...erro, ...verif], estado, texto: `Exige ${r.qtd} · existem ${ex.length}${falta ? ` — ${falta === 1 ? 'falta 1' : `faltam ${falta}`}` : ''}` };
  });
  return { porUT, res };
}

/** Opções do campo «Para que serve» de um extintor */
export const opcoesServe = (ed: Edificio) => requisitos(ed).reqs.filter((r) => r.tipo === 'item').map((r) => ({ v: r.key, t: `${r.titulo} — ${r.onde}` }));
