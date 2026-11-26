import type { Edificio, Projeto, UT } from '../data/types';
import { ROMANO } from '../data/rjscie';
import { ENVOLVENTE_LOCAIS, QUADRO_XXV, quadroIX, quadroX, quadroXIX, quadroXXII, quadroXXIII, quadroXXIV } from '../data/rtscie';
import { contexto, gerarMedidas, type Medida } from './medidas';
import { alturaEdificio, cargaUT, efetivoEspaco, efetivoUT, faltaEdificio, faltaParaMedidas, fmt, pisosUT } from './calc';
import { desconformidades, porVerificar, verDe } from './verificacao';
import { dimensionarExtintores, totaisMapa } from './extintores';

/**
 * Dados para a ficha de segurança da 1.ª categoria (RJ-SCIE, art. 17.º n.º 2 e anexo V),
 * pela numeração do modelo da ANEPC (quadros 1 a 11), para transcrever para o modelo oficial.
 * Valores exigidos saem dos quadros do RT-SCIE; o «Cumpre» sai da verificação no local.
 */

/** S = cumpre; N = não cumpre; NA = não aplicável; ? = por verificar ou ainda não verificado */
export type SNA = 'S' | 'N' | 'NA' | '?';

export interface LinhaUT { ut: string; altura: string; nPisos: string; pisos: string; area: string; nota?: string }
export interface FichaDados {
  ut: UT; ed: Edificio; cat: number;
  aplicavel: { ok: boolean; motivo: string };
  q1: { morada: string; concelho: string; distrito: string; requerente: string };
  q21: LinhaUT;
  q22: { areaTotal: string; pisosAcima: string; pisosAbaixo: string; altura: string; ascensores: string; uts: LinhaUT[] };
  q3: { cumpre: SNA; via: string; hidrante: string };
  q41: { cumpre: SNA; suporte: string; suporteComp: string; entreUT: string };
  q42: { cumpre: SNA; linhas: [string, string, string][] }; // zona, paredes/pavimentos, portas
  q5: { cumpre: SNA; linhas: [string, string, string][] }; // zona, pavimentos, paredes e tetos
  q6: { efTotal: string; porLocal: [string, string][]; cumpreSaidas: SNA; cumpreVias: SNA; portas: SNA };
  q7: [string, string, SNA][];
  q8: {
    sinalizacao: SNA; iluminacao: SNA; blocos: string;
    alarme: SNA; configuracao: string;
    fumo: SNA; espacosFumo: string;
    intervencao: SNA; extintores: string; distanciaExtintor: string; carretel: string;
    gas: SNA; poluicao: SNA;
  };
  q91: string[]; q92: { cumpre: SNA; medidas: string };
  q10: { autor: string; data: string };
  falta: string[];
}

const de = (ms: Medida[], ut: UT, prefixos: string[]): SNA => {
  // 'VII.1' não pode apanhar 'VII.10'; 'II.' apanha toda a secção II
  const casa = (t: string, p: string) => (p.endsWith('.') ? t.startsWith(p) : t === p || (t.startsWith(p) && !/\d/.test(t[p.length] ?? '')));
  const sel = ms.filter((m) => prefixos.some((p) => casa(m.tema, p)) && m.estado !== 'nao');
  if (!sel.length) return 'NA';
  const es = sel.map((m) => verDe(ut, m).estado);
  if (es.includes('nao_cumpre')) return 'N';
  if (es.every((e) => e === 'na')) return 'NA';
  if (es.every((e) => e === 'cumpre' || e === 'na')) return 'S';
  return '?';
};
const med = (ms: Medida[], titulo: string) => ms.find((m) => m.titulo.startsWith(titulo));
const intervalo = (ns: number[]) => (ns.length ? `${Math.min(...ns)} a ${Math.max(...ns)}` : '—');

function linhaUT(ut: UT): LinhaUT {
  const ps = pisosUT(ut).filter((p) => !p.tecnico);
  const area = ps.reduce((s, p) => s + p.area, 0) || ut.areaBruta || 0;
  return {
    ut: `UT ${ROMANO[ut.tipo]}`,
    altura: ut.indicados?.altura || ut.altura > 0 ? fmt(ut.altura, 2) : '—',
    nPisos: ps.length ? String(ps.length) : '—',
    pisos: intervalo(ps.map((p) => p.n)),
    area: area ? fmt(area, 2) : '—',
    nota: ut.tipo === 12 ? `carga de incêndio ${fmt(cargaUT(ut).q, 1)} MJ/m²` : ut.tipo === 1 && ut.factos?.unifamiliar !== undefined ? (ut.factos.unifamiliar ? 'unifamiliar' : 'multifamiliar') : undefined,
  };
}

export function fichaSeguranca(p: Projeto, ed: Edificio, ut: UT): FichaDados {
  const ctx = contexto(ed, ut);
  const cat = ctx.cls.cat;
  const semCat = ctx.cls.falta.length > 0;
  const bloqueado = semCat || faltaParaMedidas(ut).length > 0 || faltaEdificio(ed).length > 0;
  const ms = bloqueado ? [] : gerarMedidas(ctx);
  const H = alturaEdificio(ed);
  const falta: string[] = [];
  if (semCat) falta.push('Categoria da UT por atribuir (faltam fatores de risco)');
  else if (bloqueado) falta.push('Faltam dados do edifício ou da UT para gerar as medidas');
  if (!p.morada) falta.push('Morada do prédio (dados do projeto)');
  if (!p.cliente) falta.push('Requerente (dados do projeto)');

  const outras = ed.uts.map(linhaUT);
  const areaTotal = ed.uts.reduce((s, u) => s + (pisosUT(u).reduce((a, x) => a + x.area, 0) || u.areaBruta || 0), 0);

  // 4.1 — resistência estrutural (art. 15.º) e entre UT (art. 17.º, quadro X)
  const est = med(ms, 'Resistência ao fogo dos elementos estruturais');
  const r = est?.exigencia.match(/\bR (\d+)/)?.[1];
  const rei = est?.exigencia.match(/\bREI (\d+)/)?.[1];
  const q9 = quadroIX(ut.tipo, cat);
  const isento = est?.estado === 'nao';

  // 4.2 — isolamento e proteção (quadros XIII a XXII)
  const locais = new Set(ut.espacos.map((e) => e.local));
  const q19 = quadroXIX(H);
  const q22 = quadroXXII(H);
  const elev = med(ms, 'Caixas dos elevadores');
  const l42: [string, string, string][] = [
    ['Vias horizontais de evacuação', `${q19.paredes} / ${q19.suporte}`, q19.portas],
    ['Vias verticais de evacuação', `${q9.compartimentacao.replace('REI', 'EI')} / ${q9.compartimentacao}`, H > 28 ? 'câmara corta-fogo (acesso interior)' : 'E 30 C'],
    ['Caixas dos elevadores', elev?.estado === 'nao' ? 'não existem' : H > 28 ? 'EI 60 / REI 60' : `${q22.paredes} / ${q22.suporte}`, elev?.estado === 'nao' ? '—' : H > 28 ? 'E 30 C' : q22.portas],
  ];
  for (const k of ['B', 'C', 'Cag', 'D', 'E', 'F'] as const) {
    if (!locais.has(k)) continue;
    const q = ENVOLVENTE_LOCAIS[k];
    l42.push([`Locais de risco ${k === 'Cag' ? 'C agravado' : k}`, `${q.paredes} / ${q.suporte}`, q.portas]);
  }

  // 5 — reação ao fogo (quadros XXIII a XXV)
  const q23 = quadroXXIII(H <= 9 ? 9 : H <= 28 ? 28 : 29);
  const q24 = quadroXXIV(H);
  const l5: [string, string, string][] = [
    ['Vias horizontais de evacuação', q23.pavimentos, q23.paredes],
    ['Vias verticais de evacuação', q24.pavimentos, q24.paredes],
  ];
  for (const k of ['B', 'C', 'D', 'E', 'F'] as const) {
    if (!locais.has(k) && !(k === 'C' && locais.has('Cag'))) continue;
    l5.push([`Locais de risco ${k}`, QUADRO_XXV[k].pavimentos, QUADRO_XXV[k].paredes]);
  }

  // 6 — efetivo (art. 51.º)
  const ef = efetivoUT(ut);
  const porLocal = new Map<string, number>();
  for (const e of ut.espacos) { const k = e.local === 'Cag' ? 'C' : e.local; porLocal.set(k, (porLocal.get(k) ?? 0) + efetivoEspaco(e).valor); }

  // 8 — equipamentos
  const cfg = med(ms, 'Configuração do sistema de alarme');
  const config = cfg?.estado === 'nao' ? 'Isento' : cfg?.exigencia.match(/Configuração (\d)/)?.[0] ?? '—';
  const fumo = med(ms, 'Espaços com controlo de fumo');
  const dim = dimensionarExtintores(ut, cat);
  const extFaltaArea = dim.pisos.some((x) => !(x.area > 0));
  const ext = med(ms, 'Extintores portáteis');
  const carr = med(ms, 'Rede de incêndio armada');

  const map = med(ms, 'Medidas de autoproteção exigíveis');
  const nc = desconformidades(ut, ms).map((d) => `${d.medida.titulo} (${d.medida.base})${d.ver.obs ? ` — ${d.ver.obs}` : ''}${d.ver.corretiva ? `. Medida: ${d.ver.corretiva}` : ''}`);
  const pv = porVerificar(ut, ms).map(({ medida, ver }) => `Por verificar: ${medida.titulo}${ver.falta ? ` — falta ${ver.falta}` : ''}`);

  return {
    ut, ed, cat,
    aplicavel: semCat
      ? { ok: false, motivo: 'Categoria por atribuir: complete os fatores de risco.' }
      : cat === 1
        ? { ok: true, motivo: `UT ${ROMANO[ut.tipo]} da 1.ª categoria: a operação urbanística apresenta ficha de segurança em vez de projeto de SCIE (RJ-SCIE, art. 17.º n.º 2)${ut.tipo === 4 || ut.tipo === 5 ? ', complementada com as peças desenhadas do anexo V, art. 2.º n.º 2' : ''}.` }
        : { ok: false, motivo: `UT da ${cat}.ª categoria: exige projeto da especialidade de SCIE (RJ-SCIE, art. 17.º n.º 1), não ficha de segurança.` },
    q1: { morada: p.morada, concelho: p.concelho, distrito: p.distrito, requerente: p.cliente },
    q21: linhaUT(ut),
    q22: {
      areaTotal: areaTotal ? fmt(areaTotal, 2) : '—',
      pisosAcima: ed.pisosAcimaIndicado ? String(ed.pisosAcima) : '—',
      pisosAbaixo: ed.pisosAbaixoIndicado || ed.pisosAbaixo > 0 ? String(ed.pisosAbaixo) : '—',
      altura: ed.alturaIndicada || ed.altura > 0 ? fmt(ed.altura, 2) : '—',
      ascensores: ut.factos?.elevadores === false ? '0' : ut.factos?.elevadores ? 'existem (indicar n.º)' : '—',
      uts: outras,
    },
    q3: {
      cumpre: de(ms, ut, ['II.']),
      via: ut.arLivre ? 'Recinto ao ar livre: quadro I do art. 4.º' : H <= 9 ? 'Exigido (art. 4.º): largura útil ≥ 3,5 m; altura útil ≥ 4 m; inclinação ≤ 15 %' : 'Exigido (art. 5.º): largura útil ≥ 6 m (10 m em impasse); altura útil ≥ 5 m; inclinação ≤ 10 %',
      hidrante: 'Exigido (art. 12.º): marco ou boca de incêndio a ≤ 30 m da saída',
    },
    q41: {
      cumpre: de(ms, ut, ['III.1', 'III.2', 'III.3']),
      suporte: isento ? 'sem exigência (art. 15.º n.º 6)' : `R ${r ?? q9.suporte.slice(2)}`,
      suporteComp: isento ? 'sem exigência (art. 15.º n.º 6)' : `REI ${rei ?? q9.compartimentacao.slice(4)}`,
      entreUT: ed.uts.length > 1 ? `EI/REI ${quadroX(ut.tipo, cat)} (quadro X; o mais gravoso das UT confinantes)` : 'edifício de utilização exclusiva',
    },
    q42: { cumpre: de(ms, ut, ['III.4', 'III.5']), linhas: l42 },
    q5: { cumpre: de(ms, ut, ['IV.']), linhas: l5 },
    q6: {
      efTotal: fmt(ef.total),
      porLocal: [...porLocal.entries()].sort().map(([k, v]) => [k, fmt(v)]),
      cumpreSaidas: de(ms, ut, ['V.1']),
      cumpreVias: de(ms, ut, ['V.2', 'V.3', 'V.4']),
      portas: ut.tipo === 1 ? 'NA' : de(ms, ut, ['V.1b']),
    },
    q7: [
      ['7.1 Instalações de energia elétrica (arts. 70.º a 79.º)', 'VI.1', de(ms, ut, ['VI.1'])],
      ['7.2 Aquecimento e cozinhas (arts. 80.º a 91.º)', 'VI.2', de(ms, ut, ['VI.2', 'VI.3'])],
      ['7.3 Efluentes de combustão e ventilação (arts. 92.º a 100.º)', 'VI.4', de(ms, ut, ['VI.4', 'VI.5'])],
      ['7.4 Ascensores (arts. 101.º a 105.º)', 'VI.6', de(ms, ut, ['VI.6'])],
      ['7.5 Líquidos e gases combustíveis (arts. 106.º e 107.º)', 'VI.7', de(ms, ut, ['VI.7'])],
    ],
    q8: {
      sinalizacao: de(ms, ut, ['VII.1']), iluminacao: de(ms, ut, ['VII.2']),
      blocos: [4, 5, 6, 8, 10, 11].includes(ut.tipo) ? 'Permanentes (art. 115.º n.º 1)' : 'Permanentes ou não permanentes (permanentes nas placas de saída, art. 115.º n.º 2)',
      alarme: de(ms, ut, ['VII.3']), configuracao: config,
      fumo: de(ms, ut, ['VII.4']), espacosFumo: fumo ? fumo.exigencia.split('.')[0] : '—',
      intervencao: de(ms, ut, ['VII.5']),
      extintores: !dim.exigido ? 'não exigidos' : dim.mapa.length ? `${totaisMapa(dim.mapa).flatMap((g) => g.itens.map((i) => `${i.qtdTxt} × ${i.desc}${g.cat === 'complemento' ? ' (complemento)' : ''}`)).join('; ')}${extFaltaArea ? ' (há pisos sem área indicada)' : ''}` : 'indique a área de cada piso (passo «Extintores»)',
      distanciaExtintor: ext?.estado === 'nao' ? '—' : '15 m (de qualquer saída de local de risco)',
      carretel: carr ? (carr.estado === 'aplica' ? 'Sim, exigida' : 'Não exigida') : '—',
      gas: de(ms, ut, ['VII.9']), poluicao: de(ms, ut, ['VII.8']),
    },
    q91: [...nc, ...pv],
    q92: { cumpre: de(ms, ut, ['MAP']), medidas: map ? (map.estado === 'nao' ? 'Não exigíveis (RJ-SCIE, art. 22.º n.º 1)' : map.exigencia.split('. Adaptadas')[0]) : '—' },
    q10: { autor: [p.autor.nome, p.autor.qualificacao].filter(Boolean).join(', '), data: p.data },
    falta,
  };
}
