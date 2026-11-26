import type { AgenteExtintor, Cat, UT } from '../data/types';
import { classificar, efetivoUT, fmt, pisosUT } from './calc';
import { LOCAIS_C, LOCAIS_F } from '../data/locaisCF';

const descLocal = (tipo: 'C' | 'F', a: string) => ((tipo === 'C' ? LOCAIS_C : LOCAIS_F).find((o) => o.a === a)?.t ?? '').split(/ com |: | \(/)[0].trim();

/**
 * Dimensionamento de extintores — RT-SCIE (Portaria n.º 135/2020).
 * Regra geral: art. 163.º n.º 2 — por piso, a) 18 L de agente extintor padrão por 500 m² ou fração e
 * b) um extintor por 200 m² ou fração, mínimo dois; aplicam-se as duas e conta a mais exigente.
 * Agente extintor padrão = água (anexo I, art. 8.º n.º 2).
 */

/** Conversões — critério técnico adotado ao abrigo do art. 163.º n.º 2 («outro critério devidamente justificado»); não constam do RT-SCIE. */
export const CONVERSAO = {
  po: { fator: 0.5, texto: 'Pó químico: kg de pó = litros de água ÷ 2 (6 L de água = 3 kg de pó)' },
  co2: { fator: 0.62, texto: 'CO₂: kg de CO₂ = litros de água × 0,62' },
  fonte: 'critério técnico indicado em formação académica (ISLA Gaia, 2026), adotado ao abrigo do art. 163.º n.º 2 do RT-SCIE; não consta do regulamento',
} as const;

export const CAPACIDADES: Record<AgenteExtintor, number[]> = { agua: [6, 9], po: [6, 9, 12] };
export const NOME_AGENTE: Record<AgenteExtintor, string> = { agua: 'água', po: 'pó químico ABC' };
export const UNIDADE: Record<AgenteExtintor, string> = { agua: 'L', po: 'kg' };

/** Litros de agente padrão (água) equivalentes a um extintor */
export const litrosEquivalentes = (agente: AgenteExtintor, cap: number) => (agente === 'agua' ? cap : cap / CONVERSAO.po.fator);
/** Litros de água → kg de CO₂ (complemento) */
export const kgCO2 = (litros: number) => litros * CONVERSAO.co2.fator;

export interface PisoExt {
  n: number; nome: string; area: number;
  /** b) n.º mínimo de extintores */ minN: number;
  /** a) litros de água exigidos */ litros: number;
  agente: AgenteExtintor; cap: number; eqL: number;
  /** quantidade proposta pela app (cumpre a) e b)) */ proposta: number;
  /** quantidade escolhida (proposta se o técnico não alterar) */ qtd: number;
  totalL: number; cumpre: boolean;
}
/** qtd = extintores portáteis; moveis = extintores móveis (50 kg); sem nenhum = medida sem quantidade fixa (ex.: manta ignífuga) */
export interface Extra { texto: string; base: string; qtd?: number; moveis?: number }
/** Linha do mapa final de extintores: o quê, onde e quantos; «lei» = o que o RT-SCIE exige; «recom» = recomendação técnica quando a lei não fixa o tipo */
export interface LinhaMapa { onde: string; oque: string; qtd: string; lei: string; base: string; recom?: string }

/** Recomendações técnicas de agente por tipo de local (não exigidas pelo RT-SCIE, que só obriga a que o local seja «dotado de extintores») */
export const RECOM_LOCAL: Record<string, string> = {
  'C:a': 'pó químico ABC', 'C:b': 'pó químico ABC ou CO₂ (líquidos inflamáveis)', 'C:d': 'água ou espuma (sólidos — classe A)',
  'C:e': 'pó químico ABC', 'C:f': 'CO₂ (equipamento elétrico)', 'C:g': 'água ou espuma (papel, cartão — classe A)', 'C:h': 'CO₂ (equipamento elétrico)',
  'C:i': 'água ou espuma (classe A)', 'C:j': 'CO₂ (equipamento elétrico e eletromecânico)', 'C:k': 'pó químico ABC ou espuma (líquidos inflamáveis)',
  'C:l': 'pó químico ABC', 'C:m': 'pó químico ABC', 'C:n': 'pó químico ABC',
  'F:a': 'CO₂ (equipamento eletrónico)', 'F:b': 'CO₂ (equipamento eletrónico)', 'F:c': 'CO₂ (equipamento eletrónico)', 'F:d': 'CO₂ (equipamento eletrónico)',
  'F:e': 'CO₂ (equipamento eletrónico)', 'F:f': 'pó químico ABC e CO₂', 'F:g': 'CO₂ (equipamento elétrico)',
};
export const NOTA_RECOM = 'Recomendação técnica: não é exigida pelo RT-SCIE, que só obriga a que estes locais sejam dotados de extintores (art. 163.º n.º 4); escolher o agente adequado à classe de fogo provável.';

export interface ResultadoExt {
  exigido: boolean; motivo: string;
  geral: boolean; // aplica-se o critério por piso (n.º 2)
  pisos: PisoExt[]; extras: Extra[];
  co2: { local: string; kg: number; qtd: number; litrosEq: number }[];
  totais: { descricao: string; qtd: number }[];
  /** mapa final: o quê, onde e quantos */
  mapa: LinhaMapa[];
  /** contagem: portáteis dos pisos, portáteis das situações próprias, móveis, medidas sem quantidade fixa, CO2 */
  resumo: { pisos: number; situacoes: number; moveis: number; semQtd: number; co2: number };
  falta: string[];
}

export const exigidosPorArea = (area: number) => ({
  minN: area > 0 ? Math.max(Math.ceil(area / 200), 2) : 0,
  litros: area > 0 ? Math.ceil(area / 500) * 18 : 0,
});

/** Art. 307.º — eficácia e extintores móveis em compartimentos com combustíveis líquidos (UT XII) */
export function art307(litros: number, metalicos = false): { eficacia: string; moveis: number; escalao: string } {
  const escaloes = [
    { ate: 50, eficacia: '113 B/C', moveis: () => 0, txt: 'a) menos de 50 l' },
    { ate: 100, eficacia: '144 B/C', moveis: () => 0, txt: 'b) 50 a 100 l' },
    { ate: 200, eficacia: '233 B/C', moveis: () => 0, txt: 'c) 100 a 200 l' },
    { ate: 750, eficacia: '233 B/C', moveis: () => 1, txt: 'd) 200 a 750 l' },
    // e) leitura adotada: além da alínea d), mais um móvel por cada 1000 l (ou fração) acima de 750 l (docs/decisoes.md, D-36)
    { ate: Infinity, eficacia: '233 B/C', moveis: (l: number) => 1 + Math.ceil((l - 750) / 1000), txt: 'e) mais de 750 l' },
  ];
  const i = litros < 50 ? 0 : litros <= 100 ? 1 : litros <= 200 ? 2 : litros <= 750 ? 3 : 4;
  const j = metalicos ? Math.max(0, i - 1) : i; // n.º 2: escalão imediatamente inferior
  const e = escaloes[j];
  // n.º 2 só baixa a eficácia; os extintores móveis seguem o volume real
  return { eficacia: e.eficacia, moveis: escaloes[i].moveis(litros), escalao: escaloes[i].txt + (metalicos && i > 0 ? ` (eficácia do escalão inferior, n.º 2)` : '') };
}

export function dimensionarExtintores(ut: UT, cat?: Cat): ResultadoExt {
  const t = ut.tipo;
  const c = cat ?? classificar(ut, efetivoUT(ut)).cat;
  const x = ut.extintores ?? {};
  const falta: string[] = [];
  const extras: Extra[] = [];

  // locais C e F: dos espaços (projeto completo) e os indicados à mão (modo só extintores)
  const locaisCF = [
    ...ut.espacos.filter((e) => e.local === 'C' || e.local === 'Cag' || e.local === 'F').map((e) => ({ nome: e.nome || 'espaço', tipo: e.local === 'F' ? 'F' : 'C' })),
    ...(x.locais ?? []).filter((l) => l.alinea).map((l) => ({ nome: [descLocal(l.tipo, l.alinea!), l.nome].filter(Boolean).join(' — '), tipo: l.tipo, alinea: l.alinea })),
  ];

  for (const l of x.locais ?? []) if (l.alinea && !l.nome.trim()) falta.push(`localização do local ${l.tipo} — indique onde fica, para se saber onde colocar o extintor (art. 163.º n.º 4)`);
  for (const l of x.locais ?? []) if (!l.alinea) falta.push(`tipo do local${l.nome ? ` «${l.nome}»` : ''} — escolha na lista do RJ-SCIE, art. 10.º, se é mesmo local C ou F (cada um exige extintor próprio)`);
  // n.º 1 e n.º 8 — aplicabilidade
  const isentoUTI = t === 1 && c <= 2;
  const arLivre = !!ut.arLivre;
  const geral = !isentoUTI && !arLivre;
  const motivo = isentoUTI
    ? 'UT I da 1.ª ou 2.ª categoria: sem exigência geral de extintores (RT-SCIE, art. 163.º n.º 1); aplicam-se só os espaços indicados abaixo.'
    : arLivre ? 'Recinto ao ar livre: extintores só nos locais de risco C (RT-SCIE, art. 163.º n.º 8).'
      : 'Extintores em todos os pisos, dimensionados pelo art. 163.º n.º 2 do RT-SCIE.';

  // n.º 2 — por piso
  const gareEletrica = t === 8 && x.gare === 'eletrica';
  const pisos: PisoExt[] = geral ? pisosUT(ut).map((p) => {
    const { minN, litros } = exigidosPorArea(p.area);
    const esc = x.pisos?.[String(p.n)] ?? {};
    let agente: AgenteExtintor = esc.agente ?? (gareEletrica ? 'po' : 'agua');
    if (gareEletrica) agente = 'po';
    const cap = esc.cap && CAPACIDADES[agente].includes(esc.cap) ? esc.cap : CAPACIDADES[agente][0];
    const eqL = litrosEquivalentes(agente, cap);
    const proposta = p.area > 0 ? Math.max(minN, Math.ceil(litros / eqL)) : 0;
    const qtd = esc.qtd ?? proposta;
    if (!(p.area > 0)) falta.push(`área do ${p.nome} — sem ela não se calcula o n.º de extintores (art. 163.º n.º 2)`);
    return { n: p.n, nome: p.nome, area: p.area, minN, litros, agente, cap, eqL, proposta, qtd, totalL: qtd * eqL, cumpre: p.area > 0 && qtd >= minN && qtd * eqL >= litros };
  }) : [];
  if (geral && !pisos.length) falta.push('pisos da UT — indique o piso dos espaços ou acrescente os pisos');

  // n.º 4 — locais C e F; n.º 8 ao ar livre só C
  for (const l of locaisCF) {
    if (arLivre && l.tipo !== 'C') continue;
    const al = (l as { alinea?: string }).alinea;
    extras.push({ texto: `Local de risco ${l.tipo} «${l.nome}»: dotado de extintor próprio`, base: `${arLivre ? 'RT-SCIE, art. 163.º n.º 8' : 'RT-SCIE, art. 163.º n.º 4'}${al ? `; RJ-SCIE, art. 10.º n.º ${l.tipo === 'C' ? 3 : 6} ${al})` : ''}`, qtd: 1 });
  }
  // n.º 5 — cozinhas e laboratórios C
  if (ut.temCozinhaC || ut.factos?.cozinha) extras.push({ texto: 'Cozinha ou laboratório (local C): manta ignífuga, em complemento; extintor com eficácia mínima 25F se forem usados óleos ou gorduras', base: 'RT-SCIE, art. 163.º n.º 5' });
  // n.º 6 — centrais térmicas > 70 kW
  if (x.combustivelCT ? x.combustivelCT !== 'nao' : ut.factos?.centralTermica) {
    if (x.combustivelCT === 'gas') extras.push({ texto: 'Central térmica a gás (> 70 kW): 1 extintor de pó químico ABC, eficácia mínima 5 A/34 B', base: 'RT-SCIE, art. 163.º n.º 6 b)', qtd: 1 });
    else if (x.combustivelCT === 'solido_liquido') {
      const q = Math.min(2 * Math.max(1, x.queimadores ?? 1), 4);
      extras.push({ texto: `Central térmica a combustível sólido ou líquido (> 70 kW): recipiente com 100 l de areia e pá; ${q} extintores de eficácia mínima 34 B (2 por queimador, máximo 4)`, base: 'RT-SCIE, art. 163.º n.º 6 a)', qtd: q });
    } else falta.push('central térmica: indique se tem mais de 70 kW e o combustível (sólido/líquido ou gás) — define os meios adicionais do art. 163.º n.º 6');
  }
  // n.º 7 — tendas e insufláveis
  const totalPortateis = pisos.reduce((s, p) => s + p.qtd, 0);
  if (ut.factos?.tendas && totalPortateis > 0) {
    const q = Math.ceil(totalPortateis / 8);
    extras.push({ texto: `Tenda ou estrutura insuflável: ${q} extintor(es) móvel(eis) de pó ABC de 50 kg (1 por cada 8 portáteis ou fração)`, base: 'RT-SCIE, art. 163.º n.º 7', moveis: q });
  }
  // UT I — espaços com extintores próprios (mesmo nas 1.ª e 2.ª categorias)
  if (t === 1) {
    if (x.arrecadacoes) extras.push({ texto: 'Agrupamento de arrecadações de condóminos: extintores nas circulações horizontais comuns', base: 'RT-SCIE, art. 209.º n.º 14 d)' });
    if (x.salaCondominio) extras.push({ texto: 'Sala de condomínio: extintores', base: 'RT-SCIE, art. 210.º n.º 6 d)' });
    if (x.estacionamento) extras.push({ texto: 'Estacionamento coberto: extintores portáteis nas condições do regulamento', base: 'RT-SCIE, art. 211.º n.º 4' });
  }
  // UT II — art. 226.º
  if (t === 2 && ut.parqueAutomatico) extras.push({ texto: 'Parque automático: extintores móveis de CO₂ ou pó ABC em cada piso, junto ao acesso a cada escada', base: 'RT-SCIE, art. 226.º n.º 1' });
  if (t === 2 && arLivre) extras.push({ texto: 'Parque exterior: no posto de controlo, 1 extintor portátil de eficácia mínima 21 A/113 B/C e 1 móvel de CO₂ ou pó ABC', base: 'RT-SCIE, art. 226.º n.º 2', qtd: 1, moveis: 1 });
  // UT VIII — art. 273.º
  if (t === 8 && (x.gare === 'sim' || x.gare === 'eletrica')) {
    extras.push({ texto: 'Câmaras corta-fogo do art. 261.º e posto de segurança: 1 extintor de eficácia mínima 21 A/113 B/C e 1 para riscos elétricos de eficácia mínima 55 B, em nicho com porta', base: 'RT-SCIE, art. 273.º n.º 2' });
    if (gareEletrica) extras.push({ texto: 'Plataformas com tração elétrica: proibidos meios de 1.ª intervenção que usem água — só pó químico', base: 'RT-SCIE, art. 273.º n.º 1' });
  }
  // UT IX — art. 286.º (parques de campismo)
  if (t === 9 && (x.setores ?? 0) > 0) extras.push({ texto: `Parque de campismo: 2 extintores de eficácia mínima 21 A/113 B/C por setor, em posições opostas, em armário (${x.setores} setor(es) → ${2 * x.setores!})`, base: 'RT-SCIE, art. 286.º n.os 1 a) e 2', qtd: 2 * x.setores! });
  // UT XII — art. 307.º
  if (t === 12 && (ut.liquidosInflamaveisL ?? 0) > 0) {
    const r = art307(ut.liquidosInflamaveisL!, x.metalicos);
    extras.push({ texto: `Combustíveis líquidos (${fmt(ut.liquidosInflamaveisL!)} l, escalão ${r.escalao}): extintores de eficácia mínima ${r.eficacia}${r.moveis ? ` + ${r.moveis} extintor(es) móvel(eis) de 50 kg de pó BC/ABC (ou agente de eficácia equivalente)` : ''}`, base: 'RT-SCIE, art. 307.º', moveis: r.moveis || undefined });
  }

  // complemento CO2 (não conta para o n.º 2 a))
  const co2 = (x.co2 ?? []).map((k) => ({ local: k.local, kg: k.kg, qtd: k.qtd, litrosEq: k.kg / CONVERSAO.co2.fator }));

  // totais por tipo
  const mapa = new Map<string, number>();
  for (const p of pisos) { const k = `${NOME_AGENTE[p.agente]} ${p.cap} ${UNIDADE[p.agente]}`; mapa.set(k, (mapa.get(k) ?? 0) + p.qtd); }
  for (const k of co2) { const d = `CO₂ ${fmt(k.kg, 1)} kg (complemento)`; mapa.set(d, (mapa.get(d) ?? 0) + k.qtd); }
  const totais = [...mapa.entries()].map(([descricao, qtd]) => ({ descricao, qtd }));

  // mapa final — o quê, onde e quantos
  const mapaF: LinhaMapa[] = [];
  for (const p of pisos) if (p.area > 0) mapaF.push({ onde: `${p.nome} — nas circulações e junto às saídas, a ≤ 15 m de qualquer saída de local de risco; manípulo a ≤ 1,2 m`, oque: `Extintor de ${NOME_AGENTE[p.agente]} ${p.cap} ${UNIDADE[p.agente]}`, qtd: String(p.qtd), lei: `${p.minN} no mínimo e ${p.litros} L de água (${fmt(p.area, 2)} m²)`, base: 'RT-SCIE, art. 163.º n.os 1 a 3' });
  const cozinhaListada = (x.locais ?? []).some((l) => l.tipo === 'C' && ['b', 'c', 'd'].includes(l.alinea ?? '')) || ut.espacos.some((e) => /cozinh|laborat/i.test(e.nome) && (e.local === 'C' || e.local === 'Cag'));
  for (const l of [...ut.espacos.filter((e) => ['C', 'Cag', 'F'].includes(e.local)).map((e) => ({ nome: e.nome || 'espaço', tipo: (e.local === 'F' ? 'F' : 'C') as 'C' | 'F', alinea: undefined as string | undefined })), ...(x.locais ?? []).filter((l) => l.alinea).map((l) => ({ nome: [descLocal(l.tipo, l.alinea!), l.nome].filter(Boolean).join(' — '), tipo: l.tipo, alinea: l.alinea }))]) {
    if (arLivre && l.tipo !== 'C') continue;
    const cozinha = l.tipo === 'C' && (l.alinea === 'c' || l.alinea === 'd' || /cozinh/i.test(l.nome));
    const lab = l.tipo === 'C' && (l.alinea === 'b' || /laborat/i.test(l.nome));
    mapaF.push({
      onde: `Local de risco ${l.tipo}: ${l.nome}`,
      oque: cozinha ? 'Extintor com eficácia mínima 25F (se houver óleos ou gorduras) + manta ignífuga' : lab ? 'Extintor adequado ao risco + manta ignífuga' : 'Extintor adequado ao risco do local',
      qtd: cozinha || lab ? '1 + 1 manta' : '1',
      lei: cozinha ? 'extintor (25F com óleos ou gorduras) e manta ignífuga' : lab ? 'extintor e manta ignífuga' : 'extintor (a lei não fixa o tipo)',
      base: `RT-SCIE, art. 163.º n.º ${arLivre ? 8 : 4}${cozinha || lab ? ' e n.º 5' : ''}${l.alinea ? `; RJ-SCIE, art. 10.º n.º ${l.tipo === 'C' ? 3 : 6} ${l.alinea})` : ''}`,
      recom: cozinha ? undefined : l.alinea ? RECOM_LOCAL[`${l.tipo}:${l.alinea}`] : undefined,
    });
  }
  if ((ut.temCozinhaC || ut.factos?.cozinha) && !cozinhaListada) mapaF.push({ onde: 'Cozinha ou laboratório (local C)', oque: 'Extintor com eficácia mínima 25F (se houver óleos ou gorduras) + manta ignífuga', qtd: '1 + 1 manta', lei: 'manta ignífuga em complemento do extintor; 25F com óleos ou gorduras', base: 'RT-SCIE, art. 163.º n.º 5' });
  if (x.combustivelCT === 'gas') mapaF.push({ onde: 'Central térmica (> 70 kW, a gás)', oque: 'Extintor de pó químico ABC, eficácia mínima 5 A/34 B', qtd: '1', lei: '1 extintor de pó ABC 5 A/34 B', base: 'RT-SCIE, art. 163.º n.º 6 b)' });
  if (x.combustivelCT === 'solido_liquido') {
    const q = Math.min(2 * Math.max(1, x.queimadores ?? 1), 4);
    mapaF.push({ onde: 'Central térmica (> 70 kW, combustível sólido ou líquido)', oque: 'Extintor de eficácia mínima 34 B', qtd: String(q), lei: '2 por queimador, máximo 4', base: 'RT-SCIE, art. 163.º n.º 6 a) ii)' });
    mapaF.push({ onde: 'Central térmica (> 70 kW, combustível sólido ou líquido)', oque: 'Recipiente com 100 l de areia e pá', qtd: '1', lei: 'recipiente com 100 l de areia e uma pá', base: 'RT-SCIE, art. 163.º n.º 6 a) i)' });
  }
  for (const e of extras) {
    if (e.base.includes('163.º n.º 7')) mapaF.push({ onde: 'Tenda ou estrutura insuflável', oque: 'Extintor móvel de pó químico ABC de 50 kg', qtd: String(e.moveis ?? 0), lei: '1 por cada 8 extintores portáteis ou fração', base: 'RT-SCIE, art. 163.º n.º 7' });
    if (e.base.includes('209.º')) mapaF.push({ onde: 'Agrupamento de arrecadações — circulações horizontais comuns', oque: 'Extintores', qtd: 'pelo art. 163.º n.º 2', lei: 'extintores nas circulações horizontais comuns', base: 'RT-SCIE, art. 209.º n.º 14 d)' });
    if (e.base.includes('210.º')) mapaF.push({ onde: 'Sala de condomínio', oque: 'Extintores', qtd: 'pelo art. 163.º n.º 2', lei: 'extintores', base: 'RT-SCIE, art. 210.º n.º 6 d)' });
    if (e.base.includes('211.º')) mapaF.push({ onde: 'Estacionamento coberto', oque: 'Extintores portáteis', qtd: 'pelo art. 163.º n.º 2', lei: 'extintores portáteis nas condições do regulamento', base: 'RT-SCIE, art. 211.º n.º 4' });
    if (e.base.includes('226.º n.º 1')) mapaF.push({ onde: 'Cada piso do parque automático, junto ao acesso a cada escada', oque: 'Extintor móvel de CO₂ ou pó químico ABC', qtd: '1 por escada e por piso', lei: 'extintores móveis de CO₂ ou pó ABC', base: 'RT-SCIE, art. 226.º n.º 1' });
    if (e.base.includes('226.º n.º 2')) {
      mapaF.push({ onde: 'Posto de controlo do parque exterior', oque: 'Extintor portátil de eficácia mínima 21 A/113 B/C', qtd: '1', lei: 'no mínimo 1', base: 'RT-SCIE, art. 226.º n.º 2' });
      mapaF.push({ onde: 'Posto de controlo do parque exterior', oque: 'Extintor móvel de CO₂ ou pó químico ABC', qtd: '1', lei: 'no mínimo 1', base: 'RT-SCIE, art. 226.º n.º 2' });
    }
    if (e.base.includes('273.º n.º 2')) {
      mapaF.push({ onde: 'Cada câmara corta-fogo do art. 261.º e posto de segurança (em nicho com porta)', oque: 'Extintor de eficácia mínima 21 A/113 B/C', qtd: '1 em cada', lei: '1 em cada local', base: 'RT-SCIE, art. 273.º n.º 2' });
      mapaF.push({ onde: 'Cada câmara corta-fogo do art. 261.º e posto de segurança (em nicho com porta)', oque: 'Extintor para riscos elétricos de eficácia mínima 55 B', qtd: '1 em cada', lei: '1 em cada local', base: 'RT-SCIE, art. 273.º n.º 2' });
    }
    if (e.base.includes('286.º')) mapaF.push({ onde: 'Cada setor do parque de campismo — posições opostas, junto às vias, em armário', oque: 'Extintor de eficácia mínima 21 A/113 B/C', qtd: String(e.qtd ?? 0), lei: '2 por setor', base: 'RT-SCIE, art. 286.º n.os 1 a) e 2' });
  }
  if (t === 12 && (ut.liquidosInflamaveisL ?? 0) > 0) {
    const r = art307(ut.liquidosInflamaveisL!, x.metalicos);
    mapaF.push({ onde: 'Compartimentos com combustíveis líquidos', oque: `Extintor de eficácia mínima ${r.eficacia}`, qtd: '1 por compartimento', lei: `eficácia mínima ${r.eficacia} (${fmt(ut.liquidosInflamaveisL!)} l, escalão ${r.escalao})`, base: 'RT-SCIE, art. 307.º' });
    if (r.moveis) mapaF.push({ onde: 'Compartimentos com combustíveis líquidos', oque: 'Extintor móvel de 50 kg de pó BC ou ABC (ou eficácia equivalente)', qtd: String(r.moveis), lei: 'alíneas d) e e)', base: 'RT-SCIE, art. 307.º' });
  }
  for (const k of co2) mapaF.push({ onde: k.local || 'local por indicar', oque: `Extintor de CO₂ ${fmt(k.kg, 1)} kg`, qtd: String(k.qtd), lei: 'não exigido — complemento', base: `critério técnico (CO₂ = L × 0,62)`, recom: 'equipamento elétrico; não conta para os 18 L de água' });

  const resumo = {
    pisos: pisos.reduce((a, p) => a + p.qtd, 0),
    situacoes: extras.reduce((a, e) => a + (e.qtd ?? 0), 0),
    moveis: extras.reduce((a, e) => a + (e.moveis ?? 0), 0),
    semQtd: extras.filter((e) => !e.qtd && !e.moveis).length,
    co2: co2.reduce((a, k) => a + k.qtd, 0),
  };
  return { exigido: geral || extras.length > 0, motivo, geral, pisos, extras, co2, totais, mapa: mapaF, resumo, falta };
}
