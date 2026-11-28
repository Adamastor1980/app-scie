import type { AvaliacaoRiscos, LinhaRisco } from './tipos';

/** Quadro 1 — Nível de Deficiência (ND) */
export const ND = [
  { v: 10, nome: 'Muito deficiente (MD)', sig: 'Detetaram-se fatores de risco significativos que determinam como muito possível a produção de falhas. O conjunto de medidas preventivas existentes é ineficaz.' },
  { v: 6, nome: 'Deficiente (D)', sig: 'Detetou-se algum fator de risco significativo que precisa de ser corrigido. A eficácia do conjunto de medidas preventivas existentes vê-se reduzida de forma apreciável.' },
  { v: 2, nome: 'Melhorável (M)', sig: 'Detetaram-se fatores de risco de menor importância. A eficácia do conjunto de medidas preventivas existentes não se vê reduzida de forma apreciável.' },
  { v: 1, nome: 'Aceitável (A)', sig: 'Não se detetaram anomalias significativas. O risco está controlado.' },
] as const;
/** Quadro 3 — Nível de Exposição (NE) */
export const NE = [
  { v: 4, nome: 'Continuada (EC)', sig: 'Continuamente. Várias vezes durante o dia de trabalho e por tempo prolongado.' },
  { v: 3, nome: 'Frequente (EF)', sig: 'Várias vezes durante o dia de trabalho, mas por pouco tempo.' },
  { v: 2, nome: 'Ocasional (EO)', sig: 'Algumas vezes durante o dia de trabalho e por períodos curtos de tempo.' },
  { v: 1, nome: 'Esporádica (EE)', sig: 'Irregularmente.' },
] as const;
/** Quadro 5 — significado do NP (matriz V5.0) */
export const NP_SIG = [
  { sigla: 'MA', nome: 'Muito alta', intervalo: '24 – 40', sig: 'Situação deficiente, com exposição continuada ou muito deficiente, com exposição frequente. A materialização deste risco ocorre com frequência.' },
  { sigla: 'A', nome: 'Alta', intervalo: '10 – 20', sig: 'Situação deficiente, com exposição frequente ou ocasional ou situação muito deficiente com exposição ocasional ou esporádica. A materialização do risco é possível em vários momentos do processo operacional.' },
  { sigla: 'M', nome: 'Média', intervalo: '6 – 8', sig: 'Situação deficiente, com exposição esporádica ou situação melhorável com exposição continuada ou frequente. Existe a possibilidade de dano.' },
  { sigla: 'B', nome: 'Baixa', intervalo: '2 – 4', sig: 'Situação melhorável, com exposição ocasional ou esporádica. Não é expectável a ocorrência de risco, ainda que seja concebível.' },
] as const;
/** Quadro 6 — Nível de Consequências (NC) */
export const NC = [
  { v: 100, nome: 'Mortal ou catastrófico (M)', pessoais: 'Um morto ou mais', materiais: 'Destruição total do sistema. Difícil renovação' },
  { v: 60, nome: 'Muito grave (MG)', pessoais: 'Lesões graves que podem ser irreparáveis', materiais: 'Destruição parcial do sistema. Renovação complexa' },
  { v: 25, nome: 'Grave (G)', pessoais: 'Lesões com incapacidade laboral temporária', materiais: 'Paragem no processo para reparação' },
  { v: 10, nome: 'Leve (L)', pessoais: 'Pequenas lesões que não requerem hospitalização', materiais: 'Reparável sem necessidade de paragem do processo' },
] as const;
/** Quadro 8 — Nível de intervenção */
export const NIVEIS = [
  { n: 'I', intervalo: '600 – 4000', sig: 'Situação crítica. Correção urgente.', cor: '#C2362B' },
  { n: 'II', intervalo: '150 – 500', sig: 'Corrigir e adotar medidas de controlo.', cor: '#E06A12' },
  { n: 'III', intervalo: '40 – 120', sig: 'Melhorar se for possível. Conveniente justificar a intervenção e a sua rentabilidade.', cor: '#C89B00' },
  { n: 'IV', intervalo: '20', sig: 'Não intervir, salvo se uma análise mais específica o justificar.', cor: '#2F7D4F' },
] as const;
/** Hierarquia das medidas (Lei n.º 102/2009, art. 15.º n.º 2 — princípios gerais de prevenção) */
export const TIPO_MEDIDA: Record<number, string> = {
  1: '1 — Eliminação', 2: '2 — Substituição', 3: '3 — Proteção coletiva / engenharia', 4: '4 — Organizativa / sinalização / formação', 5: '5 — EPI (último recurso)',
};
export const ESTADO_MEDIDA: Record<string, string> = { por_iniciar: 'Por iniciar', em_curso: 'Em curso', concluido: 'Concluído', cancelado: 'Cancelado' };
export const EFICACIA: Record<string, string> = { eficaz: 'Eficaz', parcial: 'Parcialmente eficaz', ineficaz: 'Ineficaz' };
/** Critério de aceitabilidade do risco residual da matriz: Nível III ou IV (NR' < 150) */
export const LIMITE_ACEITAVEL = 150;

/**
 * Quadro 2 — ND a partir de três perguntas (cumpre o requisito legal? há informação? foi dada formação?).
 * Combinações da matriz: 3 «não» ou não cumpre a lei e falta informação → 10; não cumpre a lei → 6; cumpre a lei com alguma falta → 2; tudo sim → 1.
 */
export function ndDoQuadro2(q: { legal?: boolean; informacao?: boolean; formacao?: boolean }): number | undefined {
  const { legal, informacao, formacao } = q;
  if (legal === undefined || informacao === undefined || formacao === undefined) return undefined;
  if (!legal && !informacao) return 10;
  if (!legal) return 6;
  if (!informacao || !formacao) return 2;
  return 1;
}

/**
 * ND «Aceitável»: na NTP 330 e nas aulas (Quadros 1 e 2) não tem valor numérico — o risco está controlado e não se calcula NP nem NR.
 * Guarda-se internamente como 1 (compatível com a matriz V5.0), mas nunca entra no cálculo.
 */
export const ND_ACEITAVEL = 1;
export const np = (nd?: number, ne?: number) => (nd && nd !== ND_ACEITAVEL && ne ? nd * ne : undefined);
export const nr = (np_?: number, nc?: number) => (np_ && nc ? np_ * nc : undefined);
/** Quadro 4 — significado do NP */
export function nivelNP(v?: number): { sigla: string; nome: string } | undefined {
  if (!v) return undefined;
  if (v >= 24) return { sigla: 'MA', nome: 'Muito alta' };
  if (v >= 10) return { sigla: 'A', nome: 'Alta' };
  if (v >= 6) return { sigla: 'M', nome: 'Média' };
  return { sigla: 'B', nome: 'Baixa' };
}
/** Quadro 8 — nível de intervenção pelo NR (limiares da matriz: ≥600 I; ≥150 II; ≥40 III; senão IV) */
export function nivel(v?: number): (typeof NIVEIS)[number] | undefined {
  if (!v) return undefined;
  return NIVEIS[v >= 600 ? 0 : v >= 150 ? 1 : v >= 40 ? 2 : 3];
}

export interface ResultadoLinha {
  np?: number; nr?: number; nivel?: (typeof NIVEIS)[number];
  np2?: number; nr2?: number; nivel2?: (typeof NIVEIS)[number];
  /** ND aceitável: risco controlado, sem NR (inicial / residual) */ controlado?: boolean; controlado2?: boolean;
  reducao?: number; aceitavelCalc?: boolean;
}
export function calcular(l: LinhaRisco): ResultadoLinha {
  const nd = l.nd ?? ndDoQuadro2(l.q2 ?? {});
  const p = np(nd, l.ne), r = nr(p, l.nc);
  const p2 = np(l.nd2, l.ne2), r2 = nr(p2, l.nc2);
  const controlado = nd === ND_ACEITAVEL, controlado2 = l.nd2 === ND_ACEITAVEL;
  return {
    np: p, nr: r, nivel: nivel(r), np2: p2, nr2: r2, nivel2: nivel(r2), controlado, controlado2,
    reducao: r && r2 !== undefined ? (r - r2) / r : r && controlado2 ? 1 : undefined,
    aceitavelCalc: controlado2 ? true : r2 !== undefined ? r2 < LIMITE_ACEITAVEL : undefined,
  };
}

/** Campos obrigatórios por preencher numa linha: [campo, para que serve] */
export function faltaLinha(l: LinhaRisco, versao: 'light' | 'completa'): [string, string][] {
  const f: [string, string][] = [];
  if (!l.atividade.trim()) f.push(['Atividade', 'tarefa ou atividade avaliada']);
  if (!l.perigo.trim()) f.push(['Perigo', 'fonte, situação ou ato com potencial de dano (Lei n.º 102/2009, art. 15.º n.º 2 a))']);
  if (!l.risco.trim()) f.push(['Risco', 'o dano que o perigo pode causar']);
  if (!(l.nd ?? ndDoQuadro2(l.q2 ?? {}))) f.push(['ND', 'nível de deficiência (Quadro 1) — ou responda às três perguntas do Quadro 2']);
  const ctrl = (l.nd ?? ndDoQuadro2(l.q2 ?? {})) === ND_ACEITAVEL; // aceitável: não se calcula NR, NE e NC dispensáveis
  if (!ctrl && !l.ne) f.push(['NE', 'nível de exposição (Quadro 3)']);
  if (!ctrl && !l.nc) f.push(['NC', 'nível de consequência (Quadro 6)']);
  if (versao === 'completa' && !l.area.trim()) f.push(['Área / setor', 'onde se realiza a atividade']);
  const r = calcular(l).nr;
  if (r && r >= LIMITE_ACEITAVEL && !l.medidas.some((m) => m.descricao.trim())) f.push(['Medidas a implementar', `nível ${nivel(r)!.n}: a lei exige medidas de prevenção que correspondam à avaliação (art. 15.º n.º 3)`]);
  return f;
}

/** Painel resumo (como a folha «Painel Resumo») */
export function painel(a: AvaliacaoRiscos) {
  const res = a.riscos.map((l) => ({ l, r: calcular(l) }));
  const avaliados = res.filter((x) => x.r.nr);
  const reav = res.filter((x) => (x.r.nr2 !== undefined && x.r.nr2 > 0) || x.r.controlado2);
  const media = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : undefined);
  const dist = (k: 'nivel' | 'nivel2') => NIVEIS.map((n) => res.filter((x) => x.r[k]?.n === n.n).length);
  const medidas = a.riscos.flatMap((l) => l.medidas.filter((m) => m.descricao.trim()));
  return {
    avaliados: avaliados.length + res.filter((x) => x.r.controlado).length, reavaliados: reav.length,
    controlados: res.filter((x) => x.r.controlado).length, controlados2: res.filter((x) => x.r.controlado2).length,
    nrMedio: media(avaliados.map((x) => x.r.nr!)), nrMedioResidual: media(reav.filter((x) => x.r.nr2).map((x) => x.r.nr2!)),
    criticos: avaliados.filter((x) => x.r.nivel && (x.r.nivel.n === 'I' || x.r.nivel.n === 'II')).length,
    reducaoMedia: media(reav.filter((x) => x.r.reducao !== undefined).map((x) => x.r.reducao!)),
    naoAceitaveis: reav.filter((x) => (x.r.nr2 ?? 0) >= LIMITE_ACEITAVEL).length,
    ineficazes: a.riscos.filter((l) => l.eficacia === 'ineficaz').length,
    distInicial: dist('nivel'), distResidual: dist('nivel2'),
    medidas: medidas.length, medidasConcluidas: medidas.filter((m) => m.estado === 'concluido').length,
    ranking: [...avaliados].sort((x, y) => y.r.nr! - x.r.nr!).slice(0, 10),
  };
}
