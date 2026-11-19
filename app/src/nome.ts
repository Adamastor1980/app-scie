import type { UT } from './data/types';
import { ROMANO, utInfo } from './data/rjscie';

const padrao = (ut: UT) => `UT ${ROMANO[ut.tipo]} — ${utInfo(ut.tipo).nome}`;

/** Nome a mostrar da UT: o nome dado à UT; senão os espaços; senão os compartimentos da carga de incêndio */
export function nomeUT(ut: UT): { nome: string; temNome: boolean } {
  const d = ut.designacao.trim();
  if (d && d !== padrao(ut)) return { nome: d.replace(/^UT [IVX]+ — /, ''), temNome: true };
  const esp = ut.espacos.map((e) => e.nome.trim()).filter(Boolean);
  if (esp.length === 1) return { nome: esp[0], temNome: true };
  if (esp.length > 1) return { nome: `${esp[0]} +${esp.length - 1}`, temNome: true };
  const comp = ut.compartimentos.map((c) => c.nome.trim()).filter((n) => n && !/^Compartimento corta-fogo \d+$/.test(n));
  if (comp.length === 1) return { nome: comp[0], temNome: true };
  if (comp.length > 1) return { nome: `${comp[0]} +${comp.length - 1}`, temNome: true };
  return { nome: `Sem nome · ${utInfo(ut.tipo).nome}`, temNome: false };
}

/** «UT III — Nome» para títulos e relatório */
export const tituloUT = (ut: UT) => `UT ${ROMANO[ut.tipo]} — ${nomeUT(ut).nome}`;
