// RT-SCIE — Portaria n.º 1532/2008, republicada pela Portaria n.º 135/2020, de 2 de junho.
// Transcrição dos quadros usados nos cálculos e nas medidas. Fonte: PDF da Portaria 135/2020 (docs/legislacao).
import type { Cat, UTNum } from './types';

/** Quadro XXVII (art. 51.º n.º 3) — índices de ocupação em pessoas/m² de área útil */
export const QUADRO_XXVII: { id: string; espaco: string; indice: number }[] = [
  { id: 'balneario-publico', espaco: 'Balneários e vestiários utilizados por público', indice: 1.0 },
  { id: 'balneario-func', espaco: 'Balneários e vestiários exclusivos para funcionários', indice: 0.3 },
  { id: 'bar-pe', espaco: 'Bares «zona de consumo com lugares em pé»', indice: 2.0 },
  { id: 'circ-comercial', espaco: 'Circulações horizontais e espaços comuns de estabelecimentos comerciais', indice: 0.2 },
  { id: 'pista-danca', espaco: 'Espaços afetos a pistas de dança em salões e discotecas', indice: 3.0 },
  { id: 'ensino', espaco: 'Espaços de ensino não especializado', indice: 0.6 },
  { id: 'galeria', espaco: 'Espaços de exposição de galerias de arte', indice: 0.7 },
  { id: 'museu', espaco: 'Espaços de exposição de museus', indice: 0.35 },
  { id: 'divulgacao', espaco: 'Espaços de exposição destinados à divulgação científica e técnica', indice: 0.35 },
  { id: 'oceanario', espaco: 'Espaços em oceanários, aquários, jardins e parques zoológicos ou botânicos', indice: 1.0 },
  { id: 'feiras', espaco: 'Espaços ocupados pelo público em outros locais de exposição ou feiras', indice: 3.0 },
  { id: 'lugares-pe', espaco: 'Espaços reservados a lugares de pé, em edifícios, tendas ou estruturas insufláveis, de salas de conferências, de reunião e de espetáculos, de recintos desportivos «galerias, terraços e zonas de peão», auditórios ou de locais de culto religioso', indice: 3.0 },
  { id: 'consulta', espaco: 'Gabinetes de consulta e bancos de urgência', indice: 0.3 },
  { id: 'gab-escritorio', espaco: 'Gabinetes de escritório', indice: 0.1 },
  { id: 'venda-baixa', espaco: 'Locais de venda de baixa ocupação de público', indice: 0.2 },
  { id: 'venda-1piso', espaco: 'Locais de venda localizados até um piso acima ou abaixo do plano de referência', indice: 0.35 },
  { id: 'venda-mais1', espaco: 'Locais de venda localizados mais de um piso acima do plano de referência', indice: 0.2 },
  { id: 'venda-pr-300', espaco: 'Locais de venda localizados no piso do plano de referência com área inferior ou igual a 300 m²', indice: 0.5 },
  { id: 'venda-pr-mais300', espaco: 'Locais de venda localizados no piso do plano de referência com área superior a 300 m²', indice: 0.6 },
  { id: 'embarque', espaco: 'Plataformas de embarque', indice: 3.0 },
  { id: 'refeitorio', espaco: 'Salas de convívio, refeitórios e zonas de restauração e bebidas com lugares sentados, permanentes ou eventuais, com ou sem espetáculo', indice: 1.0 },
  { id: 'desenho-lab', espaco: 'Salas de desenho e laboratórios', indice: 0.2 },
  { id: 'diagnostico', espaco: 'Salas de diagnóstico e terapêutica', indice: 0.2 },
  { id: 'sala-escritorio', espaco: 'Salas de escritório e secretarias', indice: 0.2 },
  { id: 'espera-consultas', espaco: 'Salas de espera de exames e de consultas', indice: 1.0 },
  { id: 'espera-gares', espaco: 'Salas de espera em gares e salas de embarque', indice: 1.0 },
  { id: 'cirurgia', espaco: 'Salas de intervenção cirúrgica e de partos', indice: 0.1 },
  { id: 'jogo', espaco: 'Salas de jogo e de diversão «espaços afetos ao público»', indice: 1.0 },
  { id: 'leitura-bib', espaco: 'Salas de leitura sem lugares fixos em bibliotecas', indice: 0.2 },
  { id: 'reuniao', espaco: 'Salas de reunião, de estudo e de leitura sem lugares fixos ou salas de estar', indice: 0.5 },
  { id: 'gimno', espaco: 'Zona de atividades «gimnodesportivos»', indice: 0.15 },
];

/** Quadro XXVI — apartamentos e moradias turísticas: 2(n+1) */
export const efetivoTipologia = (n: number) => 2 * (n + 1);

/* ---------------------------- Evacuação ---------------------------- */

/** Quadro XXIX (coberto) / XXX (ar livre) — número mínimo de saídas */
export function saidasMinimas(efetivo: number, arLivre = false): { n: number; texto: string } {
  if (efetivo <= 0) return { n: 0, texto: '—' };
  if (!arLivre) {
    if (efetivo <= 50) return { n: 1, texto: 'Uma (1 a 50)' };
    if (efetivo <= 1500) return { n: Math.ceil(efetivo / 500) + 1, texto: 'Uma por 500 pessoas ou fração, mais uma (51 a 1 500)' };
    if (efetivo <= 3000) return { n: Math.ceil(efetivo / 500), texto: 'Uma por 500 pessoas ou fração (1 501 a 3 000)' };
    return { n: 6, texto: 'Condicionado pelas distâncias a percorrer, com um mínimo de seis (> 3 000)' };
  }
  if (efetivo <= 150) return { n: 1, texto: 'Uma (1 a 150)' };
  if (efetivo <= 4500) return { n: Math.ceil(efetivo / 1500) + 1, texto: 'Uma por 1 500 pessoas ou fração, mais uma (151 a 4 500)' };
  if (efetivo <= 9000) return { n: Math.ceil(efetivo / 1500), texto: 'Uma por 1 500 pessoas ou fração (4 501 a 9 000)' };
  return { n: 6, texto: 'Condicionado pelas distâncias a percorrer, com um mínimo de seis (> 9 000)' };
}

/** Quadro XXXI (coberto) / XXXII (ar livre) — número mínimo de unidades de passagem */
export function upMinimas(efetivo: number, arLivre = false): { n: number; texto: string } {
  if (efetivo <= 0) return { n: 0, texto: '—' };
  if (!arLivre) {
    if (efetivo <= 50) return { n: 1, texto: 'Uma (1 a 50)' };
    if (efetivo <= 500) return { n: Math.ceil(efetivo / 100) + 1, texto: 'Uma por 100 pessoas ou fração, mais uma (51 a 500)' };
    return { n: Math.ceil(efetivo / 100), texto: 'Uma por 100 pessoas ou fração (> 500)' };
  }
  if (efetivo <= 150) return { n: 1, texto: 'Uma (1 a 150)' };
  if (efetivo <= 1500) return { n: Math.ceil(efetivo / 300) + 1, texto: 'Uma por 300 pessoas ou fração, mais uma (151 a 1 500)' };
  return { n: Math.ceil(efetivo / 300), texto: 'Uma por 300 pessoas ou fração (> 1 500)' };
}

/** Anexo I do RT-SCIE — classificação da altura do edifício */
export function classeAltura(h: number): 'Pequena' | 'Média' | 'Grande' | 'Muito grande' {
  if (h <= 9) return 'Pequena';
  if (h <= 28) return 'Média';
  if (h <= 50) return 'Grande';
  return 'Muito grande';
}

/* ------------------------- Resistência ao fogo ---------------------- */

const grupoIX = (ut: UTNum) => (ut === 2 || ut === 11 || ut === 12 ? 'B' : 'A');

/** Quadro IX (art. 15.º) — resistência ao fogo padrão mínima de elementos estruturais */
export function quadroIX(ut: UTNum, cat: Cat) {
  const A = { 1: [30, 30], 2: [60, 60], 3: [90, 90], 4: [120, 120] } as const;
  const B = { 1: [60, 60], 2: [90, 90], 3: [120, 120], 4: [180, 180] } as const;
  const v = (grupoIX(ut) === 'A' ? A : B)[cat];
  return { suporte: `R ${v[0]}`, compartimentacao: `REI ${v[1]}` };
}

/** Quadro X (art. 17.º) — escalão de tempo entre UT distintas (EI/REI) */
export function quadroX(ut: UTNum, cat: Cat) {
  const A = { 1: 30, 2: 60, 3: 90, 4: 120 };
  const B = { 1: 60, 2: 90, 3: 120, 4: 180 };
  return (grupoIX(ut) === 'A' ? A : B)[cat];
}

/** Quadro XI (art. 17.º) — proteção de vãos entre vias de evacuação protegidas e UT distintas */
export function quadroXI(ut: UTNum, cat: Cat) {
  const A = { 1: 'E 15 C', 2: 'E 30 C', 3: 'EI 45 C', 4: 'CCF' };
  const B = { 1: 'E 30 C', 2: 'EI 45 C', 3: 'CCF', 4: 'CCF' };
  return (grupoIX(ut) === 'A' ? A : B)[cat];
}

/** Quadro XII (art. 18.º) — áreas máximas de compartimento corta-fogo por piso */
export function quadroXII(ut: UTNum, temD: boolean): { acima: number | null; abaixo: number | null; nota?: string } {
  switch (ut) {
    case 2: return { acima: 6400, abaixo: 3200 };
    case 4: case 5: return temD ? { acima: 800, abaixo: 800, nota: 'Pisos com locais de risco D' } : { acima: 1600, abaixo: 1600, nota: 'Pisos sem locais de risco D' };
    case 11: return { acima: 800, abaixo: 400 };
    case 12: return { acima: null, abaixo: null, nota: 'As estabelecidas no artigo 302.º (quadro L)' };
    default: return { acima: 1600, abaixo: 1600 };
  }
}

/** Quadro L (art. 302.º) — compartimentação corta-fogo da UT XII; null = não aplicável; Infinity = sem limite */
export function quadroL(caso: 1 | 2 | 3 | 4, cat: Cat): { acima: number | null; abaixo: number | null } {
  const T: Record<number, { acima: (number | null)[]; abaixo: (number | null)[] }> = {
    1: { acima: [1600, 800, 400, 400], abaixo: [null, 400, 400, 400] },
    2: { acima: [6400, 2400, 800, 400], abaixo: [null, 800, 400, 400] },
    3: { acima: [12800, 4800, 2400, 1200], abaixo: [null, 2400, 800, 400] },
    4: { acima: [Infinity, Infinity, Infinity, Infinity], abaixo: [null, null, null, null] },
  };
  return { acima: T[caso].acima[cat - 1], abaixo: T[caso].abaixo[cat - 1] };
}

/** Quadros XIII a XVIII — envolvente de locais de risco */
export const ENVOLVENTE_LOCAIS: Record<string, { quadro: string; artigo: string; paredes: string; suporte: string; portas: string }> = {
  B: { quadro: 'XIII', artigo: '20.º', paredes: 'EI 30', suporte: 'REI 30', portas: 'E 15 C' },
  C: { quadro: 'XIV', artigo: '21.º n.º 1', paredes: 'EI 60', suporte: 'REI 60', portas: 'E 30 C' },
  Cag: { quadro: 'XV', artigo: '21.º n.º 3', paredes: 'EI 90', suporte: 'REI 90', portas: 'E 45 C' },
  D: { quadro: 'XVI', artigo: '22.º', paredes: 'EI 60', suporte: 'REI 60', portas: 'E 30 C' },
  E: { quadro: 'XVII', artigo: '23.º', paredes: 'EI 30', suporte: 'REI 30', portas: 'E 15 C' },
  F: { quadro: 'XVIII', artigo: '24.º', paredes: 'EI 90', suporte: 'REI 90', portas: 'E 45 C' },
};

/** Quadro XIX (art. 25.º) — vias horizontais de evacuação interiores protegidas */
export function quadroXIX(h: number) {
  if (h <= 9) return { paredes: 'EI 30', suporte: 'REI 30', portas: 'E 15 C' };
  if (h <= 50) return { paredes: 'EI 60', suporte: 'REI 60', portas: 'E 30 C' };
  return { paredes: 'EI 90', suporte: 'REI 90', portas: 'E 45 C' };
}

/** Quadro XXII (art. 27.º) — circulações verticais que não constituem vias de evacuação */
export function quadroXXII(h: number) {
  return h <= 28
    ? { paredes: 'EI 30', suporte: 'REI 30', portas: 'E 15 C' }
    : { paredes: 'EI 60', suporte: 'REI 60', portas: 'E 30 C' };
}

/** Quadro XXIII (art. 39.º) — reação ao fogo em vias horizontais */
export function quadroXXIII(h: number) {
  if (h <= 9) return { paredes: 'C-s3, d1', pavimentos: 'Dfl-s2', faixa: 'Ao ar livre e pisos até 9 m de altura' };
  if (h <= 28) return { paredes: 'C-s2, d0', pavimentos: 'Cfl-s2', faixa: 'Pisos entre 9 e 28 m de altura' };
  return { paredes: 'A2-s1, d0', pavimentos: 'Cfl-s1', faixa: 'Pisos acima de 28 m ou abaixo do plano de referência' };
}

/** Quadro XXIV (art. 40.º) — vias verticais e câmaras corta-fogo (interior) */
export function quadroXXIV(h: number) {
  return h <= 28
    ? { paredes: 'A2-s1, d0', pavimentos: 'Cfl-s1', faixa: 'Interior, edifícios de pequena ou média altura' }
    : { paredes: 'A1', pavimentos: 'Cfl-s1', faixa: 'Interior, edifícios de grande e muito grande altura' };
}

/** Quadro XXV (art. 41.º) — reação ao fogo em locais de risco */
export const QUADRO_XXV: Record<string, { paredes: string; pavimentos: string }> = {
  A: { paredes: 'D-s2, d2', pavimentos: 'Efl' },
  B: { paredes: 'A2-s1, d0', pavimentos: 'Cfl-s2' },
  C: { paredes: 'A1', pavimentos: 'A1fl' },
  D: { paredes: 'A1', pavimentos: 'Cfl-s2' },
  E: { paredes: 'A1', pavimentos: 'Cfl-s2' },
  F: { paredes: 'A1', pavimentos: 'Cfl-s2' },
};

/* ---------------------------- SADI ---------------------------------- */

/** Quadro XXXVI (art. 125.º) */
export const QUADRO_XXXVI = {
  linhas: [
    { comp: 'Botões de acionamento de alarme', c: [true, true, true] },
    { comp: 'Detetores automáticos', c: [true, true, true] },
    { comp: 'Central de sinalização e comando — temporizações', c: [false, true, true] },
    { comp: 'Central de sinalização e comando — alerta automático', c: [false, false, true] },
    { comp: 'Central de sinalização e comando — comandos', c: [false, true, true] },
    { comp: 'Fonte local de alimentação de emergência', c: [true, true, true] },
    { comp: 'Proteção total (todas as partes do edifício)', c: [false, false, true] },
    { comp: 'Proteção parcial (um ou mais compartimentos corta-fogo)', c: [true, true, false] },
    { comp: 'Difusão do alarme no interior', c: [true, true, true] },
    { comp: 'Difusão do alarme no exterior', c: [false, true, false] }, // quadro XXXVI tal como publicado (DR n.º 107, 2.6.2020, pág. 129): só na configuração 2
  ],
};

/* ------------------------- Sprinklers ------------------------------ */

/** Quadro XXXVII (art. 174.º) */
export const QUADRO_XXXVII: Record<string, { densidade: number; area: number; n: number; calibre: number; tempo: number }> = {
  II: { densidade: 5, area: 144, n: 12, calibre: 15, tempo: 60 },
  'III, VI, VII, VIII': { densidade: 5, area: 216, n: 18, calibre: 15, tempo: 60 },
  XII: { densidade: 10, area: 260, n: 29, calibre: 20, tempo: 90 },
};

/* ------------------------- Autoproteção ---------------------------- */

export type MAP = 'registos' | 'procPrevencao' | 'planoPrevencao' | 'procEmergencia' | 'pei' | 'formacao' | 'simulacros';

export const MAP_INFO: Record<MAP, { nome: string; art: string }> = {
  registos: { nome: 'Registos de segurança', art: '201.º' },
  procPrevencao: { nome: 'Procedimentos de prevenção', art: '202.º' },
  planoPrevencao: { nome: 'Plano de prevenção', art: '203.º' },
  procEmergencia: { nome: 'Procedimentos em caso de emergência', art: '204.º' },
  pei: { nome: 'Plano de emergência interno', art: '205.º' },
  formacao: { nome: 'Ações de sensibilização e formação em SCIE', art: '206.º' },
  simulacros: { nome: 'Simulacros', art: '207.º' },
};

/**
 * Quadro XXXIX (art. 198.º) — medidas de autoproteção exigíveis.
 * Leitura das colunas do quadro: o plano de prevenção integra os procedimentos de prevenção
 * (art. 203.º n.º 1 c)) e o PEI integra os procedimentos de emergência (art. 205.º).
 */
export function quadroXXXIX(ut: UTNum, cat: Cat, temDE: boolean): MAP[] | null {
  const base: MAP[] = ['registos', 'procPrevencao'];
  const medio: MAP[] = ['registos', 'planoPrevencao', 'procEmergencia', 'formacao'];
  const alto: MAP[] = ['registos', 'planoPrevencao', 'pei', 'formacao', 'simulacros'];
  // UT I (3.ª) e UT II (2.ª): procedimentos de prevenção (art. 202.º), não plano de prevenção — posição das marcas no quadro XXXIX
  const medioProc: MAP[] = ['registos', 'procPrevencao', 'procEmergencia', 'formacao'];
  if (ut === 1) {
    if (cat === 3) return medioProc;
    if (cat === 4) return alto;
    return null; // art. 22.º n.º 1 do RJ-SCIE: UT I das 1.ª e 2.ª categorias excluídas
  }
  if (ut === 2 && cat === 2) return medioProc;
  if (ut === 4 || ut === 5 || ut === 7) {
    if (cat === 1 && !temDE) return base;
    if ((cat === 1 && temDE) || (cat === 2 && !temDE)) return medio;
    return alto;
  }
  if (cat === 1) return base;
  if (cat === 2) return medio;
  return alto;
}

/** Quadro XLI (art. 207.º) — período máximo entre simulacros */
export function quadroXLI(ut: UTNum, cat: Cat, temDE: boolean): string | null {
  if (ut === 1) return cat === 4 ? 'Dois anos' : null;
  if (ut === 2) return cat >= 3 ? 'Dois anos' : null;
  if (ut === 6 || ut === 9 || ut === 3 || ut === 8 || ut === 10 || ut === 11 || ut === 12) {
    if (cat === 4) return 'Um ano';
    if (cat >= 2) return 'Dois anos';
    return null;
  }
  // IV, V, VII
  if ((cat === 2 && temDE) || cat >= 3) return 'Um ano';
  return null;
}

/** Quadro LI (art. 304.º) — UT XII: distâncias máximas nos locais */
export function quadroLI(cat: Cat) {
  if (cat === 1) return { impasse: 25, alternativa: 80 };
  if (cat === 2) return { impasse: 25, alternativa: 60 };
  return { impasse: 15, alternativa: 40 };
}

/** Quadro XLIX (art. 300.º) — UT XII: distâncias mínimas entre edifícios */
export function quadroXLIX(cat: Cat, h: number) {
  if (cat === 1) return h <= 9 ? 4 : 8;
  if (cat === 2) return h <= 9 ? 8 : 12;
  return 16;
}

/** Título VIII — capítulos das condições específicas por UT (intervalos de artigos; as UT III e IV não têm capítulo próprio) */
export const ESPECIFICAS: Partial<Record<UTNum, [number, number]>> = {
  1: [208, 213], 2: [214, 228], 5: [229, 237], 6: [238, 255], 7: [256, 257],
  8: [258, 278], 9: [279, 288], 10: [289, 295], 11: [296, 299], 12: [300, 309],
};
