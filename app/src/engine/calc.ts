import type { Cat, Compartimento, Espaco, Risco, UT } from '../data/types';
import { ANEXO_III } from '../data/rjscie';
import { QUADRO_XXVII, efetivoTipologia } from '../data/rtscie';

export const RAI: Record<Risco, number> = { A: 2.0, M: 1.5, B: 1.0 };
export const RAI_NOME: Record<Risco, string> = { A: 'Alto', M: 'Médio', B: 'Baixo' };

/** Art. 6.º do Despacho — coeficiente de combustibilidade Ci */
export const CI_OPCOES = [
  { v: 1.6, rotulo: 'Risco alto — 1,60', det: 'Gases liquefeitos com tensão de vapor a 15 °C > 28 kPa; líquidos com ponto de inflamação < 38 °C; sólidos com ponto de inflamação < 100 °C; produtos que formam misturas explosivas com o ar; produtos suscetíveis de combustão espontânea.' },
  { v: 1.3, rotulo: 'Risco médio — 1,30', det: 'Líquidos com ponto de inflamação entre 38 e 100 °C; sólidos com ponto de inflamação entre 100 e 200 °C; sólidos suscetíveis de emitir vapores inflamáveis.' },
  { v: 1.0, rotulo: 'Risco baixo — 1,00', det: 'Líquidos com ponto de inflamação > 100 °C; sólidos com ponto de inflamação > 200 °C.' },
];

export const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
export const fmt = (v: number | undefined | null, d = 0) =>
  v === undefined || v === null || Number.isNaN(v)
    ? '—'
    : v === Infinity
      ? 'sem limite'
      : v.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d });

/* ------------------------------------------------------------------ */
/* Efetivo — art. 51.º do RT-SCIE                                      */
/* ------------------------------------------------------------------ */

export interface EfetivoCalc {
  valor: number; // inteiro superior
  bruto: number;
  formula: string;
  base: string;
  evacuacao: number; // com fator 1,3 quando aplicável
}

export function efetivoEspaco(e: Espaco): EfetivoCalc {
  const A = e.area ?? 0;
  const n = e.n ?? 0;
  let bruto = 0;
  let formula = '';
  let base = '';
  switch (e.criterio) {
    case 'indice': {
      const q = QUADRO_XXVII.find((x) => x.id === e.indiceId);
      const i = q?.indice ?? 0;
      bruto = A * i;
      formula = `${fmt(A, 2)} m² × ${fmt(i, 2)} pessoas/m²`;
      base = `Art. 51.º n.º 3, quadro XXVII — ${q?.espaco ?? 'índice por definir'}`;
      break;
    }
    case 'camas':
      bruto = n;
      formula = `${n} ocupantes em camas`;
      base = 'Art. 51.º n.º 2 a) — ocupantes em camas (UT IV, V e VII)';
      break;
    case 'acamados':
      bruto = 3.2 * n;
      formula = `3,2 × ${n} lugares de acamados`;
      base = 'Art. 51.º n.º 2 b) — 3,2 vezes o número de lugares de acamados (UT V)';
      break;
    case 'tipologia': {
      const t = e.tipologia ?? 0;
      const porUn = efetivoTipologia(t);
      const un = Math.max(1, n || 1);
      bruto = porUn * un;
      formula = `${un} × T${t} → ${un} × 2 × (${t} + 1)`;
      base = 'Art. 51.º n.º 2 c), quadro XXVI — apartamentos e moradias turísticas';
      break;
    }
    case 'lugares':
      bruto = n;
      formula = `${n} lugares fixos`;
      base = 'Art. 51.º n.º 2 d) — número de lugares fixos';
      break;
    case 'declarado': {
      const min = 0.03 * A;
      bruto = Math.max(n, min);
      formula = `máx(${n} declarados; 0,03 × ${fmt(A, 2)} m² = ${fmt(min, 2)})`;
      base = 'Art. 51.º n.º 2 e) — declarado pela entidade exploradora, mínimo 0,03 pessoas/m² (arquivos e espaços não acessíveis a público da UT XII)';
      break;
    }
    case 'comprimento': {
      const L = e.comprimento ?? 0;
      const k = e.comprimentoTipo === 'pe' ? 5 : 2;
      bruto = L * k;
      formula = `${fmt(L, 2)} m × ${k} pessoas/m`;
      base = e.comprimentoTipo === 'pe'
        ? 'Art. 51.º n.º 4, quadro XXVIII — lugares de pé numa única frente: 5 pessoas/m de frente'
        : 'Art. 51.º n.º 4, quadro XXVIII — lugares sentados não individualizados: 2 pessoas/m de banco ou bancada';
      break;
    }
    case 'desportivo': {
      const esp = e.espectadores ?? 0;
      if (e.desportivoTipo === 'patinagem') {
        bruto = esp + 0.7 * A;
        formula = `${esp} espectadores + 0,7 × ${fmt(A, 2)} m² de pista`;
        base = 'Art. 283.º b) — pistas de patinagem: 0,7 pessoas/m² de pista (acresce ao efetivo da al. a), registado no espaço de apoio)';
      } else if (e.desportivoTipo === 'agua') {
        bruto = esp + 1.0 * A;
        formula = `${esp} espectadores + 1 × ${fmt(A, 2)} m² de plano de água`;
        base = 'Art. 283.º c) — piscinas e parques aquáticos: 1 pessoa/m² de plano de água, sem tanques de saltos, de mergulho e lava-pés (acresce ao efetivo da al. a))';
      } else {
        bruto = esp + 0.1 * A;
        formula = `${esp} espectadores + 0,1 × ${fmt(A, 2)} m² de área útil de apoio`;
        base = 'Art. 283.º a) — instalações desportivas cobertas: espectadores + 0,1 pessoas/m² de área de apoio';
      }
      break;
    }
    case 'fundamentado':
      bruto = n;
      formula = `${n} (valor fundamentado)`;
      base = 'Art. 51.º n.º 8 — efetivo fundamentado pelo autor (locais não abrangidos pelos n.os 2 a 4)';
      break;
  }
  const valor = Math.ceil(round(bruto, 6));
  const evacuacao = e.mobilidadeReduzida ? Math.ceil(round(valor * 1.3, 6)) : valor;
  return { valor, bruto, formula, base, evacuacao };
}

export interface EfetivoUT {
  total: number;
  totalEvacuacao: number;
  emD: number;
  emE: number;
  emDE: number;
  excluidos: number;
  porPiso: { piso: string; efetivo: number; evacuacao: number }[];
  temD: boolean;
  temE: boolean;
  origem: 'espacos' | 'manual';
}

export function efetivoUT(ut: UT): EfetivoUT {
  let total = 0, totalEv = 0, emD = 0, emE = 0, excl = 0;
  const pisos = new Map<string, { e: number; ev: number }>();
  for (const e of ut.espacos) {
    const c = efetivoEspaco(e);
    if (e.naoSimultaneo) {
      excl += c.valor;
      continue;
    }
    total += c.valor;
    totalEv += c.evacuacao;
    if (e.local === 'D') emD += c.valor;
    if (e.local === 'E') emE += c.valor;
    const k = e.piso || '—';
    const p = pisos.get(k) ?? { e: 0, ev: 0 };
    p.e += c.valor;
    p.ev += c.evacuacao;
    pisos.set(k, p);
  }
  const temD = ut.espacos.some((e) => e.local === 'D');
  const temE = ut.espacos.some((e) => e.local === 'E');
  const manual = ut.usarEfetivoManual && ut.efetivoManual !== undefined;
  return {
    total: manual ? ut.efetivoManual! : total,
    totalEvacuacao: manual ? ut.efetivoManual! : totalEv,
    emD, emE, emDE: emD + emE, excluidos: excl,
    porPiso: [...pisos.entries()].map(([piso, v]) => ({ piso, efetivo: v.e, evacuacao: v.ev })),
    temD, temE,
    origem: manual ? 'manual' : 'espacos',
  };
}

/* ------------------------------------------------------------------ */
/* Carga de incêndio modificada — Despacho 2074/2009 (red. 8954/2020)  */
/* ------------------------------------------------------------------ */

export interface CargaComp {
  Qs: number; // MJ
  qs: number; // MJ/m²
  raiAplicado?: number;
  raiNota?: string;
  linhas: { desc: string; parcela: number; formula: string }[];
}

/** Coeficiente Rai a adotar quando há várias atividades no compartimento (n.º 7.º, 3) */
export function raiCompartimento(c: Compartimento): { rai: number; nota: string } | null {
  const zonas = [
    ...c.atividades.map((z) => ({ rai: z.rai, area: z.area, nome: z.nome })),
    ...c.armazens.map((z) => ({ rai: z.rai, area: z.area, nome: z.nome })),
  ].filter((z) => z.area > 0);
  if (zonas.length < 2) return null;
  const S = c.area > 0 ? c.area : zonas.reduce((s, z) => s + z.area, 0);
  const maior = zonas.reduce((m, z) => (z.rai > m.rai ? z : m), zonas[0]);
  const areaMaior = zonas.filter((z) => z.rai === maior.rai).reduce((s, z) => s + z.area, 0);
  if (areaMaior / S >= 0.1) {
    return {
      rai: maior.rai,
      nota: `n.º 7.º, 3, a): a atividade de maior risco de ativação (Rai = ${fmt(maior.rai, 1)}) ocupa ${fmt((100 * areaMaior) / S, 1)} % da área útil (≥ 10 %).`,
    };
  }
  const somaA = zonas.reduce((s, z) => s + z.area, 0);
  const media = zonas.reduce((s, z) => s + z.rai * z.area, 0) / somaA;
  return {
    rai: round(media, 3),
    nota: `n.º 7.º, 3, b): a atividade de maior risco ocupa menos de 10 % da área útil; Rai = média ponderada pelas áreas = ${fmt(media, 3)}.`,
  };
}

export function cargaCompartimento(c: Compartimento): CargaComp {
  const linhas: CargaComp['linhas'] = [];
  let Qs = 0;
  let raiAplicado: number | undefined;
  let raiNota: string | undefined;
  if (c.metodo === 'deterministico') {
    for (const i of c.itens) {
      const rai = c.raiDet ?? i.rai;
      const p = i.massa * i.hi * i.ci * rai;
      Qs += p;
      linhas.push({
        desc: i.produto || 'Constituinte',
        parcela: p,
        formula: `${i.emLitros ? `(${fmt(i.litros ?? 0, 2)} L × ${fmt(i.densidade ?? 0, 3)} kg/L [${i.fonteDensidade || 'FDS, secção 9'}]) = ` : ''}${fmt(i.massa, 2)} kg × ${fmt(i.hi, 2)} MJ/kg × ${fmt(i.ci, 2)} × ${fmt(rai, 2)}`,
      });
    }
  } else {
    const r = raiCompartimento(c); // n.º 7.º, 3: obrigatório com várias atividades
    if (r) {
      raiAplicado = r.rai;
      raiNota = r.nota;
    }
    for (const z of c.atividades) {
      const rai = raiAplicado ?? z.rai;
      const p = z.qs * z.area * z.ci * rai;
      Qs += p;
      linhas.push({
        desc: z.nome || 'Zona de atividade',
        parcela: p,
        formula: `${fmt(z.qs)} MJ/m² × ${fmt(z.area, 2)} m² × ${fmt(z.ci, 2)} × ${fmt(rai, 3)}`,
      });
    }
    for (const z of c.armazens) {
      const rai = raiAplicado ?? z.rai;
      const p = z.qv * z.altura * z.area * z.ci * rai;
      Qs += p;
      linhas.push({
        desc: z.nome || 'Zona de armazenamento',
        parcela: p,
        formula: `${fmt(z.qv)} MJ/m³ × ${fmt(z.altura, 2)} m × ${fmt(z.area, 2)} m² × ${fmt(z.ci, 2)} × ${fmt(rai, 3)}`,
      });
    }
  }
  const qs = c.area > 0 ? Qs / c.area : 0;
  return { Qs, qs, raiAplicado, raiNota, linhas };
}

/** N.º 4.º do Despacho — densidade de carga de incêndio modificada da UT */
export function cargaUT(ut: UT): { q: number; Q: number; S: number; n: number } {
  let Q = 0, S = 0;
  for (const c of ut.compartimentos) {
    if (c.area <= 0) continue;
    const r = cargaCompartimento(c);
    Q += r.qs * c.area;
    S += c.area;
  }
  return { q: S > 0 ? Q / S : 0, Q, S, n: ut.compartimentos.length };
}

/* ------------------------------------------------------------------ */
/* Categoria de risco — art. 12.º e 13.º + anexo III                   */
/* ------------------------------------------------------------------ */

export interface Fator {
  id: string;
  rotulo: string;
  valor: number | string;
  unidade: string;
  limites: (string | null)[]; // texto por categoria 1..4
  cat: Cat;
  nota?: string;
  /** valor ainda não indicado pelo técnico */
  porPreencher?: boolean;
}

export interface Classificacao {
  cat: Cat;
  fatores: Fator[];
  determinantes: string[];
  quadro: string;
  notas: string[];
  falta: string[];
}

const catDe = (v: number, max: [number, number, number]): Cat => (v <= max[0] ? 1 : v <= max[1] ? 2 : v <= max[2] ? 3 : 4);

const lim = (max: [number, number, number], u: string, fmtv = (x: number) => fmt(x)): string[] => [
  `≤ ${fmtv(max[0])}${u}`,
  `≤ ${fmtv(max[1])}${u}`,
  `≤ ${fmtv(max[2])}${u}`,
  `> ${fmtv(max[2])}${u}`,
];

function fator(id: string, rotulo: string, valor: number, unidade: string, max: [number, number, number], nota?: string): Fator {
  return { id, rotulo, valor, unidade, limites: lim(max, unidade ? ' ' + unidade : ''), cat: catDe(valor, max), nota };
}

/** Altura ou n.º de pisos abaixo ainda por indicar (valor 0 nunca confirmado pelo técnico). */
/** Categoria só atribuída com todos os critérios do quadro preenchidos (null = por atribuir). */
export const catAtribuida = (c: Classificacao): Cat | null => (c.falta.length ? null : c.cat);

/** O que significa cada critério por preencher e onde se preenche. */
export const SIGNIFICADO_FATOR: Record<string, string> = {
  altura: 'diferença de cota entre o plano de referência e o pavimento do último piso acima do solo ocupado pela UT (art. 2.º a) do RJ-SCIE); 0 tem de ser confirmado',
  pisos: 'pisos ocupados pela UT abaixo do plano de referência; 0 tem de ser confirmado',
  area: 'área bruta ocupada pela UT II, em m² (art. 2.º b) do RJ-SCIE)',
  efetivo: 'n.º de pessoas da UT, calculado no passo «Efetivo» (art. 51.º do RT-SCIE)',
  carga: 'densidade de carga de incêndio modificada, calculada no passo «Carga de incêndio» (Despacho n.º 8954/2020)',
};

/** Pisos abaixo do plano de referência que constam da tabela de pisos (cota negativa) ou do piso dos espaços (ex.: «-1», «cave»). */
export function pisosAbaixoIndicados(ut: UT): string[] {
  const abaixoTxt = /(^|[^\d])-\s*\d|cave|sub-?solo|semi-?cave/i;
  const nomes = new Set<string>();
  for (const p of ut.pisos) if (p.cota < 0) nomes.add(p.nome);
  for (const e of ut.espacos) if (e.piso && abaixoTxt.test(e.piso)) nomes.add(e.piso.trim());
  return [...nomes];
}

/** UT ao ar livre: não tem pisos. */
const semPisos = (ut: UT) => ut.arLivre && [2, 6, 9, 12].includes(ut.tipo);

/**
 * Dados obrigatórios para as medidas do RT-SCIE que não são critério da categoria da UT:
 * os pisos abaixo do plano de referência contam em todas as UT (evacuação, câmaras corta-fogo, reação ao fogo…).
 */
export function faltaParaMedidas(ut: UT): [string, string][] {
  if (semPisos(ut)) return [];
  const f: [string, string][] = [];
  const nomes = pisosAbaixoIndicados(ut);
  if (porConfirmar(ut, 'pisos')) f.push(['N.º de pisos abaixo do plano de referência', 'obrigatório em todas as UT: as exigências do RT-SCIE mudam nos pisos abaixo do plano de referência (vias de evacuação, saídas, câmaras corta-fogo, reação ao fogo); 0 tem de ser confirmado']);
  else if (ut.pisosAbaixo === 0 && nomes.length) f.push(['N.º de pisos abaixo do plano de referência', `indicou 0, mas há espaços ou pisos abaixo do plano de referência (${nomes.join(', ')}): corrija o número`]);
  return f;
}

export function porConfirmar(ut: UT, k: 'altura' | 'pisos'): boolean {
  const v = k === 'altura' ? ut.altura : ut.pisosAbaixo;
  return !(v > 0) && !ut.indicados?.[k];
}

export function classificar(ut: UT, ef = efetivoUT(ut), carga = cargaUT(ut)): Classificacao {
  const T = ANEXO_III;
  const f: Fator[] = [];
  const notas: string[] = [];
  const falta: string[] = [];
  let quadro = '';
  const h = ut.altura;
  const pa = ut.pisosAbaixo;

  switch (ut.tipo) {
    case 1:
      quadro = 'Quadro I';
      f.push(fator('altura', 'Altura da UT I', h, 'm', T.q1_altura));
      f.push(fator('pisos', 'N.º de pisos abaixo do plano de referência', pa, '', T.q1_pisos));
      break;
    case 2:
      quadro = 'Quadro II';
      if (ut.arLivre) {
        f.push({ id: 'arlivre', rotulo: 'Ao ar livre', valor: 'Sim', unidade: '', limites: ['Sim', 'Não', 'Não', 'Não'], cat: 1 });
        notas.push('UT II ao ar livre: o quadro II só admite «Sim» na 1.ª categoria.');
      } else {
        f.push(fator('altura', 'Altura da UT II', h, 'm', T.q2_altura));
        f.push(fator('area', 'Área bruta ocupada pela UT II', ut.areaBruta, 'm²', T.q2_area));
        f.push(fator('pisos', 'N.º de pisos abaixo do plano de referência', pa, '', T.q2_pisos));
      }
      break;
    case 3:
    case 10: {
      const isX = ut.tipo === 10;
      quadro = isX ? 'Quadro VIII' : 'Quadro III';
      f.push(fator('altura', `Altura da UT ${isX ? 'X' : 'III'}`, h, 'm', isX ? T.q8_altura : T.q3_altura));
      f.push(fator('efetivo', `Efetivo da UT ${isX ? 'X' : 'III'}`, ef.total, 'pessoas', isX ? T.q8_efetivo : T.q3_efetivo));
      break;
    }
    case 4:
    case 5: {
      quadro = 'Quadro IV';
      const semDE = ut.tipo === 4 && !ef.temD && !ef.temE;
      const efMax: [number, number, number] = semDE ? [T.q4_efetivo[0], T.q4_efetivo[1] * 1.5, T.q4_efetivo[2] * 1.5] : T.q4_efetivo;
      if (semDE) notas.push('UT IV sem locais de risco D ou E: limites máximos do efetivo das 2.ª e 3.ª categorias aumentados em 50 % (art. 13.º n.º 3 e nota (*) do quadro IV).');
      f.push(fator('altura', `Altura da UT ${ut.tipo === 4 ? 'IV' : 'V'}`, h, 'm', T.q4_altura));
      f.push(fator('efetivo', `Efetivo da UT ${ut.tipo === 4 ? 'IV' : 'V'}`, ef.total, 'pessoas', efMax));
      f.push(fator('efetivoDE', 'Efetivo em locais de risco D ou E', ef.emDE, 'pessoas', T.q4_efetivoDE));
      if (ef.temD) {
        f.push({
          id: 'saidaD', rotulo: 'Locais de risco D com saídas independentes diretas ao exterior no plano de referência',
          valor: ut.saidaIndependenteD ? 'Sim' : 'Não', unidade: '',
          limites: ['Aplicável a todos', 'Não aplicável', 'Não aplicável', 'Não aplicável'],
          cat: ut.saidaIndependenteD ? 1 : 2,
          nota: ut.saidaIndependenteD ? undefined : 'Sem saídas independentes diretas ao exterior em todos os locais D, a 1.ª categoria não é possível.',
        });
      }
      break;
    }
    case 6:
    case 9: {
      quadro = 'Quadro V';
      const r = ut.tipo === 6 ? 'VI' : 'IX';
      if (ut.arLivre) {
        f.push(fator('efetivo', `Efetivo da UT ${r} (ao ar livre)`, ef.total, 'pessoas', T.q5_efetivoArLivre));
      } else {
        f.push(fator('altura', `Altura da UT ${r}`, h, 'm', T.q5_altura));
        f.push(fator('pisos', 'N.º de pisos abaixo do plano de referência', pa, '', T.q5_pisos));
        f.push(fator('efetivo', `Efetivo da UT ${r}`, ef.total, 'pessoas', T.q5_efetivo));
      }
      break;
    }
    case 7:
      quadro = 'Quadro VI';
      f.push(fator('altura', 'Altura da UT VII', h, 'm', T.q6_altura));
      f.push(fator('efetivo', 'Efetivo da UT VII', ef.total, 'pessoas', T.q6_efetivo));
      f.push(fator('efetivoE', 'Efetivo em locais de risco E', ef.emE, 'pessoas', T.q6_efetivoE));
      if (ef.temE) {
        f.push({
          id: 'saidaE', rotulo: 'Locais de risco E com saídas independentes diretas ao exterior no plano de referência',
          valor: ut.saidaIndependenteD ? 'Sim' : 'Não', unidade: '',
          limites: ['Aplicável a todos', 'Não aplicável', 'Não aplicável', 'Não aplicável'],
          cat: ut.saidaIndependenteD ? 1 : 2,
        });
      }
      break;
    case 8:
      quadro = 'Quadro VII';
      f.push(fator('altura', 'Altura da UT VIII', h, 'm', T.q7_altura));
      f.push(fator('pisos', 'N.º de pisos abaixo do plano de referência', pa, '', T.q7_pisos));
      f.push(fator('efetivo', 'Efetivo da UT VIII', ef.total, 'pessoas', T.q7_efetivo));
      break;
    case 11: {
      quadro = 'Quadro IX';
      const k = ut.exclusivoArmazem ? 10 : 1;
      const qmax = T.q9_carga.map((x) => x * k) as [number, number, number];
      if (ut.exclusivoArmazem) notas.push('UT XI destinada exclusivamente a armazém: limites da densidade de carga de incêndio modificada 10 vezes superiores (nota (**) do quadro IX).');
      f.push(fator('altura', 'Altura da UT XI', h, 'm', T.q9_altura));
      f.push(fator('pisos', 'N.º de pisos abaixo do plano de referência', pa, '', T.q9_pisos));
      f.push(fator('efetivo', 'Efetivo da UT XI', ef.total, 'pessoas', T.q9_efetivo));
      f.push(fator('carga', 'Densidade de carga de incêndio modificada', round(carga.q, 1), 'MJ/m²', qmax));
      break;
    }
    case 12: {
      quadro = 'Quadro X';
      const k = ut.exclusivoArmazem ? 10 : 1;
      if (ut.exclusivoArmazem) notas.push('UT XII destinada exclusivamente a armazém: limites da densidade de carga de incêndio modificada 10 vezes superiores (nota (**) do quadro X).');
      if (ut.arLivre) {
        const qmax = T.q10_cargaArLivre.map((x) => x * k) as [number, number, number];
        f.push(fator('carga', 'Densidade de carga de incêndio modificada (ao ar livre)', round(carga.q, 1), 'MJ/m²', qmax));
      } else {
        const qmax = T.q10_carga.map((x) => x * k) as [number, number, number];
        f.push(fator('carga', 'Densidade de carga de incêndio modificada', round(carga.q, 1), 'MJ/m²', qmax));
        f.push(fator('pisos', 'N.º de pisos abaixo do plano de referência', pa, '', T.q10_pisos));
      }
      break;
    }
  }
  // critérios obrigatórios por preencher: sem eles a categoria não é atribuída
  for (const x of f) {
    const por =
      x.id === 'altura' || x.id === 'pisos' ? porConfirmar(ut, x.id) // 0 é válido, mas tem de ser indicado
      : x.id === 'area' ? !(ut.areaBruta > 0)
      : x.id === 'efetivo' ? !(ef.total > 0)
      : x.id === 'carga' ? !(carga.S > 0)
      : false;
    if (por) { x.porPreencher = true; falta.push(x.rotulo); }
  }
  const cat = f.reduce<Cat>((m, x) => (x.cat > m ? x.cat : m), 1);
  const determinantes = f.filter((x) => x.cat === cat && cat > 1).map((x) => x.rotulo);
  return { cat, fatores: f, determinantes, quadro, notas, falta };
}

/**
 * Justificação legal da categoria, com valores e limites (rastreabilidade).
 * Ex.: «Altura da UT III: 29 m — excede o limite da 2.ª categoria (≤ 28 m). 3.ª categoria (RJ-SCIE, art. 13.º n.º 2; quadro III do anexo III).»
 */
export function justificacaoCategoria(c: Classificacao): string {
  const quadro = `${c.quadro.replace('Quadro', 'quadro')} do anexo III do RJ-SCIE`;
  if (c.cat === 1) return `Todos os fatores satisfazem os critérios da 1.ª categoria (RJ-SCIE, art. 13.º n.º 1; ${quadro}).`;
  const det = c.fatores.filter((x) => x.cat === c.cat);
  const partes = det.map((x) => {
    const lim = x.limites[c.cat - 2];
    const v = typeof x.valor === 'number' ? `${fmt(x.valor)}${x.unidade ? ' ' + x.unidade : ''}` : x.valor;
    return typeof x.valor === 'number' && lim
      ? `${x.rotulo}: ${v} — excede o limite da ${c.cat - 1}.ª categoria (${lim})`
      : `${x.rotulo}: ${v} — não satisfaz o critério da ${c.cat - 1}.ª categoria${lim ? ` (${lim})` : ''}`;
  });
  return `${partes.join('; ')}. Classificação na ${c.cat}.ª categoria (RJ-SCIE, art. 13.º n.º 2; ${quadro}).`;
}

export const CAT_NOME: Record<Cat, string> = { 1: '1.ª categoria', 2: '2.ª categoria', 3: '3.ª categoria', 4: '4.ª categoria' };
export const CAT_RISCO: Record<Cat, string> = { 1: 'Risco reduzido', 2: 'Risco moderado', 3: 'Risco elevado', 4: 'Risco muito elevado' };

/**
 * Coerência do local de risco com o RJ-SCIE, art. 10.º (aplicada sempre que o espaço muda):
 * - crianças ≤ 3 anos / pessoas limitadas ⇒ local D (n.º 1 d)); e o local D implica o fator 1,3 (RT-SCIE, art. 51.º n.º 5);
 * - local A com efetivo > 100 ou público > 50 ⇒ local B (n.º 1 a) e b)).
 * Não passa B a A: o n.º 2 admite B para um conjunto de locais A no mesmo compartimento corta-fogo.
 */
export function normalizarLocal(e: Espaco, antes?: Espaco) {
  const mudouLocal = antes && antes.local !== e.local;
  const mudouLimitadas = antes && !!antes.mobilidadeReduzida !== !!e.mobilidadeReduzida;
  if (mudouLocal && e.local === 'D') e.mobilidadeReduzida = true;
  else if (mudouLocal && antes!.local === 'D' && (e.local === 'A' || e.local === 'B' || e.local === 'E')) e.mobilidadeReduzida = false;
  if (mudouLimitadas && e.mobilidadeReduzida && (e.local === 'A' || e.local === 'B' || e.local === 'E')) e.local = 'D';
  if (mudouLocal) e.localAuto = false; // escolha do técnico
  const excede = efetivoEspaco(e).valor > 100 || (e.efetivoPublico ?? 0) > 50;
  if (e.local === 'A' && excede) { e.local = 'B'; e.localAuto = true; } // art. 10.º n.º 1 b)
  else if (e.local === 'B' && e.localAuto && !excede) { e.local = 'A'; e.localAuto = false; } // voltou aos limites do local A (art. 10.º n.º 1 a))
}
