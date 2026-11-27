import type { PlanoSinal, SinalPiso } from '../data/types';

/**
 * Estudo de sinalética — RT-SCIE, arts. 108.º a 112.º (e arts. 163.º n.º 3 e 164.º para extintores e carretéis).
 * Pictogramas, cores e formatos: DL 141/95, Portaria 1456-A/95, EN ISO 7010, ISO 3864 e ISO 16069 (art. 108.º n.º 1) —
 * citados, não verificados pela app (textos fora de docs/legislacao/; D-41).
 * O resultado é um MÍNIMO por piso, a confirmar na planta.
 */

export const DIST_MIN = 6;
export const DIST_MAX = 50;
/** Art. 109.º: A ≥ d²/2000, com d entre 6 e 50 m. Devolve a área mínima (m²) e lados de referência (mm). */
export function areaPlaca(d: number) {
  const dd = Math.min(Math.max(d, DIST_MIN), DIST_MAX);
  const A = (dd * dd) / 2000;
  const lado = Math.ceil(Math.sqrt(A) * 1000);
  const alt = Math.ceil(Math.sqrt(A / 2) * 1000);
  return { d: dd, A, cm2: Math.ceil(A * 10000), quadrada: lado, retangular: [alt * 2, alt] as [number, number], limitada: dd !== d };
}

export interface PlacaItem { tipo: string; qtd: number; base: string; nota?: string }

export const PLACA = {
  saida: 'Saída',
  sentido: 'Sentido de evacuação (vias horizontais)',
  mudanca: 'Sentido de evacuação (mudança de direção)',
  escAcesso: 'Escada — n.º do andar ou saída (patamar de acesso)',
  escInter: 'Escada — sentido de evacuação (patamar intermédio)',
  extintor: 'Extintor',
  carretel: 'Boca de incêndio tipo carretel',
  botao: 'Botão de alarme',
} as const;

/** Placas mínimas de um piso */
export function placasPiso(sp: SinalPiso): PlacaItem[] {
  const it: PlacaItem[] = [];
  const add = (tipo: string, qtd: number, base: string, nota?: string) => { if (qtd > 0) it.push({ tipo, qtd, base, nota }); };
  add(PLACA.saida, sp.saidas, 'RT-SCIE, art. 112.º n.os 1 e 5', 'sobre cada saída, visível de qualquer ponto');
  const corr = sp.corredores.reduce((s, c) => s + (c.comp > 0 ? Math.ceil(c.comp / 30) : 0), 0);
  add(PLACA.sentido, corr, 'RT-SCIE, art. 112.º n.os 2 e 4', 'distância entre placas de 6 a 30 m; perpendiculares ou a 45° ao sentido da fuga');
  add(PLACA.mudanca, sp.mudancas, 'RT-SCIE, art. 112.º n.º 3', 'em cada mudança de direção, inequívoca');
  add(PLACA.escAcesso, sp.escadas, 'RT-SCIE, art. 112.º n.º 6');
  add(PLACA.escInter, sp.escadas, 'RT-SCIE, art. 112.º n.º 6', 'onde exista patamar intermédio');
  add(PLACA.extintor, sp.extintores, 'RT-SCIE, art. 163.º n.º 3');
  add(PLACA.carretel, sp.carreteis, 'RT-SCIE, art. 164.º');
  add(PLACA.botao, sp.botoes, 'RT-SCIE, art. 112.º n.º 2', 'localização dos meios de alarme');
  for (const o of sp.outros) add(o.texto.trim() || 'Outra placa', o.qtd, 'RT-SCIE, art. 108.º n.º 2');
  return it;
}

export function faltaPiso(sp: SinalPiso): [string, string][] {
  const f: [string, string][] = [];
  if (sp.piso === null) f.push(['Piso', 'para a listagem por andar']);
  if (!(sp.dist && sp.dist > 0)) f.push(['Distância de visão', 'maior distância a que as placas devem ser vistas; define o tamanho mínimo (art. 109.º)']);
  if (!sp.saidas && !sp.escadas) f.push(['Saídas ou escadas', 'cada piso tem pelo menos uma saída ou escada a sinalizar (art. 112.º)']);
  sp.corredores.forEach((c, i) => { if (!(c.comp > 0)) f.push([`Comprimento da via ${c.nome || i + 1}`, 'define as placas de sentido, de 30 em 30 m (art. 112.º n.º 4)']); });
  return f;
}

export const exigida = (pl?: PlanoSinal) => !pl || pl.aplic === 'exigida';

/** Totais por tipo de placa (todos os pisos) e maior placa mínima */
export function totaisSinal(pl: PlanoSinal) {
  const m = new Map<string, { qtd: number; base: string }>();
  for (const sp of pl.pisos) for (const i of placasPiso(sp)) {
    const a = m.get(i.tipo) ?? { qtd: 0, base: i.base };
    a.qtd += i.qtd; m.set(i.tipo, a);
  }
  const itens = [...m.entries()].map(([tipo, v]) => ({ tipo, ...v }));
  return { itens, total: itens.reduce((s, i) => s + i.qtd, 0) };
}

/* ---------- textos fixos: onde não é exigida, que placas, limites (página e documento) ---------- */

/** RT-SCIE, art. 108.º n.º 4 — onde a sinalização não é exigida */
export const NAO_EXIGIDA = [
  'Espaços comuns da utilização-tipo I (habitacional) da 1.ª categoria de risco.',
  'Fogos de habitação, em edifícios de qualquer categoria de risco.',
];

/** Que placas leva o espaço: dependem do que existe nele (iguais para todas as UT) */
export const PLACAS_POR_ELEMENTO: [string, string, string][] = [
  ['Saídas', 'Saída — visível de qualquer ponto onde a informação deva ser conhecida', 'RT-SCIE, art. 112.º n.os 1 e 5'],
  ['Vias horizontais de evacuação (corredores)', 'Sentido de evacuação, de 6 a 30 m entre placas, perpendicular ou a 45° ao sentido da fuga', 'RT-SCIE, art. 112.º n.os 2 e 4'],
  ['Mudanças de direção', 'Sentido de evacuação, inequívoco', 'RT-SCIE, art. 112.º n.º 3'],
  ['Escadas (vias verticais)', 'No patamar de acesso: n.º do andar ou saída; no patamar intermédio: sentido de evacuação', 'RT-SCIE, art. 112.º n.º 6'],
  ['Extintores', 'Sinalização do extintor', 'RT-SCIE, art. 163.º n.º 3'],
  ['Bocas de incêndio do tipo carretel', 'Sinalização do carretel', 'RT-SCIE, art. 164.º'],
  ['Meios de alarme e alerta (botões)', 'Sinalização da localização', 'RT-SCIE, art. 112.º n.º 2'],
];

/** Limites do estudo — mostrados na página e no documento, para não se ler o mínimo como contagem final */
export const LIMITES_SINAL = [
  'O número de placas só se determina com as plantas. A regra que mais decide — a sinalização visível de qualquer ponto onde a informação deva ser conhecida e, nos locais de permanência e nas vias acessíveis a público, uma placa de saída ou de sentido visível de qualquer ponto (RT-SCIE, arts. 111.º n.º 1 e 112.º n.os 1 e 5) — depende da geometria do espaço. A app conta apenas o mínimo que resulta dos dados introduzidos (saídas, comprimentos das vias, mudanças de direção, escadas e equipamentos); sem as plantas, não é a contagem final.',
  'A distância de visão, que define o tamanho mínimo (A ≥ d²/2000, art. 109.º), mede-se na planta.',
  'A posição exata de cada placa (perpendicular ou a 45° ao sentido da fuga, a menos de 2 m de uma fonte de luz, salientes entre 2,1 m e 3 m de altura) confirma-se na planta e no local (arts. 111.º e 112.º).',
  'Pictogramas, cores e formatos seguem o DL 141/95, a Portaria 1456-A/95 e as normas EN ISO 7010, ISO 3864 e ISO 16069 (art. 108.º n.º 1); estes textos não fazem parte da base legal da app e não são verificados.',
  'Só entram as placas dos elementos indicados; outros elementos a sinalizar (por exemplo, cortes de energia ou comandos) acrescentam-se à mão em «Outras placas».',
  'A iluminação de emergência (arts. 113.º a 115.º) não faz parte deste estudo.',
  'O estudo não verifica as placas que já existem num edifício (se existem e se cumprem).',
];
