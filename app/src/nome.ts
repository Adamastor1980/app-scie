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

/** «UT III «Administrativos» — Nome» para títulos e relatório */
export const tituloUT = (ut: UT) => `UT ${ROMANO[ut.tipo]} «${utInfo(ut.tipo).nome}» — ${nomeUT(ut).nome}`;

import type { Espaco, Projeto } from './data/types';
import { SUBTIPOS_C } from './data/rjscie';

const pisoCod = (piso: string) => {
  const m = piso.match(/-?\d+/);
  if (!m) return 'XX';
  const n = parseInt(m[0], 10);
  return n < 0 ? `S${-n}` : String(n).padStart(2, '0');
};

/** Código único de cada espaço: E{edifício}.{piso}.{n.º} — piso 00, 01…; S1, S2… abaixo do plano de referência */
export function codigosEspacos(p: Projeto): Map<string, string> {
  const out = new Map<string, string>();
  p.edificios.forEach((ed, ei) => {
    const cont = new Map<string, number>();
    for (const ut of ed.uts) {
      for (const e of ut.espacos) {
        const pc = pisoCod(e.piso);
        const n = (cont.get(pc) ?? 0) + 1;
        cont.set(pc, n);
        out.set(e.id, `E${ei + 1}.${pc}.${String(n).padStart(2, '0')}`);
      }
    }
  });
  return out;
}

/** Justificação curta do local de risco, com a norma do RJ-SCIE */
export function justificacaoLocal(e: Espaco, efetivo: number): string {
  const pub = e.efetivoPublico ?? 0;
  const c = e.subtipoC ? SUBTIPOS_C.find((s) => s.id === e.subtipoC)?.txt : undefined;
  switch (e.local) {
    case 'A':
      return efetivo > 100 || pub > 50
        ? `INCOERENTE: efetivo ${efetivo}${pub ? `, público ${pub}` : ''} excede os limites do local A — deve ser local B (art. 10.º n.º 1 b))`
        : `Efetivo ${efetivo} ≤ 100${pub ? ` e público ${pub} ≤ 50` : ''}, sem riscos agravados — art. 10.º n.º 1 a)`;
    case 'B':
      return efetivo > 100 || pub > 50
        ? `Efetivo ${efetivo}${pub ? `, público ${pub}` : ''}: ${efetivo > 100 ? 'efetivo > 100' : 'público > 50'} — art. 10.º n.º 1 b)`
        : `Efetivo ${efetivo}${pub ? `, público ${pub}` : ''}: conjunto de locais A no mesmo compartimento corta-fogo acima dos limites — art. 10.º n.º 2`;
    case 'C': return c ? `Art. 10.º n.º 3 ${c}` : 'Riscos agravados de eclosão e desenvolvimento de incêndio — art. 10.º n.º 1 c)';
    case 'Cag': return `Local C nas condições do art. 11.º n.º 3 (C agravado)${c ? `; ${c}` : ''}`;
    case 'D': return 'Pessoas acamadas, crianças ≤ 3 anos ou limitadas na mobilidade/perceção — art. 10.º n.º 1 d)';
    case 'E': return 'Local destinado a dormida — art. 10.º n.º 1 e)';
    case 'F': return 'Meios e sistemas essenciais à continuidade de atividades relevantes — art. 10.º n.º 1 f)';
  }
}
