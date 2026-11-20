import type { Cat, Edificio, Projeto, Registo, TipoRegisto, UT } from '../data/types';
import { MAP_INFO, quadroXLI, quadroXXXIX, type MAP } from '../data/rtscie';
import { INSPECOES } from '../data/rjscie';
import { contexto } from './medidas';

/** Registos de segurança — art. 201.º n.º 1 do RT-SCIE (texto republicado pela Portaria 135/2020), alíneas a) a g) */
export const TIPOS_REGISTO: Record<TipoRegisto, { nome: string; base: string; ajuda: string }> = {
  relatorio: {
    nome: 'Vistorias e inspeções',
    base: 'art. 201.º n.º 1 a) RT-SCIE · art. 19.º RJ-SCIE',
    ajuda: 'Relatórios de vistoria e de inspeção ou fiscalização de condições de segurança realizadas por entidades externas, nomeadamente pelas autoridades competentes.',
  },
  anomalia: {
    nome: 'Anomalias',
    base: 'art. 201.º n.º 1 b) RT-SCIE',
    ajuda: 'Anomalias observadas nas operações de verificação, conservação ou manutenção das instalações técnicas, dos sistemas e dos equipamentos de segurança: descrição, impacte, data de deteção e duração da reparação.',
  },
  manutencao: {
    nome: 'Manutenção',
    base: 'art. 201.º n.º 1 c) RT-SCIE',
    ajuda: 'Ações de manutenção em instalações técnicas, equipamentos e sistemas de segurança, com indicação do elemento intervencionado, tipo e motivo de ação efetuada, data e responsável.',
  },
  modificacao: {
    nome: 'Modificações e trabalhos perigosos',
    base: 'art. 201.º n.º 1 d) e art. 197.º RT-SCIE',
    ajuda: 'Descrição sumária das modificações, alterações e trabalhos perigosos, com as datas de início e de finalização. Trabalhos com risco de incêndio ou explosão carecem de autorização expressa do RS (art. 197.º n.os 3 e 4).',
  },
  ocorrencia: {
    nome: 'Ocorrências',
    base: 'art. 201.º n.º 1 e) RT-SCIE',
    ajuda: 'Relatórios de ocorrências relacionadas com a SCIE, nomeadamente alarmes intempestivos ou falsos, princípios de incêndio ou atuação de equipas de intervenção.',
  },
  bombeiros: {
    nome: 'Intervenção dos bombeiros',
    base: 'art. 201.º n.º 1 f) RT-SCIE',
    ajuda: 'Cópia dos relatórios de intervenção dos bombeiros, em incêndios ou outras emergências na entidade (junte fotografia/digitalização do relatório).',
  },
  formacao: {
    nome: 'Formação',
    base: 'art. 201.º n.º 1 g) e art. 206.º RT-SCIE',
    ajuda: 'Relatório sucinto da ação de formação, com menção dos aspetos mais relevantes. A sensibilização de quem entra ao serviço deve ocorrer no prazo máximo de 60 dias (art. 206.º n.º 3).',
  },
  simulacro: {
    nome: 'Simulacros',
    base: 'art. 201.º n.º 1 g) e art. 207.º RT-SCIE',
    ajuda: 'Relatório sucinto do simulacro, com menção dos aspetos mais relevantes. Os exercícios devem ser planeados, executados e avaliados, acompanhados por observadores, com informação prévia aos ocupantes (art. 207.º n.º 2 c) a e)).',
  },
};

export const TIPOS_OCORRENCIA = ['Alarme intempestivo', 'Alarme falso', 'Princípio de incêndio', 'Atuação da equipa de intervenção', 'Outra'];
export const TIPOS_RELATORIO = ['Inspeção regular (art. 19.º RJ-SCIE)', 'Inspeção extraordinária (art. 19.º RJ-SCIE)', 'Vistoria', 'Fiscalização', 'Outro'];
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
