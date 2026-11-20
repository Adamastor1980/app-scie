import type { Cat, Edificio, Projeto, Registo, TipoRegisto, UT } from '../data/types';
import { MAP_INFO, quadroXLI, quadroXXXIX, type MAP } from '../data/rtscie';
import { INSPECOES } from '../data/rjscie';
import { contexto } from './medidas';

export const TIPOS_REGISTO: Record<TipoRegisto, { nome: string; base: string; ajuda: string }> = {
  manutencao: {
    nome: 'Manutenção',
    base: 'art. 201.º n.º 1 c) RT-SCIE',
    ajuda: 'Ações de manutenção em instalações técnicas, equipamentos e sistemas de segurança: elemento intervencionado, tipo e motivo da ação, data e responsável.',
  },
  modificacao: {
    nome: 'Modificações e trabalhos perigosos',
    base: 'art. 201.º n.º 1 d) RT-SCIE',
    ajuda: 'Descrição sumária das modificações, alterações e trabalhos perigosos, com as datas de início e de finalização.',
  },
  ocorrencia: {
    nome: 'Ocorrências',
    base: 'art. 201.º n.º 1 e) RT-SCIE',
    ajuda: 'Ocorrências relacionadas com SCIE: alarmes intempestivos ou falsos, princípios de incêndio, atuação das equipas de intervenção.',
  },
  formacao: {
    nome: 'Sensibilização e formação',
    base: 'art. 206.º RT-SCIE',
    ajuda: 'Ações de sensibilização e formação em SCIE. A sensibilização de quem entra ao serviço deve ocorrer no prazo máximo de 60 dias (art. 206.º n.º 3).',
  },
  simulacro: {
    nome: 'Simulacros',
    base: 'art. 207.º RT-SCIE',
    ajuda: 'Os exercícios devem ser planeados, executados e avaliados (art. 207.º n.º 2 c)). Período máximo entre simulacros: quadro XLI.',
  },
  relatorio: {
    nome: 'Relatórios e inspeções',
    base: 'art. 201.º n.º 1 RT-SCIE · art. 19.º RJ-SCIE',
    ajuda: 'Guarda de relatórios relacionados com a SCIE: inspeções regulares e extraordinárias, vistorias, auditorias.',
  },
};

export const TIPOS_OCORRENCIA = ['Alarme intempestivo', 'Alarme falso', 'Princípio de incêndio', 'Atuação da equipa de intervenção', 'Outra'];
export const TIPOS_RELATORIO = ['Inspeção regular (art. 19.º RJ-SCIE)', 'Inspeção extraordinária (art. 19.º RJ-SCIE)', 'Vistoria', 'Auditoria', 'Outro'];
export const INSPECAO_REGULAR = TIPOS_RELATORIO[0];

/** RJ-SCIE art. 19.º n.os 4 e 5: periodicidade máxima das inspeções regulares (anos) ou null se excecionada */
export function inspecaoRegularAnos(ed: Edificio, ut: UT, cat: Cat): number | null {
  if (cat === 1 && [1, 2, 3, 6, 7, 8, 9, 10, 11, 12].includes(ut.tipo)) return null;
  // edifícios de utilização exclusiva da UT I da 2.ª categoria
  if (cat === 2 && ut.tipo === 1 && ed.uts.length === 1) return null;
  return INSPECOES[cat];
}

const anosDe = (t: string | null) => (t === 'Um ano' ? 1 : t === 'Dois anos' ? 2 : null);

export interface ExigenciasUT {
  ed: Edificio;
  ut: UT;
  cat: Cat;
  temDE: boolean;
  medidas: MAP[] | null;
  simulacroAnos: number | null;
  inspecaoAnos: number | null;
}

export function exigencias(p: Projeto): ExigenciasUT[] {
  return p.edificios.flatMap((ed) =>
    ed.uts.map((ut) => {
      const { cls } = contexto(ed, ut);
      const temDE = ut.espacos.some((e) => e.local === 'D' || e.local === 'E');
      const medidas = quadroXXXIX(ut.tipo, cls.cat, temDE);
      return {
        ed, ut, cat: cls.cat, temDE, medidas,
        simulacroAnos: medidas?.includes('simulacros') ? anosDe(quadroXLI(ut.tipo, cls.cat, temDE)) : null,
        inspecaoAnos: inspecaoRegularAnos(ed, ut, cls.cat),
      };
    }),
  );
}

export type EstadoPrazo = 'ok' | 'proximo' | 'atrasado' | 'sem_registo';

export interface Prazo {
  id: string;
  titulo: string;
  base: string;
  ut: UT;
  ed: Edificio;
  periodoAnos: number;
  ultima?: string;
  proxima?: string;
  estado: EstadoPrazo;
  nota?: string;
}

const somaAnos = (d: string, n: number) => {
  const x = new Date(d + 'T00:00');
  x.setFullYear(x.getFullYear() + n);
  return x.toISOString().slice(0, 10);
};

const abrange = (r: Registo, utId: string) => r.uts.length === 0 || r.uts.includes(utId);

function estado(proxima: string | undefined, hoje: string): EstadoPrazo {
  if (!proxima) return 'sem_registo';
  if (proxima < hoje) return 'atrasado';
  const lim = new Date(hoje + 'T00:00');
  lim.setDate(lim.getDate() + 90);
  return proxima <= lim.toISOString().slice(0, 10) ? 'proximo' : 'ok';
}

export function prazos(p: Projeto, hoje = new Date().toISOString().slice(0, 10)): Prazo[] {
  const regs = p.autoprotecao?.registos ?? [];
  const out: Prazo[] = [];
  for (const x of exigencias(p)) {
    if (x.simulacroAnos) {
      const ultima = regs.filter((r) => r.tipo === 'simulacro' && abrange(r, x.ut.id)).map((r) => r.data).sort().pop();
      const proxima = ultima ? somaAnos(ultima, x.simulacroAnos) : undefined;
      out.push({
        id: `sim-${x.ut.id}`, titulo: 'Simulacro', base: 'art. 207.º e quadro XLI RT-SCIE', ut: x.ut, ed: x.ed, periodoAnos: x.simulacroAnos,
        ultima, proxima, estado: estado(proxima, hoje),
        nota: x.ut.tipo === 4 ? 'UT IV: o simulacro deve ocorrer no início do ano escolar (art. 207.º n.º 2 b)).' : undefined,
      });
    }
    if (x.inspecaoAnos) {
      const ultima = regs.filter((r) => r.tipo === 'relatorio' && r.tipoAcao === INSPECAO_REGULAR && abrange(r, x.ut.id)).map((r) => r.data).sort().pop();
      const proxima = ultima ? somaAnos(ultima, x.inspecaoAnos) : undefined;
      out.push({
        id: `insp-${x.ut.id}`, titulo: 'Inspeção regular', base: 'art. 19.º n.º 4 RJ-SCIE', ut: x.ut, ed: x.ed, periodoAnos: x.inspecaoAnos,
        ultima, proxima, estado: estado(proxima, hoje),
        nota: x.cat === 1 ? 'Na 1.ª categoria, as inspeções são da competência do município (art. 19.º n.º 2 RJ-SCIE).' : 'A pedido do responsável (art. 19.º n.º 4 RJ-SCIE).',
      });
    }
  }
  return out;
}

export const nomeMAP = (m: MAP) => MAP_INFO[m];
