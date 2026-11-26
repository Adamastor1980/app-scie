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
