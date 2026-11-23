import type { Espaco, UT, UTNum } from '../data/types';
import { efetivoEspaco } from './calc';

/**
 * Espaços integrados numa UT — RJ-SCIE, art. 8.º n.º 3.
 * Nas UT III a XII, certos espaços com outro uso só ficam integrados na UT onde se inserem se cumprirem os limites
 * da lei; acima deles constituem uma utilização-tipo própria (edifício de utilização mista, art. 8.º n.º 2).
 */
export type Integracao = {
  alinea: 'a' | 'b' | 'c';
  uso: string; // ex.: «espaço de reunião»
  utPropria: UTNum[]; // UT que passa a ser se exceder o limite
  usoQuadro?: string; // uso do quadro XXVII adequado (quando o escolhido não corresponde ao nome)
  integrado: boolean | null; // null = não é possível concluir (falta a área bruta da UT)
  motivo: string;
};

type Regra = { alinea: 'a' | 'b' | 'c'; uso: string; ut: UTNum[]; ids: string[]; palavras: RegExp; usoQuadro?: string };

const REGRAS: Regra[] = [
  { alinea: 'b', uso: 'espaço de reunião, conferências ou palestras', ut: [6], ids: ['reuniao', 'lugares-pe'], palavras: /reuni|confer|palestr|auditor|anfiteat/, usoQuadro: 'reuniao' },
  { alinea: 'b', uso: 'espaço de culto religioso', ut: [6], ids: [], palavras: /capela|igreja|culto|oratori|templo/ },
  { alinea: 'b', uso: 'espaço de formação', ut: [4], ids: ['ensino'], palavras: /forma[cç]|sala de aula|ensino|treino/, usoQuadro: 'ensino' },
  { alinea: 'b', uso: 'espaço desportivo ou de lazer', ut: [9], ids: ['gimno'], palavras: /gin[aá]s|desport|pavilh|piscin|fitness/, usoQuadro: 'gimno' },
  { alinea: 'b', uso: 'restauração e bebidas', ut: [7], ids: ['refeitorio', 'bar-pe'], palavras: /refeit|cantina|restaur|\bbar\b|cafetar|copa|snack/, usoQuadro: 'refeitorio' },
  { alinea: 'c', uso: 'espaço comercial', ut: [8], ids: ['venda-baixa', 'venda-1piso', 'venda-mais1', 'venda-pr-300', 'venda-pr-mais300', 'circ-comercial'], palavras: /loja|venda|comerc|showroom/ },
  { alinea: 'c', uso: 'oficina', ut: [12], ids: [], palavras: /oficina/ },
  { alinea: 'c', uso: 'biblioteca', ut: [11], ids: ['leitura-bib'], palavras: /bibliotec/, usoQuadro: 'leitura-bib' },
  { alinea: 'c', uso: 'espaço de exposição', ut: [10, 6], ids: ['galeria', 'museu', 'divulgacao', 'feiras'], palavras: /exposi|galeria|museu/ },
  { alinea: 'c', uso: 'posto médico, de socorros ou de enfermagem', ut: [5], ids: ['consulta', 'diagnostico'], palavras: /posto m[eé]dic|gabinete m[eé]dic|enfermar|socorr|m[eé]dico do trabalho|sa[uú]de ocup/ },
  { alinea: 'a', uso: 'espaço administrativo', ut: [3], ids: ['sala-escritorio', 'gab-escritorio'], palavras: /escrit[oó]r|administr|secretar|gabinete/ },
  { alinea: 'a', uso: 'arquivo documental', ut: [11], ids: [], palavras: /arquivo/ },
  { alinea: 'a', uso: 'armazenamento', ut: [12], ids: [], palavras: /armaz[eé]m|armazen|arrecada|economato/ },
];

const ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const semAcentos = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Que regra do art. 8.º n.º 3 se aplica ao espaço (pelo nome, que prevalece, ou pelo uso do quadro XXVII). */
function regraDe(e: Espaco): Regra | undefined {
  const nome = semAcentos(e.nome);
  return REGRAS.find((r) => r.palavras.test(nome)) ?? REGRAS.find((r) => e.indiceId && r.ids.includes(e.indiceId));
}

export function integracao(e: Espaco, ut: UT): Integracao | null {
  if (ut.tipo < 3) return null; // o n.º 3 só abrange espaços das UT III a XII
  const r = regraDe(e);
  if (!r || r.ut.includes(ut.tipo)) return null; // é do próprio uso da UT
  if (r.alinea === 'a' && ut.tipo === 3 && r.ut[0] === 3) return null;
  const ef = efetivoEspaco(e).valor;
  const area = e.area ?? 0;
  const usoQuadro = r.usoQuadro && e.criterio === 'indice' && e.indiceId !== r.usoQuadro ? r.usoQuadro : undefined;
  const nomeUT = r.ut.map((t) => `UT ${ROM[t]}`).join(' ou ');
  let integrado: boolean | null;
  let motivo: string;
  if (r.alinea === 'b') {
    const lim = ut.arLivre ? 1000 : 200;
    integrado = ef <= lim;
    motivo = integrado
      ? `Integrado na UT ${ROM[ut.tipo]}: efetivo ${ef} ≤ ${lim} (art. 8.º n.º 3 b)), desde que gerido pela entidade que explora a UT.`
      : `Efetivo ${ef} > ${lim}: não pode ficar integrado na UT ${ROM[ut.tipo]} (art. 8.º n.º 3 b)). Deve ser uma ${nomeUT} própria.`;
  } else if (r.alinea === 'c') {
    integrado = area <= 200 ? (area > 170 ? null : true) : false; // a lei usa a área bruta: área útil perto de 200 m² tem de ser confirmada
    motivo = integrado === false
      ? `Área ${area} m² > 200 m²: não pode ficar integrado na UT ${ROM[ut.tipo]} (art. 8.º n.º 3 c)). Deve ser uma ${nomeUT} própria.`
      : integrado === null
        ? `Área útil ${area} m² perto do limite: a lei usa a área bruta (com paredes), que não pode passar de 200 m² (art. 8.º n.º 3 c)). Confirme.`
        : `Integrado na UT ${ROM[ut.tipo]}: área ≤ 200 m² (art. 8.º n.º 3 c)), desde que gerido pela entidade que explora a UT.`;
  } else {
    const pct = [8, 10, 12].includes(ut.tipo) ? 20 : 10;
    const areaUT = ut.pisos.reduce((t, x) => t + (x.area ?? 0), 0) || (ut.areaBruta ?? 0);
    if (!areaUT) {
      integrado = null;
      motivo = `Só fica integrado se a área bruta não passar de ${pct} % da área bruta da UT ${ROM[ut.tipo]} e não for acessível ao público (art. 8.º n.º 3 a)). Indique a área dos pisos da UT para verificar.`;
    } else {
      const lim = (areaUT * pct) / 100;
      integrado = area <= lim;
      motivo = integrado
        ? `Integrado na UT ${ROM[ut.tipo]}: ${area} m² ≤ ${pct} % de ${Math.round(areaUT)} m² (art. 8.º n.º 3 a)), desde que não acessível ao público.`
        : `Área ${area} m² > ${pct} % da área da UT (${Math.round(lim)} m²): não pode ficar integrado na UT ${ROM[ut.tipo]} (art. 8.º n.º 3 a)). Deve ser uma ${nomeUT} própria.`;
    }
  }
  return { alinea: r.alinea, uso: r.uso, utPropria: r.ut, usoQuadro, integrado, motivo };
}
