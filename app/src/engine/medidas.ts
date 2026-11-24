import type { Cat, Edificio, UT } from '../data/types';
import { INSPECOES, ROMANO } from '../data/rjscie';
import {
  ENVOLVENTE_LOCAIS, ESPECIFICAS, MAP_INFO, QUADRO_XXV, QUADRO_XXXVI, QUADRO_XXXVII, classeAltura,
  quadroIX, quadroL, quadroLI, quadroX, quadroXI, quadroXII, quadroXIX, quadroXLI, quadroXLIX, quadroXXII,
  quadroXXIII, quadroXXIV, quadroXXXIX, saidasMinimas, upMinimas,
} from '../data/rtscie';
import { classificar, efetivoEspaco, efetivoUT, fmt, type Classificacao, type EfetivoUT, pisosAbaixoIndicados, alturaEdificio, pisosAbaixoUT, pisosUT, pisoAbaixo, nPiso } from './calc';

export type Estado = 'aplica' | 'verificar' | 'nao';

export interface Medida {
  id: string;
  /** chave estável para guardar a verificação (secção + título) */
  key: string;
  tema: string;
  titulo: string;
  exigencia: string;
  base: string;
  estado: Estado;
  motivo?: string;
}

/** Estrutura da memória descritiva — RJ-SCIE, anexo IV, art. 2.º (capítulos II a VII), mais enquadramento, autoproteção e condições específicas */
export const SECOES: { c: string; g: string; t: string }[] = [
  { c: '0', g: 'Enquadramento e procedimento', t: 'Enquadramento e procedimento' },
  { c: 'II.1', g: 'II — Condições exteriores', t: 'Vias de acesso' },
  { c: 'II.2', g: 'II — Condições exteriores', t: 'Acessibilidade às fachadas' },
  { c: 'II.3', g: 'II — Condições exteriores', t: 'Limitações à propagação do incêndio pelo exterior' },
  { c: 'II.4', g: 'II — Condições exteriores', t: 'Disponibilidade de água para os meios de socorro' },
  { c: 'III.1', g: 'III — Resistência ao fogo de elementos de construção', t: 'Resistência ao fogo de elementos estruturais e incorporados em instalações' },
  { c: 'III.2', g: 'III — Resistência ao fogo de elementos de construção', t: 'Isolamento entre utilizações-tipo distintas' },
  { c: 'III.3', g: 'III — Resistência ao fogo de elementos de construção', t: 'Compartimentação geral corta-fogo' },
  { c: 'III.4', g: 'III — Resistência ao fogo de elementos de construção', t: 'Isolamento e proteção de locais de risco' },
  { c: 'III.5a', g: 'III — Resistência ao fogo de elementos de construção', t: 'Isolamento e proteção de meios de circulação — a) Proteção das vias horizontais de evacuação' },
  { c: 'III.5b', g: 'III — Resistência ao fogo de elementos de construção', t: 'Isolamento e proteção de meios de circulação — b) Proteção das vias verticais de evacuação' },
  { c: 'III.5c', g: 'III — Resistência ao fogo de elementos de construção', t: 'Isolamento e proteção de meios de circulação — c) Isolamento de outras circulações verticais' },
  { c: 'III.5d', g: 'III — Resistência ao fogo de elementos de construção', t: 'Isolamento e proteção de meios de circulação — d) Isolamento e proteção das caixas dos elevadores' },
  { c: 'III.5e', g: 'III — Resistência ao fogo de elementos de construção', t: 'Isolamento e proteção de meios de circulação — e) Isolamento e proteção de canalizações e condutas' },
  { c: 'IV.1a', g: 'IV — Reação ao fogo de materiais', t: 'Revestimentos em vias de evacuação — a) Vias horizontais' },
  { c: 'IV.1b', g: 'IV — Reação ao fogo de materiais', t: 'Revestimentos em vias de evacuação — b) Vias verticais' },
  { c: 'IV.1c', g: 'IV — Reação ao fogo de materiais', t: 'Revestimentos em vias de evacuação — c) Câmaras corta-fogo' },
  { c: 'IV.2', g: 'IV — Reação ao fogo de materiais', t: 'Revestimentos em locais de risco' },
  { c: 'IV.3', g: 'IV — Reação ao fogo de materiais', t: 'Outras situações' },
  { c: 'V.1a', g: 'V — Evacuação', t: 'Evacuação dos locais — a) Dimensionamento dos caminhos de evacuação e das saídas' },
  { c: 'V.1b', g: 'V — Evacuação', t: 'Evacuação dos locais — b) Distribuição e localização das saídas' },
  { c: 'V.2', g: 'V — Evacuação', t: 'Caracterização das vias horizontais de evacuação' },
  { c: 'V.3', g: 'V — Evacuação', t: 'Caracterização das vias verticais de evacuação' },
  { c: 'V.4', g: 'V — Evacuação', t: 'Localização e caracterização das zonas de refúgio' },
  { c: 'VI.1', g: 'VI — Instalações técnicas', t: 'Instalações de energia elétrica' },
  { c: 'VI.2', g: 'VI — Instalações técnicas', t: 'Instalações de aquecimento' },
  { c: 'VI.3', g: 'VI — Instalações técnicas', t: 'Instalações de confeção e de conservação de alimentos' },
  { c: 'VI.4', g: 'VI — Instalações técnicas', t: 'Evacuação de efluentes de combustão' },
  { c: 'VI.5', g: 'VI — Instalações técnicas', t: 'Ventilação e condicionamento de ar' },
  { c: 'VI.6', g: 'VI — Instalações técnicas', t: 'Ascensores' },
  { c: 'VI.7', g: 'VI — Instalações técnicas', t: 'Instalações de armazenamento e utilização de líquidos e gases combustíveis' },
  { c: 'VII.1', g: 'VII — Equipamentos e sistemas de segurança', t: 'Sinalização' },
  { c: 'VII.2', g: 'VII — Equipamentos e sistemas de segurança', t: 'Iluminação de emergência' },
  { c: 'VII.3', g: 'VII — Equipamentos e sistemas de segurança', t: 'Sistema de deteção, alarme e alerta' },
  { c: 'VII.4', g: 'VII — Equipamentos e sistemas de segurança', t: 'Sistema de controlo de fumo' },
  { c: 'VII.5', g: 'VII — Equipamentos e sistemas de segurança', t: 'Meios de intervenção' },
  { c: 'VII.6', g: 'VII — Equipamentos e sistemas de segurança', t: 'Sistemas fixos de extinção automática de incêndios' },
  { c: 'VII.7', g: 'VII — Equipamentos e sistemas de segurança', t: 'Sistemas de cortina de água' },
  { c: 'VII.8', g: 'VII — Equipamentos e sistemas de segurança', t: 'Controlo de poluição de ar' },
  { c: 'VII.9', g: 'VII — Equipamentos e sistemas de segurança', t: 'Deteção automática de gás combustível' },
  { c: 'VII.10', g: 'VII — Equipamentos e sistemas de segurança', t: 'Drenagem de águas residuais da extinção de incêndios' },
  { c: 'VII.11', g: 'VII — Equipamentos e sistemas de segurança', t: 'Posto de segurança' },
  { c: 'VII.12', g: 'VII — Equipamentos e sistemas de segurança', t: 'Outros meios de proteção dos edifícios' },
  { c: 'MAP', g: 'Medidas de autoproteção', t: 'Medidas de autoproteção (RT-SCIE, título VII)' },
  { c: 'ESP', g: 'Condições específicas da utilização-tipo', t: 'Condições específicas (RT-SCIE, título VIII)' },
];
export const GRUPOS = [...new Set(SECOES.map((x) => x.g))];
export const secInfo = (c: string) => SECOES.find((x) => x.c === c)!;
/** Rótulo curto da secção com a numeração do anexo IV */
export const secRotulo = (c: string) => {
  const i = secInfo(c);
  if (c === '0' || c === 'MAP' || c === 'ESP') return i.t;
  const m = c.match(/^(.*[0-9])([a-e])$/);
  if (m) return `${m[1]} ${m[2]}) ${i.t.split(` — ${m[2]}) `)[1] ?? i.t}`;
  return `${c} — ${i.t}`;
};

export interface Contexto {
  ed: Edificio;
  ut: UT;
  cls: Classificacao;
  ef: EfetivoUT;
}

export function contexto(ed: Edificio, ut: UT): Contexto {
  const ef = efetivoUT(ut);
  return { ed, ut, ef, cls: classificar(ut, ef) };
}

const sim = (cond: boolean): Estado => (cond ? 'aplica' : 'nao');

/**
 * Factos do local que decidem se uma medida se aplica (o regulamento exige-a «se existir»).
 * Resposta Sim → aplica; Não → não aplicável; sem resposta → fica «a verificar» até ser respondida.
 */
export interface Facto { id: string; pergunta: string; base: string; mostrar?: (c: Contexto) => boolean }
export const FACTOS: Facto[] = [
  { id: 'unifamiliar', pergunta: 'O edifício destina-se a habitação unifamiliar?', base: 'RT-SCIE, art. 15.º n.º 6 a)', mostrar: (c) => c.ut.tipo === 1 && c.cls.cat === 1 },
  { id: 'elevadores', pergunta: 'Existem elevadores ou ascensores?', base: 'RT-SCIE, arts. 28.º e 101.º a 103.º' },
  { id: 'camarasCF', pergunta: 'Existem câmaras corta-fogo?', base: 'RT-SCIE, arts. 35.º, 40.º e 63.º', mostrar: (c) => !camarasExigidas(c) },
  { id: 'servEletricos', pergunta: 'Existem transformadores, grupos geradores, baterias > 1000 VAh ou UPS > 40 kVA?', base: 'RT-SCIE, arts. 70.º, 71.º, 74.º e 75.º' },
  { id: 'fonteCentral', pergunta: 'Existem instalações de segurança cuja alimentação não seja assegurada por fontes locais de emergência (ex.: bombas de incêndio, desenfumagem mecânica)?', base: 'RT-SCIE, art. 72.º n.º 2', mostrar: (c) => c.cls.cat <= 2 },
  { id: 'centralTermica', pergunta: 'Existem aparelhos de aquecimento a fluidos combustíveis com potência útil total > 40 kW?', base: 'RT-SCIE, art. 80.º' },
  { id: 'aquecimento', pergunta: 'Existem aparelhos de aquecimento autónomos nos espaços?', base: 'RT-SCIE, arts. 85.º a 87.º' },
  { id: 'combustao', pergunta: 'Existem aparelhos de combustão com condutas de evacuação de efluentes?', base: 'RT-SCIE, arts. 92.º e 93.º' },
  { id: 'cozinha', pergunta: 'Existem cozinhas, locais de confeção ou instalações de frio?', base: 'RT-SCIE, arts. 88.º a 91.º' },
  { id: 'confecaoPotente', pergunta: 'Os aparelhos de confeção excedem 250 kW (elétricos) ou 70 kW (a gás)?', base: 'RT-SCIE, art. 175.º n.º 2', mostrar: (c) => c.ut.factos?.cozinha === true || !!c.ut.temCozinhaC },
  { id: 'avac', pergunta: 'Existem instalações de ventilação ou climatização (AVAC)?', base: 'RT-SCIE, arts. 94.º a 99.º' },
  { id: 'liquidosGases', pergunta: 'Existem líquidos ou gases combustíveis (armazenados ou em utilização)?', base: 'RT-SCIE, arts. 106.º e 107.º', mostrar: (c) => !((c.ut.liquidosInflamaveisL ?? 0) > 0 || c.ut.temGas) },
  { id: 'guardas', pergunta: 'Existem vias de evacuação elevadas ou terraços acessíveis?', base: 'RT-SCIE, art. 67.º' },
  { id: 'lugaresFixos', pergunta: 'Existem lugares fixos para espectadores?', base: 'RT-SCIE, art. 53.º', mostrar: (c) => c.ut.tipo === 6 || c.ut.tipo === 9 },
  { id: 'tendas', pergunta: 'O recinto está alojado em tenda ou estrutura insuflável?', base: 'RT-SCIE, art. 46.º', mostrar: (c) => [6, 9].includes(c.ut.tipo) },
  { id: 'patio', pergunta: 'Existem pátios interiores ou poços de luz?', base: 'RT-SCIE, art. 19.º', mostrar: (c) => !c.ut.arLivre },
  { id: 'patio20', pergunta: 'Existem pátios interiores cobertos com altura superior a 20 m?', base: 'RT-SCIE, art. 173.º n.º 1 e)', mostrar: (c) => !c.ut.arLivre },
  { id: 'descargas', pergunta: 'As descargas atmosféricas constituem risco significativo de incêndio para o edifício?', base: 'RT-SCIE, art. 191.º', mostrar: (c) => !c.ut.arLivre },
  { id: 'dominante', pergunta: 'O edifício tem posição dominante na volumetria urbana ou natural envolvente?', base: 'RT-SCIE, art. 192.º', mostrar: (c) => (c.ed.altura || c.ut.altura) > 28 },
  { id: 'polucaoVIII', pergunta: 'Existem espaços cobertos de embarque/estacionamento de pesados de passageiros ou plataformas cobertas com locomotivas a gasóleo?', base: 'RT-SCIE, art. 181.º b)', mostrar: (c) => c.ut.tipo === 8 },
];
export const factosVisiveis = (c: Contexto) => FACTOS.filter((f) => !f.mostrar || f.mostrar(c));

function camarasExigidas(c: Contexto) {
  const H = alturaEdificio(c.ed) || c.ut.altura;
  return H > 28 || pisosAbaixoUT(c.ut) > 0 || c.ut.espacos.some((e) => e.local === 'Cag');
}

/** estado e motivo de uma medida que depende de um facto */
function porFacto(ut: UT, id: string, nega: string): { estado: Estado; motivo?: string } {
  const v = ut.factos?.[id];
  const f = FACTOS.find((x) => x.id === id)!;
  if (v === true) return { estado: 'aplica' };
  if (v === false) return { estado: 'nao', motivo: nega };
  return { estado: 'verificar', motivo: `Por responder: «${f.pergunta}» (separador Medidas, características do local).` };
}

export function gerarMedidas(ctx: Contexto): Medida[] {
  const { ed, ut, cls, ef } = ctx;
  const M: Medida[] = [];
  const cat: Cat = cls.cat;
  const t = ut.tipo;
  const R = ROMANO[t];
  const H = alturaEdificio(ed) || ut.altura;
  const classe = classeAltura(H);
  const locais = new Set(ut.espacos.map((e) => e.local));
  const temD = locais.has('D');
  const temE = locais.has('E');
  const temDE = temD || temE;
  const temC = locais.has('C') || locais.has('Cag');
  const temCag = locais.has('Cag');
  const temF = locais.has('F');
  const abaixo = pisosAbaixoUT(ut) > 0 || pisosAbaixoIndicados(ut).length > 0; // tabela de pisos ou piso dos espaços
  const add = (m: Omit<Medida, 'id' | 'key'>) => M.push({ id: `${M.length + 1}`.padStart(3, '0'), key: `${m.tema}|${m.titulo}`, ...m });

  /* ------------------- Enquadramento e procedimento ------------------- */
  // competência, autoria e vistorias referem-se ao edifício ou recinto: conta a categoria mais alta das suas UT
  const catEd = Math.max(cat, ...ed.uts.filter((u) => u.id !== ut.id).map((u) => classificar(u).cat)) as Cat;
  const notaEd = catEd > cat ? ` (o edifício tem UT da ${catEd}.ª categoria)` : '';
  add({
    tema: '0', titulo: 'Entidade competente',
    exigencia: catEd === 1 ? 'Município da área do edifício ou recinto (1.ª categoria de risco).' : `Autoridade Nacional de Emergência e Proteção Civil (ANEPC)${notaEd}.`,
    base: 'RJ-SCIE, art. 5.º n.º 1, art. 21.º n.º 2 e art. 24.º n.º 1', estado: 'aplica',
  });
  add({
    tema: '0', titulo: 'Peça de SCIE da operação urbanística',
    exigencia: catEd === 1
      ? 'Ficha de segurança por utilização-tipo, segundo modelo da ANEPC, com o conteúdo do anexo V.' + (t === 4 || t === 5 ? ' Nas UT IV e V a ficha é complementada com as peças desenhadas do art. 2.º n.º 2 do anexo V.' : '')
      : `Projeto da especialidade de SCIE com memória descritiva e justificativa e peças desenhadas, com o conteúdo do anexo IV${notaEd}.`,
    base: catEd === 1 ? 'RJ-SCIE, art. 17.º n.º 2 e anexo V' : 'RJ-SCIE, art. 17.º n.º 1 e anexo IV', estado: 'aplica',
  });
  add({
    tema: '0', titulo: 'Autor do projeto e das medidas de autoproteção',
    exigencia: 'Arquiteto (OA), engenheiro (OE) ou engenheiro técnico (OET) com certificação de especialização em SCIE, registado na ANEPC.',
    base: 'RJ-SCIE, art. 15.º-A n.º 1', estado: sim(catEd >= 2), motivo: catEd === 1 ? 'Exigência aplicável às 2.ª, 3.ª e 4.ª categorias.' : undefined,
  });
  add({
    tema: '0', titulo: 'Inspeções regulares',
    exigencia: `Inspeção regular no prazo máximo de ${INSPECOES[cat]} anos, a pedido das entidades responsáveis (art. 6.º n.os 3 e 4), pela ${cat === 1 ? 'câmara municipal' : 'ANEPC ou entidade por ela credenciada'}.`,
    base: 'RJ-SCIE, art. 19.º n.os 1, 2 e 4',
    estado: (cat === 1 && t !== 4 && t !== 5) || (t === 1 && cat === 2 && ed.uts.length === 1) ? 'nao' : 'aplica',
    motivo: cat === 1 && t !== 4 && t !== 5
      ? `Excetuadas as UT I, II, III, VI, VII, VIII, IX, X, XI e XII da 1.ª categoria (art. 19.º n.º 5).`
      : t === 1 && cat === 2 && ed.uts.length === 1 ? 'Edifício de utilização exclusiva da UT I da 2.ª categoria (art. 19.º n.º 5).' : undefined,
  });
  add({
    tema: '0', titulo: 'Vistoria com representante da ANEPC',
    exigencia: 'As vistorias para autorização de utilização integram um representante da ANEPC ou de entidade por ela credenciada.',
    base: 'RJ-SCIE, art. 18.º n.º 3', estado: sim(catEd >= 2), motivo: catEd === 1 ? 'Aplicável às 2.ª, 3.ª e 4.ª categorias.' : undefined,
  });
  add({
    tema: '0', titulo: 'Grau de prontidão do socorro',
    exigencia: 'O licenciamento e a localização de novos edifícios ou recintos depende do grau de prontidão do socorro do corpo de bombeiros local; na sua falta, agravamento fundamentado das medidas aprovado pela ANEPC.',
    base: 'RT-SCIE, art. 13.º', estado: sim(cat >= 3), motivo: cat < 3 ? 'Aplicável às 3.ª e 4.ª categorias.' : undefined,
  });

  /* ------------------------ Condições exteriores ----------------------- */
  if (ut.arLivre) {
    const vias = cat === 1 ? 'Uma via com 3,5 m de largura útil' : cat === 2 ? 'Duas vias, tão afastadas quanto possível, com 3,5 m de largura útil' : 'Duas vias, tão afastadas quanto possível, com 7,0 m de largura útil';
    add({ tema: 'II.1', titulo: 'Vias de acesso a recinto ao ar livre', exigencia: `${vias}; estacionamento dos veículos de socorro a ≤ 30 m de uma saída; altura útil 4 m; raio de curvatura mínimo 11 m ao eixo; inclinação máxima 15 %; capacidade para veículo de 130 kN (40 kN + 90 kN); corredor permanentemente livre para operações de socorro com comprimento ≥ metade do perímetro do recinto, largura útil ≥ 3,5 m e altura útil ≥ 4 m.`, base: 'RT-SCIE, art. 4.º n.os 1, 3, 5 e 6, quadro I', estado: 'aplica' });
    add({ tema: 'II.4', titulo: 'Hidrantes exteriores (recinto ao ar livre)', exigencia: cat <= 2 ? 'Boca ou marco de incêndio a distância ≤ 150 m.' : 'Marco de incêndio a distância ≤ 100 m.', base: 'RT-SCIE, art. 12.º n.º 6, quadro VIII', estado: 'aplica' });
  } else if (H <= 9) {
    add({
      tema: 'II.1', titulo: 'Vias de acesso (edifício com altura ≤ 9 m)',
      exigencia: 'Estacionamento dos veículos de socorro a ≤ 30 m de pelo menos uma saída do edifício; largura útil 3,5 m; altura útil 4 m; raio de curvatura mínimo 11 m ao eixo; inclinação máxima 15 %; capacidade para veículo de 130 kN (40 kN eixo dianteiro, 90 kN eixo traseiro).'
        + (cat === 1 && !temD ? '' : ' Vias em impasse: largura útil 7 m ou rotunda/entroncamento que evite mais de 30 m em marcha-atrás.') + ' Em centros urbanos antigos, admitem-se outras características devidamente fundamentadas.',
      base: 'RT-SCIE, art. 4.º n.os 1, 3, 4 e 7', estado: 'aplica',
    });
  } else {
    add({
      tema: 'II.1', titulo: 'Vias de acesso (edifício com altura > 9 m)',
      exigencia: 'Largura útil 6 m (10 m em impasse); altura útil 5 m; raio de curvatura 13 m; inclinação máxima 10 %; capacidade 260 kN (90 kN + 170 kN); marcha-atrás ≤ 20 m em impasse; faixa de operação com 7 m de largura, ≥ 15 m de comprimento, a 3–10 m da fachada, resistente ao punçoamento de 170 kN em Ø 20 cm e permanentemente livre. Em centros urbanos antigos, admitem-se outras características devidamente fundamentadas.',
      base: 'RT-SCIE, art. 5.º n.os 1 a 4', estado: 'aplica',
    });
    add({ tema: 'II.2', titulo: 'Fachada acessível', exigencia: 'Pelo menos uma fachada acessível aos veículos de socorro nas condições do art. 5.º.', base: 'RT-SCIE, art. 6.º n.º 6', estado: 'aplica' });
  }
  if (!ut.arLivre) {
    const areaMax = Math.max(0, ...pisosUT(ut).map((p) => p.area));
    add({
      tema: 'II.2', titulo: 'Pontos de penetração nas fachadas',
      exigencia: 'Pontos de penetração em todos os pisos até 50 m de altura, à razão mínima de um por cada 800 m² de piso ou fração, com dimensões mínimas de 1,2 × 0,6 m e abertura fácil a partir do exterior.'
        + (areaMax > 0 ? ` Piso de maior área: ${fmt(areaMax)} m² → mínimo ${Math.ceil(areaMax / 800)} ponto(s) nesse piso.` : '')
        + (areaMax > 800 ? ' Pisos com mais de 800 m²: pontos distribuídos uniformemente por, no mínimo, duas fachadas acessíveis, salvo impossibilidade justificada pela inserção urbana.' : '')
        + (H <= 9 ? ' Vãos de janela: pano de peito com espessura ≤ 0,3 m numa extensão de 0,5 m abaixo do peitoril (engate das escadas de ganchos).' : '')
        + ' Fachadas cortina ou envidraçadas contínuas com vãos abertos só para penetração: sinalização ótica automática ou sinalização indelével da prumada acessível.',
      base: `RT-SCIE, art. 6.º n.os 2, ${H <= 9 ? '3, ' : ''}4, 5 e 7`, estado: 'aplica',
    });
    add({
      tema: 'II.4', titulo: 'Hidrantes exteriores',
      exigencia: 'Marcos de incêndio (preferencialmente) ou bocas de incêndio, segundo a EN 14384, a ≤ 30 m das saídas do edifício nas fachadas de acesso às viaturas de socorro e das bocas de alimentação das redes secas ou húmidas; marcos junto ao lancil; bocas em caixa própria, a 0,4–0,8 m do pavimento quando em paredes ou muros. Sem rede pública: depósito ≥ 60 m³ garantindo, em cada hidrante e com um máximo de dois, a 150 kPa, 20 l/s por marco (8 l/s bocas DN 70; 4 l/s DN 50).' + (catEd === 1 ? ' Na 1.ª categoria, sem rede pública e sem possibilidade de cumprir o anterior, admite-se o abastecimento pelas reservas de água do edifício (poços, tanques, cisternas).' : ''),
      base: 'RT-SCIE, art. 12.º n.os 1 a 5, 7' + (catEd === 1 ? ' e 8' : ''), estado: 'aplica',
    });
  }
  add({
    tema: 'II.3', titulo: 'Limitação da propagação pelo exterior',
    exigencia: 'Elementos de fachada entre vãos sobrepostos, paredes de empena, coberturas, revestimentos exteriores e ETICS nas condições dos arts. 7.º a 10.º e quadros II a VI (por classe de altura do edifício). Zonas de segurança em relação a postos de abastecimento de combustíveis, segundo a regulamentação aplicável (art. 11.º).',
    base: 'RT-SCIE, arts. 7.º a 11.º', estado: ut.arLivre ? 'nao' : 'aplica',
    motivo: ut.arLivre ? 'Recinto ao ar livre.' : undefined,
  });

  /* --------------- Resistência ao fogo e compartimentação -------------- */
  const q9 = quadroIX(t, cat);
  // art. 15.º n.os 2 e 4: edifício só com o piso do plano de referência acima do solo (pode ter pisos abaixo); n.º 6 b): só esse piso
  const psUT = pisosUT(ut);
  const soPisoPR = ed.pisosAcimaIndicado ? ed.pisosAcima === 1 : psUT.length > 0 && psUT.every((p) => p.n <= 0);
  const temAbaixo = (ed.pisosAbaixoIndicado || ed.pisosAbaixo > 0) ? ed.pisosAbaixo > 0 : psUT.some((p) => p.n < 0);
  const n2 = soPisoPR && t !== 1 && cat >= 2;
  const unif = t === 1 && cat === 1 ? porFacto(ut, 'unifamiliar', 'Habitação multifamiliar: aplica-se o quadro IX.') : null;
  const isento6b = t !== 1 && cat === 1 && soPisoPR && !temAbaixo;
  add({
    tema: 'III.1', titulo: 'Resistência ao fogo dos elementos estruturais',
    exigencia: n2
      ? `Edifício com um só piso no plano de referência: R 60 (apenas suporte) e REI 60 (suporte e compartimentação); galerias sobrelevadas só com área < 20 % do piso (n.º 3).${temAbaixo ? ` Estrutura dos pisos abaixo do plano de referência: ${q9.suporte} / ${q9.compartimentacao} (quadro IX, n.º 4).` : ''}`
      : `${q9.suporte} (apenas suporte) e ${q9.compartimentacao} (suporte e compartimentação).`,
    base: n2 ? `RT-SCIE, art. 15.º n.os 2, 3${temAbaixo ? ' e 4' : ''}` : 'RT-SCIE, art. 15.º n.º 1, quadro IX',
    ...(unif && unif.estado !== 'nao'
      ? { estado: unif.estado === 'aplica' ? 'nao' as const : 'verificar' as const, motivo: unif.estado === 'aplica' ? 'Habitação unifamiliar da 1.ª categoria: sem exigências (art. 15.º n.º 6 a)).' : unif.motivo }
      : isento6b ? { estado: 'nao' as const, motivo: 'UT II a XII da 1.ª categoria, edifício apenas com um piso ao nível do plano de referência (art. 15.º n.º 6 b)).' }
      : { estado: 'aplica' as const }),
  });
  add({
    tema: 'III.2', titulo: 'Isolamento entre utilizações-tipo distintas',
    exigencia: `Paredes e pavimentos EI/REI ${quadroX(t, cat)} (valor desta UT; adotar o mais gravoso das UT confinantes); separação das vias de evacuação protegidas com a classe mais gravosa dos quadros X, XIX, XX e XXI; vãos de comunicação com vias de evacuação protegidas: ${quadroXI(t, cat)} (ou o mais exigente dos quadros XIX a XXI).${abaixo ? ' Espaços de UT distintas abaixo do plano de referência servidos por via enclausurada não exclusiva: via protegida desses espaços por câmaras corta-fogo (alínea d)).' : ''}`,
    base: 'RT-SCIE, art. 17.º n.º 2 a) a d), quadros X e XI', estado: ed.uts.length > 1 ? 'aplica' : 'nao',
    motivo: ed.uts.length > 1 ? undefined : 'Edifício de utilização exclusiva.',
  });
  // art. 17.º: categorias das outras UT do edifício calculadas (sem pedir confirmação)
  const outrasUT = ed.uts.filter((u) => u.id !== ut.id).map((u) => ({ u, cat: classificar(u).cat }));
  if (ed.uts.length > 1 && ed.comunicacoesComuns) {
    const conflito = (t === 1 && cat >= 2 && outrasUT.some((o) => o.u.tipo === 5 || o.u.tipo >= 7))
      || ((t === 5 || t >= 7) && outrasUT.some((o) => o.u.tipo === 1 && o.cat >= 2));
    if (conflito) add({
      tema: 'III.2', titulo: 'Comunicações interiores comuns com a UT I',
      exigencia: 'Não são permitidas comunicações interiores comuns da UT I das 2.ª, 3.ª ou 4.ª categorias com as UT V e VII a XII, de qualquer categoria.',
      base: 'RT-SCIE, art. 17.º n.º 2 e)', estado: 'aplica',
    });
  }
  const xii34 = outrasUT.filter((o) => o.u.tipo === 12 && o.cat >= 3);
  if (t !== 12 && t !== 2 && t !== 8 && cat >= 2 && xii34.length) add({
    tema: 'III.2', titulo: 'Coexistência com outras UT',
    exigencia: `Não é admitida a coexistência no mesmo edifício de UT XII das 3.ª/4.ª categorias com outras UT das 2.ª à 4.ª categorias (exceto UT II e VIII e UT I da 1.ª categoria destinada a proprietários ou funcionários). Neste edifício existe UT XII da ${xii34[0].cat}.ª categoria.`,
    base: 'RT-SCIE, art. 17.º n.º 1', estado: 'aplica',
  });
  if (t === 12 && cat >= 3) {
    const proibidas = outrasUT.filter((o) => o.cat >= 2 && o.u.tipo !== 2 && o.u.tipo !== 8);
    if (proibidas.length) add({
      tema: 'III.2', titulo: 'Coexistência com outras UT',
      exigencia: `Não é admitida a coexistência no mesmo edifício de UT XII das 3.ª/4.ª categorias com outras UT das 2.ª à 4.ª categorias (exceto UT II e VIII e UT I da 1.ª categoria destinada a proprietários ou funcionários). Neste edifício: ${proibidas.map((o) => `UT ${ROMANO[o.u.tipo]} (${o.cat}.ª categoria)`).join(', ')}.`,
      base: 'RT-SCIE, art. 17.º n.º 1', estado: 'aplica',
    });
  }
  if (t === 12) {
    const caso = ut.casoXII ?? 3;
    const l = quadroL(caso, cat);
    add({
      tema: 'III.3', titulo: 'Compartimentação corta-fogo da UT XII',
      exigencia: `Caso ${['I', 'II', 'III', 'IV'][caso - 1]}: área máxima por compartimento acima do plano de referência ${l.acima === Infinity ? 'sem limite' : fmt(l.acima ?? 0) + ' m²'}; abaixo ${l.abaixo === null ? 'não aplicável' : fmt(l.abaixo) + ' m²'}. Isolamento EI/REI 60 com vãos E 30 / E 30 C.`,
      base: 'RT-SCIE, art. 302.º, quadro L; art. 18.º n.º 7', estado: 'aplica',
    });
  } else {
    const q12 = quadroXII(t, temD);
    const isento = t === 1 && cat === 1;
    add({
      tema: 'III.3', titulo: 'Compartimentação geral corta-fogo',
      exigencia: `Cada piso constitui, em regra, compartimento corta-fogo distinto. Área máxima por compartimento: ${fmt(q12.acima)} m² acima/no plano de referência; ${fmt(q12.abaixo)} m² abaixo${q12.nota ? ` (${q12.nota})` : ''}. Isolamento EI/REI ${t === 1 || (t >= 3 && t <= 10) ? 30 : 60} com vãos E 30 (fixos) ou E 30 C. Áreas duplicáveis com sprinklers de cobertura total, exceto UT I e locais D (n.º 6).${H <= 9 && [3, 4, 5, 7, 8].includes(t) ? ` Edifício de pequena altura: até três pisos podem constituir um só compartimento, se a área total não exceder o quadro XII, nenhum piso exceder 800 m² nem estiver mais de um piso abaixo do plano de referência${t === 4 || t === 5 ? ' e os locais D estiverem só no piso do plano de referência' : ''} (n.º 4).` : ''}${[6, 8, 9, 10].includes(t) ? ' Espaços amplos cobertos: áreas ampliáveis com controlo de fumo e altura livre de fumo ≥ 4 m, mediante justificação (n.º 5).' : ''} Interligações entre pisos que não sejam vias de evacuação (rampas, escadas rolantes, pátios abertos) dispensam elementos fixos se os compartimentos respeitarem o quadro XII, não houver habitação nem locais D ou E e o controlo de fumo for por hierarquia de pressões (n.º 8).`,
      base: 'RT-SCIE, art. 18.º n.os 1, 2, 4 a 8, quadro XII', estado: isento ? 'nao' : 'aplica',
      motivo: isento ? 'Espaços da UT I da 1.ª categoria (art. 18.º n.º 3).' : undefined,
    });
  }
  if (!ut.arLivre) add({
    tema: 'III.3', titulo: 'Pátios interiores e poços de luz',
    exigencia: 'Em planta, inscrever um cilindro de diâmetro ≥ H (H ≤ 7 m, mínimo 4 m) ou ≥ √(7H) (H > 7 m); paredes confinantes com as condições do art. 7.º; pátios cobertos com tetos e paredes A2-s1, d0 e pavimentos Cfl-s2; obturação dos vãos dos tetos ≥ B-s1, d0; envolvente de pátios cobertos fechados EI 30 junto a locais D ou E ou a caminhos que sirvam locais D (nos que sirvam locais E, admite-se controlo de fumo ativo com painéis de cantonamento ou telas).',
    base: 'RT-SCIE, art. 19.º', ...porFacto(ut, 'patio', 'Não existem pátios interiores nem poços de luz.'),
  });
  add({
    tema: 'III.5e', titulo: 'Atravessamentos e condutas',
    exigencia: `Selagem dos atravessamentos com a resistência do elemento atravessado (registos corta-fogo, ou metade do tempo se em ductos com porta de igual valor); em ductos as canalizações com DN > 315 mm${H > 28 ? ' e as que atravessem compartimentação corta-fogo (edifício de grande altura)' : ''}; meios de isolamento nas condutas com DN > 75 mm que atravessem compartimentação ou separação entre entidades e nas de efluentes de combustão; ductos > 0,2 m² em A1, seccionados por septos A1 (exceto os de líquidos e gases combustíveis, ventilados na base e no topo com ≥ 0,1 m²); portas de ductos ${H <= 28 ? 'E 30 C' : 'E 60 C'}; portinholas com fecho C; obturadores comandados por deteção automática e manual. Vias interiores protegidas, comunicações verticais não seláveis (condutas de lixo, courettes de gás, caixas de elevador) e locais C e F constituem compartimentos corta-fogo.`,
    base: 'RT-SCIE, art. 14.º n.os 5, 8, 10 a 12; arts. 29.º a 33.º e 37.º', estado: t === 1 ? 'verificar' : 'aplica', motivo: t === 1 ? 'Ductos e condutas em espaços exclusivamente da UT I segundo a NP 1037 estão excluídos (art. 14.º n.º 9 e art. 29.º n.º 3).' : undefined,
  });

  /* ---------------- Isolamento e proteção de locais de risco ------------ */
  for (const k of ['B', 'C', 'Cag', 'D', 'E', 'F'] as const) {
    const q = ENVOLVENTE_LOCAIS[k];
    const existe = locais.has(k);
    const nome = k === 'Cag' ? 'C agravado' : k;
    add({
      tema: 'III.4', titulo: `Envolvente de locais de risco ${nome}`,
      exigencia: `Paredes sem função de suporte ${q.paredes}; pavimentos e paredes com função de suporte ${q.suporte}; portas ${q.portas}.`
        + (k === 'D' ? ' Locais D com área útil > 400 m² subcompartimentados com as mesmas classes, permitindo evacuação horizontal.' : '')
        + (k === 'C' ? ' Cozinhas ligadas a salas de refeições: admite-se que só a envolvente do conjunto cumpra, com controlo de fumo (n.º 2).' : '')
        + ((k === 'C' || k === 'Cag') && ut.arLivre ? ' Recintos ao ar livre: portas E 30 C admitidas a mais de 5 m de locais com público ou de caminhos de evacuação (art. 21.º n.os 5 e 6).' : ''),
      base: `RT-SCIE, art. ${q.artigo}, quadro ${q.quadro}`, estado: sim(existe), motivo: existe ? undefined : `Sem locais de risco ${nome} registados.`,
    });
  }
  add({
    tema: 'III.4', titulo: 'Localização de locais de risco B acessíveis a público',
    exigencia: 'Próximo do piso de saída para o exterior; se abaixo das saídas, diferença de cota ≤ 6 m (exceto anfiteatros e plataformas de embarque da UT VIII).',
    base: 'RJ-SCIE, art. 11.º n.os 1 e 2', estado: sim(locais.has('B')), motivo: locais.has('B') ? undefined : 'Sem locais de risco B.',
  });
  add({
    tema: 'III.4', titulo: 'Localização de locais de risco C agravado',
    exigencia: 'Sempre que possível ao nível do plano de referência e na periferia; sem comunicação direta com locais D, E ou F nem com vias verticais que sirvam outros espaços; portas a abrir no sentido da saída.',
    base: 'RJ-SCIE, art. 11.º n.º 3; RT-SCIE, art. 62.º n.º 11', estado: sim(temCag), motivo: temCag ? undefined : 'Sem locais de risco C agravado.',
  });
  add({
    tema: 'III.4', titulo: 'Localização de locais de risco D e E',
    exigencia: 'Ao nível ou acima do piso de saída para local seguro no exterior.',
    base: 'RJ-SCIE, art. 11.º n.º 4', estado: sim(temDE), motivo: temDE ? undefined : 'Sem locais de risco D ou E.',
  });

  /* ---------------- Isolamento e proteção das vias -------------------- */
  const q19 = quadroXIX(H);
  const viasProt: string[] = [];
  if (cat >= 3) viasProt.push('vias integradas nas comunicações comuns (UT da 3.ª/4.ª categoria)');
  viasProt.push('vias integradas nas comunicações comuns com comprimento > 30 m');
  if (H > 28 || abaixo) viasProt.push('vias com comprimento > 10 m em pisos acima de 28 m ou abaixo do plano de referência');
  if (locais.has('B')) viasProt.push('caminhos de locais B sem vias alternativas');
  if (temD) viasProt.push('caminhos de locais de risco D');
  viasProt.push('galerias fechadas de ligação entre edifícios independentes ou entre corpos do mesmo edifício');
  add({
    tema: 'III.5a', titulo: 'Proteção das vias horizontais de evacuação',
    exigencia: `Vias protegidas: ${viasProt.join('; ')}. Envolvente (altura ${classe.toLowerCase()}): paredes ${q19.paredes}, paredes de suporte ${q19.suporte}, portas ${q19.portas}. Vias com acesso direto a locais D ou E: a classe mais gravosa dos quadros XIV a XIX (n.º 5). Vias exteriores em impasse a menos de 2 m para cada lado e 8 m à frente de um vão: vão ou via E 30, salvo vão a mais de 6 m acima da via (n.os 3 e 4).`,
    base: 'RT-SCIE, art. 25.º, quadro XIX', estado: 'aplica',
  });
  const vertIsenta = (t === 1 && cat === 1);
  const n4art18 = H <= 9 && [3, 4, 5, 7, 8].includes(t);
  const q20 = H <= 28 ? 'saída direta ao exterior ou em átrio com acesso direto ao exterior: sem exigências; restantes: portas E 30 C' : 'saída direta ao exterior: sem exigências; em átrio com acesso direto ao exterior (sem ligação a outros espaços, salvo caixas de elevador protegidas): portas E 30 C; restantes: portas EI 60 C';
  const q21 = H <= 28 ? 'via enclausurada — do interior portas E 30 C, do exterior E 15 C; via ao ar livre — do interior portas E 30 C' : 'via enclausurada — do interior câmara corta-fogo, do exterior portas E 15 C; via ao ar livre — do interior portas EI 60 C';
  add({
    tema: 'III.5b', titulo: 'Proteção das vias verticais de evacuação',
    exigencia: `Paredes e pavimentos com escalão de tempo ≥ ao dos elementos estruturais (${q9.compartimentacao}). Acessos no piso de saída (quadro XX): ${q20}. Acessos nos restantes pisos acima do plano de referência (quadro XXI): ${q21}.${abaixo ? ' Vias abaixo do plano de referência: no piso de saída portas E 30 C; nos restantes pisos, enclausurada — câmara corta-fogo do interior e portas E 15 C do exterior; ao ar livre — portas EI 30 C do interior; dispensam câmara se derem acesso direto ao exterior (n.º 5).' : ''} Vias exteriores com as distâncias de segurança do art. 25.º n.º 3. Dispensadas as escadas que ligam níveis do mesmo compartimento corta-fogo${n4art18 ? ' e as que servem em exclusivo os espaços do art. 18.º n.º 4 (três pisos num compartimento)' : ''}.`,
    base: 'RT-SCIE, art. 26.º, quadros XX e XXI', estado: vertIsenta ? 'nao' : 'aplica',
    motivo: vertIsenta ? 'Vias que sirvam em exclusivo UT I da 1.ª categoria (art. 26.º n.º 1 a)).' : undefined,
  });
  const q22 = quadroXXII(H);
  add({
    tema: 'III.5c', titulo: 'Outras circulações verticais',
    exigencia: `Circulações verticais interiores que não sejam vias de evacuação: paredes ${q22.paredes}, paredes de suporte ${q22.suporte}, portas ${q22.portas}. Escadas mecânicas e tapetes rolantes: isolamento por obturadores automáticos e sinal «Em caso de incêndio não utilize este caminho».`,
    base: 'RT-SCIE, art. 27.º, quadro XXII', estado: 'aplica',
  });
  add({
    tema: 'III.5d', titulo: 'Caixas dos elevadores',
    exigencia: `${H > 28 || Math.max(pisosAbaixoUT(ut), ed.pisosAbaixo ?? 0) > 1 ? 'Paredes EI/REI 60 e portas de patamar E 30 C (servem mais de um piso abaixo do plano de referência ou H > 28 m).' : `Paredes ${q22.paredes} / ${q22.suporte} e portas ${q22.portas} (quadro XXII).`} Portas de patamar de funcionamento automático.${t === 2 && abaixo ? ' UT II abaixo do plano de referência: acesso aos elevadores por câmara corta-fogo, que pode ser comum à da escada (n.º 2).' : ''}${H > 28 ? ' Elevador prioritário de bombeiros servido por câmara corta-fogo.' : ''}`,
    base: 'RT-SCIE, art. 28.º', ...porFacto(ut, 'elevadores', 'Não existem elevadores.'),
  });
  add({
    tema: 'III.5b', titulo: 'Câmaras corta-fogo',
    exigencia: 'Envolvente EI 60 / REI 60, portas E 30 C; área ≥ 3 m² (≥ 6 m² se utilizáveis por mais de 50 pessoas); distância entre portas ≥ 1,2 m; pé-direito ≥ 2 m; dimensão linear ≥ 1,40 m; portas a abrir no sentido da saída se integrada em caminho de evacuação, para o interior nos restantes casos; controlo de fumo. Sem ductos, acessos a ductos, canalizações de gases ou líquidos combustíveis, instalações elétricas (salvo as de segurança da câmara) nem objetos (salvo extintores, bocas de incêndio e sinalização). Sinal «Câmara corta-fogo. Manter esta porta fechada» na face exterior das portas.',
    base: 'RT-SCIE, arts. 35.º e 63.º', ...(camarasExigidas(ctx) ? { estado: 'aplica' as Estado } : porFacto(ut, 'camarasCF', 'Não são exigidas nem existem câmaras corta-fogo.')),
  });
  add({
    tema: 'III.5a', titulo: 'Portas resistentes ao fogo',
    exigencia: `Escalão de tempo igual a metade do da parede onde se inserem, salvo casos particulares; portas em caminhos de evacuação com fecho automático (classe C); se mantidas abertas, retenção libertada em caso de incêndio, com seletor de fecho nas de duas folhas e sinal «Porta corta-fogo. Não colocar obstáculos que impeçam o fecho».${t === 1 || t === 2 ? ' Nas UT I e II, as portas de câmaras corta-fogo e de acesso a vias verticais não podem estar normalmente abertas.' : ''}`,
    base: 'RT-SCIE, arts. 34.º e 36.º', estado: 'aplica',
  });

  /* ---------------------------- Reação ao fogo ------------------------- */
  const q24 = quadroXXIV(H);
  const isentoRF = t === 1;
  add({
    tema: 'IV.1a', titulo: 'Revestimentos de vias horizontais de evacuação',
    exigencia: [quadroXXIII(9), ...(H > 9 ? [quadroXXIII(28)] : []), ...(H > 28 || abaixo ? [quadroXXIII(29)] : [])].map((q) => `${q.faixa}: paredes e tetos ${q.paredes}; pavimentos ${q.pavimentos}`).join('. ') + (t === 1 ? '. Só nos espaços comuns da UT I (art. 38.º n.º 2).' : '.'),
    base: 'RT-SCIE, art. 39.º, quadro XXIII', estado: 'aplica',
  });
  add({
    tema: 'IV.1b', titulo: 'Revestimentos de vias verticais',
    exigencia: `${q24.faixa}: paredes e tetos ${q24.paredes}; pavimentos ${q24.pavimentos}. Vias exteriores: paredes e tetos B-s3, d0; pavimentos Cfl-s2.`,
    base: 'RT-SCIE, art. 40.º, quadro XXIV', estado: 'aplica',
  });
  add({
    tema: 'IV.1c', titulo: 'Revestimentos de câmaras corta-fogo',
    exigencia: `${q24.faixa}: paredes e tetos ${q24.paredes}; pavimentos ${q24.pavimentos}.`,
    base: 'RT-SCIE, art. 40.º, quadro XXIV', ...(camarasExigidas(ctx) ? { estado: 'aplica' as Estado } : porFacto(ut, 'camarasCF', 'Não existem câmaras corta-fogo.')),
  });
  const locaisRF = [...locais].map((l) => (l === 'Cag' ? 'C' : l));
  const linhasRF = [...new Set(locaisRF)].sort().map((l) => `local ${l}: paredes e tetos ${QUADRO_XXV[l].paredes}, pavimentos ${QUADRO_XXV[l].pavimentos}`);
  add({
    tema: 'IV.2', titulo: 'Revestimentos de locais de risco',
    exigencia: (linhasRF.length ? linhasRF.join('; ') + '.' : 'Classes do quadro XXV em função do local de risco.') + ' Materiais de correção acústica com as mesmas classes (classe E admitida se protegidos por elementos resistentes ao fogo ou A1 sem rasgos, art. 48.º).' + (isentoRF ? ' Só nos espaços comuns: os espaços não comuns da UT I estão isentos (art. 38.º n.º 2).' : ''),
    base: 'RT-SCIE, arts. 41.º e 48.º, quadro XXV', estado: 'aplica',
  });
  add({
    tema: 'IV.3', titulo: 'Tetos falsos, mobiliário fixo e elementos suspensos',
    exigencia: 'Tetos falsos ≥ C-s2, d0 com fixações e suspensões A1; difusores de luz ≤ 25 % da área e ≥ D-s2, d0 (art. 43.º). Mobiliário fixo em locais B ou D ≥ C-s2, d0 (enchimento D-s3, d0 com forro C-s1, d0); cadeiras, poltronas e bancos para o público C-s2, d0 (estofados: estrutura D-s2, d0 e enchimento D-s3, d0 com invólucro C-s1, d0) (art. 44.º). Elementos em relevo ou suspensos em vias de evacuação ≤ 20 % da área da parede ou teto e ≥ B-s1, d0 (C-s1, d0 em locais B); proibidos reposteiros ou elementos suspensos transversais ao sentido da evacuação nas vias e saídas de locais B a F (art. 45.º). Caixas de elevadores, condutas, ductos e outras comunicações verticais, e os seus septos, em A1 (art. 42.º). Decoração temporária afastada de fontes de calor; materiais sem classe só em festas ou exposições, sobre suportes D-s1, d0 / Dfl-s1, com as medidas do art. 195.º (art. 49.º).'
      + ([6, 9].includes(t) ? ' Palcos, estrados, bancadas e pavimentos elevados ≥ C-s2, d0 sobre estrutura A1, com pavimentos contínuos, degraus com espelho e zonas subjacentes fechadas lateralmente com D-s1 (art. 47.º).' : ''),
    base: 'RT-SCIE, arts. 42.º a 45.º, 47.º e 49.º', estado: 'aplica',
  });

  if ([6, 9].includes(t)) add({
    tema: 'IV.3', titulo: 'Tendas e estruturas insufláveis',
    exigencia: 'Cobertura, cobertura dupla e paredes ≥ C-s2, d0; claraboias e faixas transparentes ≥ D-s2, d0 (rígidas) ou D-s3, d0 (flexíveis ≤ 5 mm), no máximo 20 % da área e afastadas > 3,5 m entre si; arts. 44.º e 45.º aplicáveis aos insufláveis. Locais de risco C no exterior, a ≥ 5 m da envolvente (art. 21.º n.º 4). Insufláveis: grupo de pressurização normal e de emergência, alimentados por fontes centrais, com condutas ≥ A2-s1, d0, antirretorno e obturador EI 30 por fusível a 70 °C; motores térmicos no exterior a ≥ 5 m; deteção de abaixamento anormal de pressão e ordem de evacuação se o grupo normal parar mais de 10 min sem o de emergência (art. 100.º).',
    base: 'RT-SCIE, arts. 21.º n.º 4, 46.º e 100.º', ...porFacto(ut, 'tendas', 'O recinto não está em tenda nem em estrutura insuflável.'),
  });

  /* ------------------------------ Evacuação ---------------------------- */
  for (const e of ut.espacos) {
    const c = efetivoEspaco(e);
    if (c.valor <= 0) continue;
    const ev = c.evacuacao;
    const s = saidasMinimas(ev, ut.arLivre);
    const up = upMinimas(ev, ut.arLivre);
    let upMin = up.n;
    const extras: string[] = [];
    if (!ut.arLivre && ev >= 200) { upMin = Math.max(upMin, 2); extras.push('saídas com ≥ 2 UP (efetivo ≥ 200, art. 56.º n.º 2 a))'); }
    if (ut.arLivre && ev >= 600) { upMin = Math.max(upMin, 2); extras.push('saídas com ≥ 2 UP (efetivo ≥ 600 ao ar livre, art. 56.º n.º 2 b))'); }
    const pisoE = pisosUT(ut).find((p) => p.n === nPiso(e.piso));
    if (!ut.arLivre && ev > 50 && pisoE && (pisoAbaixo(pisoE) || (H > 28 && (pisoE.cota ?? pisoE.n) > 0))) { upMin = Math.max(upMin, 2); extras.push(pisoAbaixo(pisoE) ? 'saídas com ≥ 2 UP (efetivo > 50 abaixo do nível de saída, art. 56.º n.º 4 b))' : 'saídas com ≥ 2 UP (efetivo > 50 acima do plano de referência, H > 28 m, art. 56.º n.º 4 b))'); }
    if (e.local === 'D') extras.push('saídas para vias protegidas ou exterior (art. 60.º); 2 UP onde se evacuem pessoas em camas, ou 1,1 m se forem menos de três (art. 56.º n.º 4 c))');
    if (ev > 200) extras.push('barras antipânico nas portas (art. 62.º n.º 7 a))');
    if (ev > 50) extras.push(t === 1 ? 'portas sem trancamento durante o funcionamento e com sinalização do modo de operar (art. 62.º n.os 1 b), c) e 3)' : 'portas a abrir no sentido da evacuação, sem trancamento durante o funcionamento e com sinalização do modo de operar (art. 62.º n.º 1)');
    const semQ29 = t === 1 || t === 2; // art. 54.º n.º 1: o quadro XXIX não se aplica às UT I e II
    const conforme = (semQ29 || e.saidasExistentes === undefined || e.saidasExistentes >= s.n) && (e.upExistentes === undefined || e.upExistentes >= upMin);
    const verif = e.saidasExistentes !== undefined || e.upExistentes !== undefined;
    add({
      tema: 'V.1a', titulo: `Saídas — ${e.nome || 'espaço'} (${e.piso || '—'})`,
      exigencia: `Efetivo ${c.valor}${e.mobilidadeReduzida ? ` × 1,3 = ${ev} para dimensionamento` : ''}: ${semQ29 ? `n.º de saídas sem critério do quadro XXIX (UT ${t === 1 ? 'I' : 'II'}, art. 54.º n.º 1)${t === 2 ? ', condicionado pelas distâncias do art. 218.º' : ''}` : `mínimo ${s.n} saída(s) [${s.texto}]`} e ${upMin} UP [${up.texto}]${extras.length ? '; ' + extras.join('; ') : ''}.`
        + (verif ? ` Existente: ${e.saidasExistentes ?? '—'} saída(s), ${e.upExistentes ?? '—'} UP → ${conforme ? 'CONFORME' : 'NÃO CONFORME'}.` : ''),
      base: `RT-SCIE, arts. 54.º e 56.º, quadros ${ut.arLivre ? 'XXX e XXXII' : semQ29 ? 'XXXI' : 'XXIX e XXXI'}${e.mobilidadeReduzida ? '; art. 51.º n.º 5' + (t === 5 ? ' e art. 232.º' : '') : ''}`,
      estado: 'aplica',
    });
  }
  if (t === 12) {
    const d = quadroLI(cat);
    add({ tema: 'V.1a', titulo: 'Distâncias máximas nos locais (UT XII)', exigencia: `Impasse ≤ ${d.impasse} m; com alternativa de fuga ≤ ${d.alternativa} m (dobro ao ar livre).`, base: 'RT-SCIE, art. 304.º, quadro LI', estado: 'aplica' });
  } else {
    add({
      tema: 'V.1a', titulo: 'Distâncias máximas a percorrer nos locais',
      exigencia: t === 2 && !ut.arLivre
        ? 'Parque coberto: até à saída mais próxima, para o exterior ou para via de evacuação protegida, ≤ 25 m nos pontos em impasse e ≤ 40 m nos pontos com acesso a saídas distintas, medidos segundo os eixos dos caminhos de evacuação.'
        : t === 2 ? 'Impasse e saídas distintas: condições específicas da UT II (título VIII).'
        : `${t === 1 && cat === 1 ? 'Sem limite de 15 m em impasse (exceção da UT I da 1.ª categoria)' : '≤ 15 m em impasse'}; ${[8, 10].includes(t) ? 'com acesso a saídas distintas: condições específicas da UT ' + R + ' (título VIII)' : '≤ 30 m com acesso a saídas distintas (+50 % em locais amplos > 800 m² no piso do plano de referência com saídas diretas ao exterior, n.º 3)'}; dobro ao ar livre (n.º 4).${t === 1 && cat > 1 ? ' Na UT I das 2.ª a 4.ª categorias apenas nas circulações horizontais comuns (n.º 2 c)).' : ''}`,
      base: t === 2 && !ut.arLivre ? 'RT-SCIE, arts. 57.º n.º 2 e 218.º n.º 1' : 'RT-SCIE, art. 57.º', estado: 'aplica',
    });
  }
  add({
    tema: 'V.2', titulo: 'Distâncias nas vias horizontais de evacuação',
    exigencia: `Conduzem, diretamente ou por câmaras corta-fogo, a vias verticais ou ao exterior. Até saída para o exterior ou via vertical protegida: ≤ ${temDE ? '10 m em impasse (vias que servem locais D ou E)' : '15 m em impasse'}; ≤ ${H > 28 || (abaixo && t !== 2) || temD ? 20 : 30} m fora de impasse${H > 28 || (abaixo && t !== 2) || temD ? ' (20 m em pisos acima de 28 m, abaixo do plano de referência salvo UT II, ou vias que servem locais D)' : ''}; dobro em vias exteriores.${t === 1 || t === 2 ? '' : ' Largura útil pelos quadros XXXI/XXXII com o efetivo dos locais servidos; troços entre vias verticais e o exterior com o maior entre o efetivo do piso de saída e o das vias verticais.'} Largura variável: conta a menor; só pode aumentar no sentido da saída.`,
    base: 'RT-SCIE, art. 61.º', estado: 'aplica',
  });
  // vias verticais
  const pisosOrd = [...ef.porPiso];
  let maxDois = 0;
  for (let i = 0; i < pisosOrd.length; i++) {
    const a = pisosOrd[i].evacuacao + (pisosOrd[i + 1]?.evacuacao ?? 0);
    if (a > maxDois) maxDois = a;
  }
  const upV = Math.max(Math.ceil(maxDois / 70), H > 28 ? 2 : 1);
  add({
    tema: 'V.3', titulo: 'Vias verticais de evacuação',
    exigencia: `${H > 28 ? 'Pelo menos duas vias verticais (H > 28 m); acessos às escadas ou às câmaras afastados ≥ 10 m e ligados por comunicação horizontal comum. ' : 'Número imposto pelas distâncias a percorrer; com duas ou mais vias a servir os mesmos pisos, acessos afastados ≥ 10 m. '}${t === 1 || t === 2 ? 'Vias que servem exclusivamente UT I e II: sem a regra de 1 UP por 70 utilizadores (n.º 11). ' : `Largura útil ≥ 1 UP por 70 utilizadores ou fração, considerando a maior soma dos efetivos de dois pisos consecutivos${maxDois ? `: ${maxDois} → ${upV} UP (verificar a ordem dos pisos)` : ''}${H > 28 ? ', mínimo 2 UP' : ''}. `}Contínuas até ao piso do plano de referência; se não, ligações horizontais simples, < 10 m e com a mesma proteção. Barras antipânico nos acessos utilizáveis por mais de 50 pessoas. Vias abaixo do plano de referência não comunicam diretamente com as de cima (exceto 1.ª/2.ª categoria com ≤ 3 pisos). Controlo de fumo${H <= 9 ? '; proteção dispensável com um só piso abaixo do plano de referência, se não forem a única via de locais B, D, E ou F (n.º 9)' : ''}. Comunicação com locais C só por câmara corta-fogo.`,
    base: 'RT-SCIE, art. 64.º; art. 62.º n.º 7 b)', estado: 'aplica',
  });
  add({
    tema: 'V.3', titulo: 'Escadas e rampas',
    exigencia: 'Escadas: no máximo dois lanços consecutivos sem mudança de direção; 3 a 25 degraus por lanço, iguais em cada lanço; sem espelho, sobreposição ≥ 50 mm; patamares ≥ 1 m; curvas com declive constante, cobertor ≥ 0,28 m a 0,6 m da face interior e ≤ 0,42 m na face exterior (com menos de 2 UP só entre dois pisos acima do plano de referência, sem locais D/E e com outra via); corrimão contínuo (dos dois lados e degraus antiderrapantes com ≥ 3 UP; intermédios com > 5 UP). Rampas: declive ≤ 10 % (≤ 6 % para mobilidade condicionada), patamares ≥ 2 m, piso antiderrapante. Escadas mecânicas e tapetes rolantes só com outras vias de ≥ 70 % da capacidade exigida, no sentido da saída, com paragem nos topos e patamares ≥ 5 m (3 m com 1 UP).',
    base: 'RT-SCIE, arts. 65.º e 66.º', estado: 'aplica',
  });
  if (t === 6 || t === 9) {
    add({
      tema: 'V.1b', titulo: 'Lugares destinados ao público',
      exigencia: `Lugares em filas, cadeiras fixas ao pavimento (rebatíveis com contrapeso); espaçamento ≥ 0,4 m; filas com ≤ ${ut.arLivre ? 24 : ut.factos?.tendas ? 8 : 16} cadeiras entre coxias (${ut.arLivre ? 12 : ut.factos?.tendas ? 4 : 8} entre coxia e parede) e bancadas com ≤ ${ut.arLivre ? 60 : ut.factos?.tendas ? 20 : 40} lugares entre coxias (${ut.arLivre ? 30 : ut.factos?.tendas ? 10 : 20} junto a parede)${ut.arLivre ? ' (+50 % ao ar livre)' : ut.factos?.tendas ? ' (metade em tendas e insufláveis)' : ''}; mais cadeiras só com espaçamento agravado n × 0,02 m (até 0,6 m), coxias de 2 UP e mais uma saída, ou filas até 40 com 0,6 m, coxias laterais de 2 UP e uma saída de 2 UP por cinco filas; bancadas com lugares de 50 cm marcados, altura ≥ 40 cm e profundidade 75 cm.${cat >= 3 ? ' 3.ª/4.ª categoria: coxias transversais de 2 UP, uma por 1 000 pessoas ou fração.' : ''}`,
      base: 'RT-SCIE, art. 53.º' + (t === 9 ? '; art. 284.º' : ''), ...porFacto(ut, 'lugaresFixos', 'Não existem lugares fixos para espectadores.'),
    });
    if (ef.total > (ut.arLivre ? 15000 : 1000)) {
      add({ tema: 'V.1b', titulo: 'Lugares para espectadores com mobilidade condicionada', exigencia: 'Locais reservados servidos por caminhos de evacuação adequados a locais D, sempre que possível com acesso direto a esses caminhos, e com lugar sentado para acompanhante junto a cada um.', base: 'RT-SCIE, art. 60.º n.º 3', estado: 'aplica' });
    }
  }

  /* ---------------- Sinalização e iluminação de emergência ------------- */
  add({
    tema: 'VII.1', titulo: 'Sinalização de segurança',
    exigencia: 'Sinalização nos termos do DL 141/95, da Portaria 1456-A/95 e, nos casos não regulamentados, das EN ISO 7010, ISO 3864 e ISO 16069, acessível a todas as pessoas a quem seja essencial, sem placas ou objetos que a ocultem ou confundam (art. 108.º). Placas fotoluminescentes rígidas com área A ≥ d²/2000 (6 m ≤ d ≤ 50 m) (arts. 109.º e 110.º); salientes entre 2,1 m e 3 m (art. 111.º); visíveis de qualquer ponto, perpendiculares ou a 45° ao sentido da fuga, nas mudanças de direção, espaçadas de 6 a 30 m; nas vias verticais, no patamar de acesso (número do andar ou saída) e no intermédio (sentido); a menos de 2 m em projeção horizontal das fontes luminosas, sem coladas sobre os aparelhos, salvo em difusores nas vias de evacuação e em locais da 1.ª categoria das UT III a XI (art. 112.º).',
    base: 'RT-SCIE, arts. 108.º a 112.º', estado: t === 1 && cat === 1 ? 'nao' : 'aplica',
    motivo: t === 1 && cat === 1 ? 'Excetuados os espaços comuns da UT I da 1.ª categoria e os fogos (art. 108.º n.º 4).' : undefined,
  });
  add({
    tema: 'VII.2', titulo: 'Iluminação de emergência',
    exigencia: `Iluminação de emergência de segurança (ambiente e balizagem/circulação); a de substituição, se existir, com fonte diferente (art. 113.º). Lâmpadas de descarga: 50 % em ≤ 5 s e 100 % em ≤ 60 s; autonomia adequada à evacuação, mínimo 15 min; ambiente (≥ 1 lux no pavimento) em locais B, C, D, E (exceto quartos), F, vestiários ou sanitários públicos > 10 m² e sanitários para mobilidade condicionada; balizagem (5 lux a 1 m do pavimento) a < 2 m de interseções, mudanças de direção, patamares, câmaras corta-fogo, botões de alarme, comandos, meios de 1.ª intervenção e saídas (art. 114.º).${[4, 5, 6, 8, 10, 11].includes(t) ? ' Blocos autónomos do tipo permanente nesses pontos, exceto nos espaços de dormida em locais D e E (art. 115.º n.º 1).' : ' Blocos permanentes ou de luz mantida quando iluminem ou suportem placas de saída (art. 115.º n.º 2).'}${t === 6 ? ' Em salas com obscurecimento total, redução de intensidade admitida com reposição automática (art. 115.º n.º 3).' : ''}${t === 1 ? ' Habitações excluídas (art. 113.º n.º 1).' : ''}`,
    base: 'RT-SCIE, arts. 113.º a 115.º', estado: t === 1 && cat === 1 ? 'nao' : 'aplica',
    motivo: t === 1 && cat === 1 ? 'Excetuada a UT I da 1.ª categoria (art. 113.º n.º 1).' : undefined,
  });

  /* ------------------------- Deteção, alarme e alerta ------------------ */
  let config: 0 | 1 | 2 | 3 = 3;
  let baseCfg = '';
  let notaCfg = '';
  if (t === 1) {
    config = cat <= 2 ? 0 : 2;
    baseCfg = 'art. 126.º';
    notaCfg = cat <= 2 ? 'UT I das 1.ª e 2.ª categorias isenta de alarme (art. 126.º n.º 1); fogos isentos (n.º 2).' : cat === 4 ? 'Configuração 2 com alerta automático (art. 126.º n.º 3).' : 'Configuração 2 (art. 126.º n.º 3); fogos isentos.';
  } else if (t === 2) {
    config = ut.arLivre ? 0 : 3; baseCfg = 'art. 127.º';
    notaCfg = ut.arLivre ? 'Recintos ao ar livre isentos (art. 116.º n.º 2).' : 'Configuração 3 quando exclusiva; configuração 2 admitida se o edifício estiver isento de alarme, com difusores nas caixas de escada e circulações comuns (n.º 2).' + (ut.parqueAutomatico ? ' Parques automáticos com desenfumagem passiva: deteção automática dispensável (n.º 3).' : '');
  } else if ([3, 8, 9, 10].includes(t)) {
    config = cat === 1 ? 1 : 3; baseCfg = 'art. 128.º';
  } else {
    baseCfg = 'art. 129.º';
    if (t === 7 && cat === 1) { config = 1; notaCfg = 'Admite-se a configuração 1 na UT VII da 1.ª categoria (art. 129.º n.º 2 a)).'; }
    else if (cat === 1 && !abaixo) { config = 2; notaCfg = 'Admite-se a configuração 2 na 1.ª categoria exclusivamente acima do solo (art. 129.º n.º 2 b)).'; }
    else config = 3;
    if (ut.turismoRural && cat === 1 && !abaixo && ef.emE <= 20) { config = 1; notaCfg = 'Admite-se a configuração 1 em turismo no espaço rural, de natureza e de habitação da 1.ª categoria, exclusivamente acima do solo, com efetivo em locais E ≤ 20 (art. 129.º n.º 2 c)).'; }
  }
  if ((t === 6 || t === 9 || ut.arLivre) && ut.arLivre && t !== 2) { config = 0; notaCfg = 'Recintos ao ar livre isentos de alarme (art. 116.º n.º 2).'; }
  if (ed.uts.length > 1 && ed.comunicacoesComuns && cat >= 2 && t !== 1 && t !== 2) {
    config = 3; notaCfg += ' Edifício misto com comunicações interiores comuns: configuração 3 e quadro centralizador no posto de segurança (art. 130.º n.º 2).';
  }
  if (t !== 1 && !ut.arLivre && ed.comunicacoesComuns && ed.uts.some((u) => u.tipo === 1)) {
    if (config < 2) config = 2;
    notaCfg += ' Edifício com UT I e comunicações interiores comuns: configuração 2, no mínimo, com difusor de alarme na caixa de escada; se a escada for enclausurada, um difusor em cada patamar de acesso aos fogos (art. 130.º n.os 3 e 4).';
  }
  if ((temC || temF) && config < 2) {
    notaCfg += ' Locais de risco C e F inseridos em sistema, pelo menos, da configuração 2 (art. 131.º).';
  }
  const comps = config ? QUADRO_XXXVI.linhas.filter((l) => l.c[config - 1]).map((l) => l.comp.toLowerCase()) : [];
  add({
    tema: 'VII.3', titulo: 'Configuração do sistema de alarme',
    exigencia: config ? `Configuração ${config}: ${comps.join('; ')}. ${notaCfg}`.trim() : notaCfg || 'Isento.',
    base: `RT-SCIE, ${baseCfg}, art. 125.º, quadro XXXVI`, estado: config ? 'aplica' : 'nao', motivo: config ? undefined : notaCfg,
  });
  if ((temC || temF) && config < 2) {
    add({ tema: 'VII.3', titulo: 'Alarme em locais de risco C e F', exigencia: 'Inserção em sistema de alarme, pelo menos, da configuração 2.', base: 'RT-SCIE, art. 131.º', estado: 'aplica' });
  }
  add({
    tema: 'VII.3', titulo: 'Requisitos de funcionamento do SADI',
    exigencia: 'Sistemas de deteção automática segundo a EN 54 (art. 117.º). Estado de vigília sinalizado; alarme restrito imediato e, sem meios humanos para o explorar, alarme geral imediato; com meios humanos, temporização entre restrito e geral, anulável; alarme geral audível em todo o edifício durante o tempo da evacuação, mínimo 5 min; alerta automático simultâneo com o alarme geral (art. 118.º). Botões nos caminhos horizontais, junto às saídas dos pisos e a locais de riscos especiais, a ~1,2 m, sinalizados e visíveis (art. 119.º). Detetores adequados ao espaço (art. 120.º). Difusores fora do alcance ou protegidos abaixo de 2,25 m, sinal inconfundível; mensagem gravada admitida com sonorização (exceto UT I, V e VII), sem causar pânico com efetivo > 200 e precedida da iluminação de emergência (art. 121.º). Central em local reservado (posto de segurança, se existir) com as funções do art. 122.º, ou repetidor em local vigiado. Fonte de emergência incorporada e exclusiva: 72 h vigília + 30 min alarme (não vigiado) ou 12 h + 5 min (vigiado) (art. 123.º). Alerta automático por rede telefónica ou rádio (dispensável com posto de segurança guarnecido em permanência, se constar do PEI); alerta manual por telefone junto à central com o número dos bombeiros afixado (art. 124.º). Deteção em tetos falsos > 0,8 m e pavimentos sobrelevados > 0,2 m com cablagens, equipamentos ou condutas, com sinalização ótica dos detetores pontuais (art. 132.º).',
    base: 'RT-SCIE, arts. 117.º a 124.º e 132.º', estado: config ? 'aplica' : 'nao', motivo: config ? undefined : 'Sem exigência de alarme.',
  });
  if (t === 5 && temD) add({ tema: 'VII.3', titulo: 'Alarme em locais de risco D (UT V)', exigencia: 'Difusão do alarme não reconhecível pelo público, destinada ao pessoal; na 2.ª categoria ou superior, posto não acessível a público com comunicação oral com o posto de segurança.', base: 'RT-SCIE, art. 236.º', estado: 'aplica' });
  {
    const gas = ut.temGas || (ut.liquidosInflamaveisL ?? 0) > 0 ? { estado: 'aplica' as Estado } : porFacto(ut, 'liquidosGases', 'Não existem gases nem líquidos combustíveis.');
    add({ tema: 'VII.9', titulo: 'Deteção automática de gás combustível', exigencia: `Em locais de risco C com aparelhos de queima de gás ou de armazenamento do quadro XXXV${catEd >= 2 ? ', e nos ductos com canalizações de gás (edifício da 2.ª categoria ou superior)' : ''} (art. 184.º). Unidade de controlo dedicada, detetores e sinalizadores ótico-acústicos com a inscrição «Atmosfera perigosa» e o tipo de gás, no interior e no exterior; a deteção corta automaticamente o gás, com corte manual sinalizado à saída (art. 185.º).`, base: 'RT-SCIE, arts. 184.º e 185.º', ...gas });
  }

  /* ---------------------------- Controlo de fumo ----------------------- */
  const cf: string[] = ['vias verticais enclausuradas', 'câmaras corta-fogo', 'vias horizontais protegidas (art. 25.º n.º 1)'];
  const areaAbaixo = pisosUT(ut).filter(pisoAbaixo).reduce((s, p) => Math.max(s, p.area), 0);
  const efAbaixo = ef.porPiso.filter((p) => pisosUT(ut).some((x) => x.n === nPiso(p.piso) && pisoAbaixo(x))).reduce((s, p) => Math.max(s, p.efetivo), 0); // por piso (art. 135.º n.º 1 d))
  if (abaixo && (efAbaixo > 200 || areaAbaixo > 400)) cf.push('pisos no subsolo (efetivo > 200 ou área > 400 m²)');
  const bGrandes = ut.espacos.filter((e) => e.local === 'B' && efetivoEspaco(e).valor > 500);
  if (bGrandes.length) cf.push(`locais de risco B com efetivo > 500 (${bGrandes.map((e) => e.nome).join(', ')})`);
  if (temCag) cf.push('locais de risco C agravado');
  if (ut.temCozinhaC) cf.push('cozinhas ligadas a salas de refeições (desenfumagem ativa e painéis de cantonamento)');
  if (t === 2 && !ut.arLivre) cf.push('espaços cobertos da UT II');
  if (t === 12) cf.push('espaços da UT XII (art. 306.º)');
  if (ut.espacoCenicoIsolavel) cf.push('espaços cénicos isoláveis');
  if (ut.factos?.patio) cf.push('átrios e corredores adjacentes a pátios interiores cobertos');
  add({
    tema: 'VII.4', titulo: 'Espaços com controlo de fumo obrigatório',
    exigencia: cf.join('; ') + '.'
      + (H > 28 ? ' H > 28 m: vias verticais enclausuradas por sobrepressão duplicada por desenfumagem passiva de emergência; vias horizontais enclausuradas com sistemas ativos de arranque automático.' : '')
      + (pisosAbaixoUT(ut) > 1 ? ' Mais de um piso enterrado: meios ativos, de preferência hierarquia de pressões.' : '')
      + (abaixo ? ' Escadas que servem pisos no subsolo sem saída direta ao exterior: pressurizadas.' : '')
      + ' Desenfumagem passiva interdita em espaços amplos com altura > 12 m.',
    base: 'RT-SCIE, arts. 133.º a 135.º', estado: 'aplica',
  });
  add({
    tema: 'VII.4', titulo: 'Características das instalações de controlo de fumo',
    exigencia: 'Tomadas de ar resguardadas do fumo; vãos de fachada a contar só se abrirem > 60° (de fumo no terço superior); bocas interiores normalmente fechadas por obturadores A1 (E/EI); condutas A1, ≥ EI 15 e com a resistência dos elementos atravessados; exutores pela EN 12101-2; comando manual sinalizado junto aos acessos e no posto de segurança, automático por deteção onde houver detetores, com prioridade sobre os sprinklers e rearme manual (arts. 136.º a 140.º). '
      + 'Passiva: admissão até 1 m do pavimento e evacuação a ≥ 1,8 m; condutas com secção ≥ soma das bocas, relação de lados ≤ 2, ≤ 2 desvios de 20° e ramais ≤ 2 m (arts. 141.º e 142.º). Ativa: insuflação até 1 m; extração a ≥ 1,8 m; fugas < 20 %; ventiladores 400 °C durante 1 h (2 h com H > 28 m ou em pisos enterrados); insuflação < 5 m/s e ~60 % da extração; ventiladores só após abertura dos obturadores; alimentação apoiada por fonte de emergência (arts. 143.º a 147.º). '
      + 'Locais: cantões ≤ 1600 m² e ≤ 60 m (exceto UT II); passiva com admissão entre metade e a totalidade da evacuação e distância a uma abertura ≤ 7 × pé-direito (máx. 30 m); ativa com uma boca por 320 m² e 1 m³/s por 100 m² (mín. 1,5 m³/s)' + (t === 2 && !ut.arLivre ? '; parques fechados 600 m³/h por veículo no compartimento sinistrado e insuflação de 60 % nos adjacentes; parques abertos, semienterrados com aberturas > 0,06 m² por lugar em fachadas opostas, ou da 1.ª categoria com varrimento, consideram-se desenfumados' : '') + ' (arts. 151.º a 154.º). '
      + 'Vias horizontais: passiva com aberturas alternadas a ≤ 10 m (reta) ou 7 m, saídas de locais a ≤ 5 m de um escape, ≥ 0,10 m² por UP, ≤ 5 pisos por conduta; ativa a ≤ 15 m / 10 m, 0,5 m³/s por UP (admissão natural) ou 2–5 m/s com extração 1,3 × a admissão, < 80 Pa face às escadas; sobrepressão ~20 Pa só com escape próprio no local; câmaras pressurizadas 20–80 Pa e ≥ 0,5 m/s; galerias entre edifícios pressurizadas (arts. 155.º a 158.º). '
      + 'Vias verticais: só passiva ou sobrepressão, nunca extração forçada; passiva com abertura no topo ≥ 1 m² (exutor com comando manual no plano de referência) e aberturas inferiores de igual área, ou vãos ≥ 0,25 m² em todos os patamares intermédios; sobrepressão de 20–80 Pa com portas fechadas, ≥ 0,5 m/s com a porta aberta (1 m/s entre câmara e piso), câmara com pressão intermédia e exutor de socorro de 1 m² no topo (arts. 159.º a 161.º).'
      + (ut.factos?.patio ? ' Pátios cobertos: admissão em baixo, exutores na cobertura a ≥ 4 m de paredes com vãos, áreas ≥ 5 % da maior secção, detetores óticos lineares (também a meia altura se > 12 m), comando manual no piso principal e painéis de cantonamento junto a vias de locais A ou B (altura livre de fumo ≥ 2 m) (arts. 148.º a 150.º).' : ''),
    base: 'RT-SCIE, arts. 136.º a 161.º', estado: 'aplica',
  });

  /* --------------------------- Meios de intervenção -------------------- */
  const extIsento = t === 1 && cat <= 2;
  const extPisos = pisosUT(ut).map((p) => p.area > 0 ? `${p.nome}: ${Math.max(Math.ceil(p.area / 200), 2)} extintores (1 por 200 m², mín. 2) e ${Math.ceil(p.area / 500) * 18} L de agente padrão (18 L por 500 m²)` : `${p.nome}: área do piso por indicar (dados complementares)`);
  add({
    tema: 'VII.5', titulo: 'Extintores portáteis',
    exigencia: `Distância ≤ 15 m de qualquer saída de local de risco até ao extintor mais próximo; manípulo ≤ 1,2 m; em todos os locais C e F.${extPisos.length ? ' Dimensionamento por piso — ' + extPisos.join('; ') + '.' : ' Por piso: 1 extintor por 200 m² ou fração (mínimo 2) e 18 L de agente extintor padrão por 500 m² ou fração.'}${temC ? ' Cozinhas e laboratórios C: manta ignífuga; extintor 25F com óleos ou gorduras.' : ''} Distribuídos, sinalizados, em suporte ou nicho, de preferência nas comunicações horizontais ou câmaras corta-fogo e no interior dos grandes espaços junto às saídas.${ut.factos?.centralTermica ? ' Centrais térmicas > 70 kW: com combustível sólido ou líquido, 100 l de areia com pá e extintores 34 B (dois por queimador, máximo quatro); a gás, um extintor de pó ABC 5 A/34 B (n.º 6).' : ''}${ut.factos?.tendas ? ' Tendas e insufláveis: também extintores móveis de pó ABC de 50 kg, um por cada 8 portáteis ou fração (n.º 7).' : ''}`,
    base: 'RT-SCIE, art. 163.º', estado: extIsento || (ut.arLivre && !temC) ? 'nao' : 'aplica',
    motivo: extIsento ? 'UT I das 1.ª e 2.ª categorias (art. 163.º n.º 1).' : ut.arLivre && !temC ? 'Ao ar livre só são exigidos em locais de risco C (art. 163.º n.º 8): não existem.' : undefined,
  });
  const carretelCond =
    ([2, 3, 4, 5, 6, 7, 8, 11, 12].includes(t) && cat >= 2) ||
    (t === 2 && cat === 1 && !ut.arLivre && ut.areaBruta > 500) ||
    ([1, 9, 10].includes(t) && cat >= 3) ||
    ut.espacos.some((e) => efetivoEspaco(e).valor > 200);
  const ruralVII = t === 7 && cat === 2 && ut.turismoRural;
  add({
    tema: 'VII.5', titulo: 'Rede de incêndio armada tipo carretel',
    exigencia: 'Carretéis EN 671-1 que cubram todos os pontos a ≤ 5 m de uma agulheta; distância entre bocas ≤ 2× o comprimento da mangueira; junto às saídas para vias verticais (< 3 m) e junto às saídas de locais com > 200 pessoas; manípulo ≤ 1,5 m; tambor fixo só à face da parede, encastrados de rodar ou pivotar, armários homologados com porta a abrir 170°; espaço livre de 1 m de raio e 2 m de altura (art. 166.º). Caudal de 1,5 l/s por boca com metade abertas (máx. 4) e K ≥ 42 (1 l/s com K = 64 nos casos do n.º 3); canalização independente; ' + (cat <= 2 ? 'rede pública admitida se houver garantia de pressão e caudal; senão ' : '') + 'depósito privativo com grupo sobrepressor apoiado por fonte de emergência; manómetros nos pontos mais desfavoráveis (art. 167.º).',
    base: 'RT-SCIE, arts. 164.º a 167.º', estado: ruralVII ? 'nao' : sim(carretelCond),
    motivo: ruralVII ? 'UT VII da 2.ª categoria de turismo no espaço rural dispensada (art. 257.º).' : carretelCond ? undefined : 'Não preenche as condições do art. 164.º.',
  });
  const seg = cat >= 3 ? 'húmida' : (t === 1 || t === 2) && cat === 2 ? 'seca ou húmida' : '';
  add({
    tema: 'VII.5', titulo: 'Meios de segunda intervenção (rede seca/húmida)',
    exigencia: seg
      ? `Rede ${seg}${cat === 4 && [4, 5, 6, 8, 12].includes(t) ? ' com bocas de incêndio armadas tipo teatro (EN 671-2)' : ''}; bocas duplas DN 50 storz a 0,8–1,2 m nos patamares ou CCF de todos os pisos; no piso de referência noutro local sinalizado; à vista, em nichos ou armários sinalizados, a ≥ 0,5 m da base; boca siamesa sinalizada no exterior, junto a acesso dos bombeiros, a ≤ 14 m da coluna (art. 169.º)${cat === 4 && [4, 5, 6, 8, 12].includes(t) ? '; bocas teatro de 45 ou 70 mm na caixa de escada ou câmara corta-fogo (art. 170.º)' : ''}${cat >= 3 ? '; rede húmida permanentemente em carga, com depósito privativo e grupo sobrepressor, alimentação alternativa pelos bombeiros por tubo seco e redes secas admitidas onde haja risco de congelamento (art. 168.º n.os 4 a 6); depósito e grupo dimensionados para a operação simultânea dos meios manuais e automáticos, 3 l/s por boca com metade abertas (máx. 4), K = 85; central de bombagem é local de risco F (art. 171.º)' : ''}.`
      : 'Não exigida.',
    base: 'RT-SCIE, arts. 168.º a 171.º' + (t === 8 ? '; arts. 274.º' : '') + (t === 6 ? '; art. 251.º' : ''),
    estado: seg ? 'aplica' : 'nao', motivo: seg ? undefined : 'Exigida às UT I e II da 2.ª categoria e a todas as UT da 3.ª categoria ou superior.',
  });
  if (t === 12 && (ut.liquidosInflamaveisL ?? 0) > 0) {
    const L = ut.liquidosInflamaveisL!;
    const ef307 = L < 50 ? '113 B/C' : L <= 100 ? '144 B/C' : L <= 200 ? '233 B/C' : L <= 750 ? '233 B/C + extintor móvel de 50 kg de pó BC/ABC' : `233 B/C + ${Math.ceil(L / 1000)} extintor(es) móvel(eis) de 50 kg (1 por 1 000 l ou fração)`;
    add({ tema: 'VII.5', titulo: 'Extintores para líquidos combustíveis (UT XII)', exigencia: `${fmt(L)} l de líquidos combustíveis: eficácia mínima ${ef307} (escalão inferior se > 50 % em recipientes metálicos estanques).`, base: 'RT-SCIE, art. 307.º', estado: 'aplica' });
  }
  if (t === 2 && (ut.arLivre || ut.parqueAutomatico)) {
    add({ tema: 'VII.5', titulo: 'Meios de 1.ª intervenção específicos (UT II)', exigencia: ut.arLivre ? 'Um extintor portátil 21 A/113 B/C e um móvel de CO₂ ou pó ABC no posto de controlo.' : 'Extintores móveis de CO₂ ou pó ABC em cada piso junto ao acesso a cada escada; sprinklers em todos os pisos.', base: 'RT-SCIE, art. 226.º', estado: 'aplica' });
  }

  /* ------------------ Sistemas fixos de extinção ----------------------- */
  const sprCond = (t === 2 && cat >= 3 && abaixo) || ([3, 6, 7, 8, 12].includes(t) && cat >= 3 && !ut.arLivre) || (t === 2 && ut.parqueAutomatico) || ut.factos?.patio20 === true;
  const q37 = t === 2 ? QUADRO_XXXVII.II : t === 12 ? QUADRO_XXXVII.XII : QUADRO_XXXVII['III, VI, VII, VIII'];
  add({
    tema: 'VII.6', titulo: 'Sistema de extinção automática por água (sprinklers)',
    exigencia: `Sistema húmido${ut.espacoCenicoIsolavel ? ' (dilúvio nas caixas de palco > 50 m², 30 min)' : ''}: densidade ${q37.densidade} L/min/m², área de operação ${q37.area} m², ${q37.n} aspersores em simultâneo, calibre ${q37.calibre} mm, ${q37.tempo} min; aspersores calibrados, usualmente a 68 °C; depósito privativo e central de bombagem; postos de comando acessíveis aos bombeiros e sinalizados; alarme associado ao da deteção automática.`,
    base: 'RT-SCIE, arts. 173.º e 174.º, quadro XXXVII' + (t === 8 ? ' (ver exceções do capítulo VI do título VIII)' : ''),
    estado: sprCond ? 'aplica' : 'nao',
    motivo: sprCond ? undefined : 'Não exigido pelo art. 173.º n.º 1 b) e c) para esta UT/categoria. Exigível ainda em locais adjacentes a pátios interiores com altura > 20 m e em locais de difícil acesso com elevada carga de incêndio (n.º 1 e) e f)); pode ser medida compensatória (n.º 2) ou duplicar áreas de compartimentação (art. 18.º n.º 6).',
  });
  if (ut.temCozinhaC || ut.factos?.cozinha) add({ tema: 'VII.6', titulo: 'Extinção automática em blocos de confeção', exigencia: 'Sistemas fixos de extinção por agente diferente da água nos blocos de confeção cuja potência total instalada seja superior a 250 kW (elétricos) ou a 70 kW (a gás).', base: 'RT-SCIE, art. 175.º n.º 2', ...porFacto(ut, 'confecaoPotente', 'Potência dos aparelhos de confeção não excede 250 kW (elétricos) nem 70 kW (gás).') });
  if (t === 12 && (ut.pinturaArea ?? 0) > 30) add({ tema: 'VII.6', titulo: 'Extinção automática em zonas de pintura', exigencia: 'Zonas de pintura ou aplicação de vernizes, colas ou solventes com ponto de inflamação < 55 °C com área > 30 m²: instalação fixa de extinção automática por água.', base: 'RT-SCIE, art. 308.º n.º 1', estado: 'aplica' });
  if (t === 12 && (ut.liquidosInflamaveisL ?? 0) > 750) add({ tema: 'VII.6', titulo: 'Extinção automática por agente diferente da água', exigencia: 'Armazenagem > 750 l (ou manuseamento > 50 l) de produtos combustíveis: instalação fixa por agente apropriado diferente da água.', base: 'RT-SCIE, art. 308.º n.º 2', estado: 'aplica' });
  if (ut.patrimonio && (t === 10 || t === 11)) add({ tema: 'VII.6', titulo: 'Proteção de bens patrimoniais', exigencia: 'Sistemas automáticos de extinção com agentes adequados à preservação nos locais de arquivo, conservação e restauro e nas casas-fortes.', base: t === 10 ? 'RT-SCIE, art. 294.º' : 'RT-SCIE, art. 298.º', estado: 'aplica' });
  add({ tema: 'VII.10', titulo: 'Drenagem de águas residuais da extinção', exigencia: 'Pisos enterrados: caleiras e ralos ligados aos coletores, para o caudal das redes automáticas e cortinas de água mais 500 l/min' + (t === 2 ? ', com 1 ralo por 40 veículos em cada piso' : '') + ' (art. 186.º); rampas e escadas sobrelevadas com declive ≥ 2 % nas transições (art. 187.º); fossas de retenção de líquidos inflamáveis ligadas ao coletor, com capacidade para esse caudal durante 1 h' + (t === 2 ? ' e ≥ 0,5 m³ por 1000 m² do maior compartimento' : '') + ' (art. 188.º), limpas com a frequência necessária (art. 189.º)' + (t === 2 ? ' (ver também art. 227.º)' : t === 12 ? ' (ver também art. 309.º)' : '') + '.', base: 'RT-SCIE, arts. 186.º a 189.º', estado: sim(abaixo), motivo: abaixo ? undefined : 'Exigida apenas em pisos enterrados (art. 186.º n.º 1).' });

  /* --------------------------- Posto de segurança ---------------------- */
  const psCond = (t === 1 && cat >= 3) || (t >= 2 && cat >= 2) || (cat === 1 && temD) || (t === 9 && ut.designacao.toLowerCase().includes('campismo'));
  add({
    tema: 'VII.11', titulo: 'Posto de segurança',
    exigencia: 'Centraliza a informação de segurança, a receção e difusão de alarmes, a transmissão do alerta e a coordenação em emergência; pode ser na receção ou portaria junto a um acesso principal, com ingresso reservado e protegido do fogo; um único posto admitido para várias UT do edifício, individualizando a supervisão de cada uma; chaveiro de segurança com chaves de reserva (exceto do interior dos fogos) e exemplares do plano de prevenção e do PEI; comunicação oral, por meios distintos da rede pública, com as portarias de outros edifícios que sirva.'
      + (cat === 4 || (cat === 3 && temDE) ? ` 4.ª categoria ou 3.ª com locais D e E: comunicação oral, por meios distintos da rede pública, com todos os pisos, zonas de refúgio, casas de máquinas, fontes centrais, central de bombagem, ascensores e locais D e E${t === 1 || ut.arLivre || ut.factos?.tendas ? '' : '; constitui local de risco F'}.` : ''),
    base: 'RT-SCIE, art. 190.º' + (t === 6 ? '; art. 254.º' : t === 8 ? '; art. 277.º' : t === 9 ? '; art. 287.º' : ''),
    estado: sim(psCond), motivo: psCond ? undefined : 'Exigido à UT I das 3.ª/4.ª categorias, às UT II a XII da 2.ª categoria ou superior e às UT da 1.ª categoria com locais D.',
  });

  /* ------------------------------ Autoproteção ------------------------- */
  const map = quadroXXXIX(t, cat, temDE);
  add({
    tema: 'MAP', titulo: 'Medidas de autoproteção exigíveis',
    exigencia: map ? map.map((m) => `${MAP_INFO[m].nome} (art. ${MAP_INFO[m].art})`).join('; ') + '.' : 'Não exigíveis.',
    base: 'RT-SCIE, art. 198.º, quadro XXXIX; RJ-SCIE, arts. 21.º e 22.º', estado: map ? 'aplica' : 'nao',
    motivo: map ? undefined : 'UT I das 1.ª e 2.ª categorias excluídas (RJ-SCIE, art. 22.º n.º 1).',
  });
  if (map) {
    add({ tema: 'MAP', titulo: 'Responsável e delegado de segurança', exigencia: `RS: ${t === 1 ? 'administração do condomínio (espaços comuns)' : 'proprietário ou entidade exploradora'}; o RS designa um delegado de segurança para executar as medidas de autoproteção.`, base: 'RT-SCIE, art. 194.º, quadro XXXVIII; RJ-SCIE, arts. 6.º e 20.º', estado: 'aplica' });
    add({ tema: 'MAP', titulo: 'Entrega das medidas de autoproteção', exigencia: `Submeter a parecer da ${cat === 1 ? 'câmara municipal' : 'ANEPC'} até 30 dias antes da entrada em funcionamento (construção nova, alteração, ampliação ou mudança de uso); atualizar sempre que mude a categoria de risco ou a UT.`, base: 'RJ-SCIE, art. 21.º n.os 2 e 3 e art. 22.º n.º 2', estado: 'aplica' });
    add({ tema: 'MAP', titulo: 'Registos de segurança', exigencia: 'Relatórios de vistoria e inspeção, anomalias, manutenções, modificações e trabalhos perigosos, ocorrências, relatórios dos bombeiros, formação e simulacros; arquivo ≥ 10 anos.', base: 'RT-SCIE, art. 201.º', estado: 'aplica' });
  }
  if (map?.includes('pei')) {
    add({ tema: 'MAP', titulo: 'Serviço de segurança contra incêndio (SSI)', exigencia: 'Delegado de segurança como chefe de equipa e elementos em número adequado à dimensão da UT e à categoria de risco; dimensionamento fundamentado e aceite pela ANEPC.', base: 'RT-SCIE, art. 200.º n.os 3, 4 e 6', estado: 'aplica' });
    add({ tema: 'MAP', titulo: 'Plantas de emergência', exigencia: 'Para cada piso, segundo a NP 4386, afixadas junto aos acessos principais, nos locais D e E e nas zonas de refúgio.', base: 'RT-SCIE, art. 205.º n.º 6', estado: 'aplica' });
  }
  const sim41 = quadroXLI(t, cat, temDE);
  add({
    tema: 'MAP', titulo: 'Periodicidade dos simulacros',
    exigencia: sim41 ? `Período máximo entre simulacros: ${sim41}.${t === 4 ? ' Na UT IV, no início do ano escolar.' : ''}` : 'Não exigidos.',
    base: 'RT-SCIE, art. 207.º, quadro XLI', estado: map?.includes('simulacros') && sim41 ? 'aplica' : 'nao',
    motivo: map?.includes('simulacros') && sim41 ? undefined : 'Sem plano de emergência interno exigível nesta categoria (quadro XXXIX).',
  });
  add({
    tema: 'MAP', titulo: 'Instruções de segurança',
    exigencia: `Instruções afixadas para os ocupantes dos locais de risco C, D, E e F (com planta simplificada nos locais D e E)${map && !map.includes('pei') && !map.includes('procEmergencia') ? '; instruções simplificadas de alarme, alerta e uso de meios de 1.ª intervenção' : ''}.`,
    base: 'RT-SCIE, art. 199.º', estado: sim(temC || temDE || temF || (!!map && !map.includes('pei') && !map.includes('procEmergencia'))),
    motivo: temC || temDE || temF ? undefined : 'Sem locais C, D, E ou F.',
  });
  add({
    tema: 'MAP', titulo: 'Formação em SCIE',
    exigencia: 'Sensibilização de todos os funcionários e colaboradores no prazo de 60 dias após a entrada ao serviço; formação específica para quem trabalha em locais C, D ou F e para os elementos com atribuições em emergência.' + (t === 1 ? ' Ocupantes dos fogos da UT I das 3.ª/4.ª categorias.' : t === 4 ? ' Alunos que permaneçam mais de 30 dias, no primeiro período do ano escolar.' : t === 9 ? ' Frequentadores que permaneçam mais de 30 dias.' : ''),
    base: 'RT-SCIE, art. 206.º', estado: sim(!!map?.includes('formacao')),
    motivo: map?.includes('formacao') ? undefined : 'Não exigida pelo quadro XXXIX para esta UT e categoria (art. 198.º).',
  });

  /* ------------- Complementos do anexo IV (III.1, V, VI e VII) ------------- */
  const esc = (a: number, b: number) => (cat <= 2 ? a : b);
  add({
    tema: 'III.1', titulo: 'Elementos incorporados em instalações',
    exigencia: `Cablagens elétricas, de fibra ótica e de energia ou sinal que sirvam os sistemas de segurança ou sejam indispensáveis aos locais de risco F: embebidas, em ducto próprio ou com classe P/PH. Escalões mínimos (quadro XXXIV): alarme, deteção e retenção de portas ${esc(15, 30)} min; iluminação de emergência e comandos de extinção ${esc(30, 60)} min; controlo de fumo, pressurização de água, ascensores de bombeiros e comunicações ${esc(60, 90)} min${temF ? '; locais de risco F 90 min' : ''}.`,
    base: 'RT-SCIE, art. 16.º; art. 77.º n.º 3, quadro XXXIV', estado: 'aplica',
  });
  {
    const amplos = t === 2 || ([3, 6, 7, 8, 9, 10, 11, 12].includes(t) && ut.espacos.some((e) => (e.area ?? 0) > 800));
    add({
      tema: 'V.1b', titulo: 'Evacuação dos locais',
      exigencia: 'Mobiliário, equipamentos e decoração dispostos de modo a que os percursos até às saídas sejam claros (art. 58.º).'
        + (locais.has('B') || temE ? ' Locais B e E: mobiliário junto aos percursos fixado ao pavimento ou às paredes se puder ser arrastado ou derrubado (art. 59.º n.º 2).' : '')
        + (amplos ? ` Espaços amplos${t === 2 ? '' : ' com mais de 800 m²'}: caminhos de evacuação claramente evidenciados, com largura em UP adequada ao efetivo${t === 9 ? ' (exceto espaços só de prática desportiva)' : ''} (art. 59.º n.º 3).` : '')
        + (locais.has('B') ? ' Locais B fechados com zona de mesas > 50 m²: mesas fixas com circulações ≥ 1,5 m; mesas soltas com soma das áreas ≤ 25 % da zona; percursos de eventos em sentido único sempre que possível (art. 59.º n.os 4 a 6).' : '')
        + (temD ? ' Locais D: saídas, diretamente ou através de outro local D, para vias protegidas ou para o exterior (art. 60.º n.º 2).' : ''),
      base: 'RT-SCIE, arts. 58.º a 60.º', estado: 'aplica',
    });
  }
  add({
    tema: 'V.1b', titulo: 'Características das portas',
    exigencia: `Portas usadas por mais de 50 pessoas: ${t === 1 ? '' : 'abrir no sentido da evacuação, '}sem trancamento durante o funcionamento e com sinalização do modo de operar (exceções: vigilância permanente com abertura imediata${[6, 7, 8, 9, 10, 11].includes(t) ? ', ou comando automático e manual sinalizado nesta UT' : ''}); saídas diretas para o exterior com percurso livre da largura da saída e sem obstáculos até 3 m. Barras antipânico sinalizadas na saída de locais, UT ou edifícios usados por mais de 200 pessoas e nos acessos a vias verticais usados por mais de 50 (salvo vãos mantidos abertos sem fecho automático ou portas sem trinco). Portas que abram para vias de evacuação recolhidas (ou a reduzir ≤ 10 % da largura). Vaivém de duas folhas com visores, batentes protegidos e sinalização da folha da direita.${temD ? ' Vias de evacuação de pessoas em camas: portas com superfícies transparentes à altura da visão.' : ''}${temCag ? ' Locais C agravado: portas a abrir no sentido da saída.' : ''}`,
    base: 'RT-SCIE, art. 62.º', estado: 'aplica',
  });
  add({
    tema: 'V.1b', titulo: 'Distribuição e localização das saídas',
    exigencia: 'Saídas distintas, afastadas entre si e distribuídas pelo perímetro dos locais, repartindo o efetivo na proporção das capacidades e minimizando impasses; em espaços com pavimento inclinado e mais de 12 filas, pelo menos metade da capacidade de evacuação abaixo do nível médio do pavimento. Portas giratórias, de correr não motorizadas e motorizadas sem abertura em caso de falha não contam como saídas.',
    base: 'RT-SCIE, arts. 54.º n.º 3 e 55.º', estado: 'aplica',
  });
  add({
    tema: 'V.3', titulo: 'Guardas das vias elevadas e terraços',
    exigencia: 'Altura mínima das guardas: 1,0 m para diferenças de cota até 6 m; 1,2 m acima de 6 m (quadro XXXIII); contínuas nas escadas, pelo menos entre espelhos e cobertores; prumos com afastamento ≤ 0,12 m.',
    base: 'RT-SCIE, art. 67.º, quadro XXXIII', ...porFacto(ut, 'guardas', 'Não existem vias elevadas nem terraços acessíveis.'),
  });
  const refugio = H > 50 || ((cat === 4 || (t === 3 && cat === 3)) && Math.max(ut.altura || 0) > 28);
  add({
    tema: 'V.4', titulo: 'Zonas de refúgio',
    exigencia: `No piso imediatamente abaixo de 28 m e de 10 em 10 pisos acima; paredes com a resistência das vias horizontais protegidas (art. 25.º); comunicação por câmara corta-fogo com uma via vertical protegida e com o elevador prioritário de bombeiros, ambos até saída direta ao exterior; meios de 1.ª e 2.ª intervenção; comunicação de emergência com o posto de segurança e com a rede telefónica pública. Área ≥ 0,2 m² por pessoa servida${ef.total ? ` (efetivo da UT ${ef.total} → ${fmt(Math.ceil(ef.total * 0.2 * 10) / 10)} m², repartidos pelas zonas)` : ''}. Admitidas ao ar livre a > 8 m de vãos (ou vãos E 30 até 4 m). Alternativa: em cada piso, dois compartimentos ligados por câmara corta-fogo com os mesmos meios.`,
    base: 'RT-SCIE, art. 68.º', estado: refugio ? 'aplica' : 'nao',
    motivo: refugio ? undefined : 'Exigidas em edifícios de muito grande altura e em UT da 4.ª categoria (ou UT III da 3.ª) que ocupem pisos acima de 28 m.',
  });

  // VI — Instalações técnicas
  add({
    tema: 'VI.1', titulo: 'a) Fontes centrais de energia de emergência',
    exigencia: `Grupo gerador ou baterias com arranque automático em ≤ 15 s; autonomia ≥ à maior resistência ao fogo exigida aos elementos de construção, com o mínimo de 1 hora. Grupos geradores só alimentam as instalações de segurança do art. 72.º n.º 4 (iluminação de emergência e sinalização, controlo de fumo, retenção de portas, obturação de vãos e condutas, pressurização de água, ascensores de bombeiros, bloqueadores de escadas mecânicas, ventilação de locais elétricos, SADI e deteção de gás, comunicações, comandos de extinção, cortinas, insufláveis, bombagem de drenagem); baterias alimentam obrigatoriamente SADI e comandos de extinção. Outros equipamentos só com mais de uma fonte central nas condições do n.º 6. Equipamentos alimentados com IP X5 (exceto em compartimentos técnicos corta-fogo).${catEd > cat ? ` Exigida porque o edifício tem UT da ${catEd}.ª categoria.` : ''}`,
    base: 'RT-SCIE, art. 72.º', ...(catEd >= 3 ? { estado: 'aplica' as Estado } : porFacto(ut, 'fonteCentral', 'Todas as instalações de segurança são apoiadas por fontes locais (art. 72.º n.º 2).')),
  });
  add({
    tema: 'VI.1', titulo: 'b) Fontes locais de energia de emergência',
    exigencia: 'Baterias estanques (níquel-cádmio ou equivalente) com carga e regulação automáticas; recarga em ≤ 30 h; autonomia adequada à instalação apoiada.',
    base: 'RT-SCIE, art. 73.º', estado: 'aplica',
  });
  add({
    tema: 'VI.1', titulo: 'c) Locais de serviços elétricos, grupos geradores e UPS',
    exigencia: 'Transformadores, grupos geradores, baterias > 1000 VAh e UPS > 40 kVA em locais com a resistência e a reação ao fogo de locais C (arts. 21.º n.º 1 e 41.º), ou ao ar livre com barreiras físicas; acesso reservado a pessoal especializado e sinalizado (art. 70.º). Evacuação direta do ar para o exterior nos postos de transformação de edifícios com UT da 4.ª categoria e nos locais de baterias; ventilação mecânica apoiada por fontes de emergência e com corte da carga das baterias se parar (art. 71.º). Grupos geradores: não abaixo do piso imediatamente inferior ao plano de referência nem acima de 28 m; escape por condutas A1; combustível com PI < 55 °C ≤ 15 l (gravidade) ou ≤ 50 l (bombagem, sem enchimento automático); PI ≥ 55 °C em reservatórios fixos ≤ 500 l; depósitos ao ar livre a > 5 m de edifícios e > 10 m de tendas; bacia de retenção (art. 74.º). UPS: sinalização nos acessos e botoneira de corte de emergência nos acessos ou no acesso principal da UT, e no posto de segurança (art. 75.º).',
    base: 'RT-SCIE, arts. 70.º, 71.º, 74.º e 75.º', ...porFacto(ut, 'servEletricos', 'Não existem transformadores, grupos geradores, baterias > 1000 VAh nem UPS > 40 kVA.'),
  });
  add({
    tema: 'VI.1', titulo: 'd) Quadros elétricos e cortes de emergência',
    exigencia: `Quadros à vista ou em armários exclusivos, acessíveis e sinalizados; em locais B, D, E, F e vias de evacuação: invólucros metálicos (45–115 kVA, salvo ensaio do fio incandescente 750 °C/5 s) ou embebidos com portas E 30 (> 115 kVA) (art. 76.º).${t >= 2 && cat >= 3 ? ' Botoneiras de corte geral da energia da rede e das fontes centrais de emergência no posto de segurança (art. 76.º n.º 4).' : ''} Circuitos das instalações de segurança e de locais F independentes e protegidos; bombas e ventiladores de fumo protegidos só contra curto-circuitos; integridade dos circuitos em caso de incêndio (quadro XXXIV): ${cat <= 2 ? 'retenção de portas, obturação, bloqueadores, SADI e deteção de gás, cortinas 15 min; iluminação de emergência e comandos de extinção 30 min; controlo de fumo, pressurização de água, ascensores de bombeiros, ventilação elétrica, comunicações, insufláveis e drenagem 60 min' : 'retenção de portas, obturação, bloqueadores, SADI e deteção de gás, cortinas 30 min; iluminação de emergência e comandos de extinção 60 min; controlo de fumo, pressurização de água, ascensores de bombeiros, ventilação elétrica, comunicações, insufláveis e drenagem 90 min'}${temF ? '; locais de risco F 90 min' : ''} (dispensado se apoiados por fontes locais com igual autonomia, mínimo 1 h) (art. 77.º). Gestão técnica centralizada sem interferir com a segurança (art. 78.º).${locais.has('B') || temD || temF ? ' Locais B, D e F: um defeito de isolamento num circuito não pode privar o local de iluminação (art. 79.º).' : ''}`,
    base: 'RT-SCIE, arts. 76.º a 79.º, quadro XXXIV', estado: 'aplica',
  });
  add({
    tema: 'VI.2', titulo: 'a) Centrais térmicas',
    exigencia: 'Aparelhos a fluidos combustíveis com potência útil total > 40 kW (exceto os de uma única habitação) em central térmica: reação ao fogo de local C (quadro XXV); isolamento do quadro XIV (≤ 70 kW) ou XV (70 a 2000 kW); > 2000 kW interdito no interior de edifícios (exceto UT XII exclusiva, com quadro XV); acesso reservado e sinalizado (art. 80.º). Aparelhos sobre maciços A1 com ≥ 0,1 m e corredores de manobra (art. 81.º); ventilação permanente (art. 82.º); cortes manuais de energia e combustível no exterior, junto aos acessos, e no posto de segurança (art. 83.º); só canalizações e condutas que a sirvam em exclusivo, em ductos nos espaços contíguos (art. 84.º); sem líquidos com PI < 55 °C nem armazenamento de inflamáveis (art. 107.º n.º 6).',
    base: 'RT-SCIE, arts. 80.º a 84.º e 107.º n.º 6', ...porFacto(ut, 'centralTermica', 'Sem aparelhos a fluidos combustíveis com potência útil total > 40 kW.'),
  });
  add({
    tema: 'VI.2', titulo: 'b) Aparelhagem de aquecimento',
    exigencia: 'Aparelhos autónomos só em habitações, locais A e locais B com efetivo < 500; nos restantes locais e nas vias de evacuação, só elétricos sem resistências expostas ao ar e ≤ 25 kW; fixos às paredes ou pavimentos em locais B e vias (art. 85.º). De combustão: elementos incandescentes protegidos; corte automático do combustível se a chama se extinguir; a gás em locais A e B só tipo C (NP 4415), tubos radiantes ≤ 400 W/m² com válvula de corte e afastamentos de 1,25 m abaixo, 0,5 m acima do queimador, 0,15 m acima do refletor e 0,6 m lateral, ou painéis radiantes ≤ 400 W/m² com pé-direito > 7 m e 1 m a revestimentos; fixação A1; faixa A1fl de 0,3 m em volta; queimadores a ≥ 0,5 m de materiais inflamáveis (0,25 m com isolante A1); ventilação se não estanques; em tendas e insufláveis só sem combustão, com geradores no exterior a ≥ 5 m (ou painel A1 se < 70 kW) e condutas A1 com obturador EI 30 (art. 86.º). Combustíveis sólidos só em habitações (exceto quartos), locais A e B ≤ 200 pessoas, a ≥ 1 m de combustíveis (0,5 m com isolante A1), com proteção contra projeções, ventilação e medidas de autoproteção (art. 87.º).',
    base: 'RT-SCIE, arts. 85.º a 87.º', ...porFacto(ut, 'aquecimento', 'Não existem aparelhos de aquecimento autónomos.'),
  });
  add({
    tema: 'VI.3', titulo: 'Cozinhas e instalações de frio',
    exigencia: 'Aparelhos de confeção > 20 kW (exceto em fogos) em cozinha isolada como local C (art. 21.º n.os 1 e 2); em espaços acessíveis a utentes, como bares, aparelhos fixos (exceto < 4 kW); interditos em estruturas insufláveis; em tendas agrupados como cozinha (art. 88.º n.os 1 a 5). Cozinhas ≤ 20 kW: gás ou eletricidade, a ≥ 2 m de espaços com público, bloco com painéis A1, canalizações de gás fixas e visíveis (flexíveis ≤ 1,5 m só para uma garrafa a um aparelho), cortes manuais acessíveis e sinalizados (art. 88.º n.º 6). Admissão de ar e extração de fumos e vapores (arts. 92.º e 93.º) com apanha-fumos A1 e filtro de gorduras (art. 89.º). Cozinhas > 20 kW: cortes manuais de combustível/energia e comando do controlo de fumo junto ao acesso principal (art. 90.º). Instalações de frio > 70 kW em compartimento isolado (quadro XIV) (art. 91.º).',
    base: 'RT-SCIE, arts. 88.º a 91.º', ...(ut.temCozinhaC ? { estado: 'aplica' as Estado } : porFacto(ut, 'cozinha', 'Não existem cozinhas, locais de confeção nem instalações de frio.')),
  });
  add({
    tema: 'VI.4', titulo: 'Condutas e aberturas de efluentes de combustão',
    exigencia: 'Condutas A1, de reduzida permeabilidade, nas condições do art. 31.º; em sobrepressão, em ducto ventilado (interiores) ou com as distâncias dos arts. 7.º e 10.º (exteriores); sem percursos em locais B, D, E, F ou de armazenamento de combustíveis; combustíveis sólidos com conduta independente; fogo aberto com conduta individual; condutas coletivas só para locais A ou habitações, a servir ≤ 5 locais (≤ 7 com aparelhos a gás tipo B), ramais ≤ 1 piso e secção retangular com lado menor ≥ metade do maior (art. 92.º). Aberturas ≥ 0,5 m acima da cobertura, afastadas na horizontal de obstáculos mais altos pelo menos a diferença de alturas (máximo 10 m), acessíveis para limpeza (art. 93.º).',
    base: 'RT-SCIE, arts. 92.º e 93.º', ...porFacto(ut, 'combustao', 'Não existem aparelhos de combustão com condutas de efluentes.'),
  });
  add({
    tema: 'VI.5', titulo: 'Ventilação e condicionamento de ar',
    exigencia: 'Unidades de cobertura com combustão > 200 kW em central térmica (art. 94.º). Dispositivo central que pare ventiladores e aquecimento com ar na conduta > 120 °C, na origem das condutas principais e duplicado por comando manual sinalizado (dispensado com permutadores a ≤ 110 °C) (art. 95.º). Baterias de resistências alhetadas em invólucro A1, com corta-circuito térmico a ≤ 0,15 m a jusante e sem alimentação com ventiladores parados (art. 96.º). Condutas e materiais interiores A1, isolamento exterior BL-s2, d0; motores fora dos circuitos de ar (ou com corte térmico); condutas de locais B, D, E ou F não servem locais C (art. 97.º). Centrais > 10 000 m³/h: caixas de filtros A1 a 0,2 m de combustíveis, filtros D-s1, d2, detetores de fumo a jusante com corte, controlo da colmatação e sinal «Perigo de incêndio — Filtro com poeiras inflamáveis» (art. 98.º). Bocas acessíveis ao público com grelha ≤ 10 mm (art. 99.º).',
    base: 'RT-SCIE, arts. 94.º a 99.º', ...porFacto(ut, 'avac', 'Não existem instalações de ventilação nem de climatização.'),
  });
  add({
    tema: 'VI.6', titulo: 'a) Ascensores — condições gerais',
    exigencia: 'Casas de máquinas de elevadores com carga > 100 kg isoladas com EI 60 / REI 60 e portas E 30 C, reservadas a pessoal especializado (art. 101.º); sinal «Não utilizar o ascensor em caso de incêndio» junto aos acessos (art. 102.º); dispositivo de chamada em caso de incêndio por chave no piso do plano de referência (caixa protegida e sinalizada «Chave de manobra de emergência do elevador», cópia no posto de segurança) e automaticamente pelo SADI: cabinas ao plano de referência com portas abertas, anulação das chamadas e neutralização dos botões (art. 103.º).',
    base: 'RT-SCIE, arts. 101.º a 103.º', ...porFacto(ut, 'elevadores', 'Não existem ascensores.'),
  });
  const bomb = H > 28 || Math.max(pisosAbaixoUT(ut), ed.pisosAbaixo ?? 0) > 2;
  add({
    tema: 'VI.6', titulo: 'b) Ascensor para uso dos bombeiros',
    exigencia: 'Pelo menos um ascensor prioritário de bombeiros que sirva todos os pisos, cada compartimento corta-fogo e as zonas de refúgio; interruptor de chave própria no piso de referência para serviço exclusivo dos bombeiros; carga ≥ 630 kg e cabina ≥ 1,1 × 1,4 m (≥ 1000 kg, 1,1 × 2,1 m e portas de 1,1 m para macas ou camas, ou acesso duplo); portas automáticas deslizantes ≥ 0,8 m; alçapão no teto ≥ 0,5 × 0,7 m (0,4 × 0,5 m nos de 630 kg) com meios de abertura pelo interior e escada de autossocorro; percurso ≤ 60 s; intercomunicação com o piso de referência e o posto de segurança; fontes de emergência; caixa independente (art. 28.º); equipamento elétrico IP X3 junto às portas e IP 67 no fundo do poço; drenagem do poço; sinal «Ascensor prioritário de bombeiros» (art. 104.º). Detetores de temperatura (70 °C) por cima das portas de patamar (salvo acesso por câmara corta-fogo) e de fumo na casa das máquinas ou no topo da caixa, integrados no SADI (art. 105.º).',
    base: 'RT-SCIE, arts. 104.º e 105.º', estado: bomb ? 'aplica' : 'nao',
    motivo: bomb ? undefined : 'Exigido em edifícios com altura > 28 m ou mais de dois pisos abaixo do plano de referência.',
  });
  const liq = (ut.liquidosInflamaveisL ?? 0) > 0 || ut.temGas;
  add({
    tema: 'VI.7', titulo: 'Líquidos e gases combustíveis',
    exigencia: 'Classificação dos espaços pelo quadro XXXV: armazenamento quando líquidos com PI < 21 °C > 20 l, 21–55 °C > 100 l ou ≥ 55 °C > 500 l, ou gases > 106 dm³, que são espaços da UT XII (capítulo X do título VIII). Interditos em vias de evacuação e em locais E e F; em locais D só líquidos inflamáveis para um dia de atividade. Gases no interior só em garrafas ou cartuchos: GPL até quatro garrafas (≤ 106 dm³) por habitação ou por compartimento corta-fogo nas UT III a XII; outros gases até duas garrafas (≤ 106 dm³) nas UT III a XI. Sinalização de perigo e de proibição de fumar em espaços com gases ou com líquidos > 10 l (PI < 21 °C), > 50 l (21–55 °C) ou > 250 l (≥ 55 °C), com ventilação natural permanente ≥ 1 % da área (mínimo 0,1 m²) nas UT III a XI. Proibidos reservatórios debaixo de edifícios, salvo gasóleo < 500 l para grupos geradores (art. 106.º). Canalizações nas condições do regulamento; uma só família de gás por UT; locais com reservatórios de líquidos ou equipamentos a gás > 40 kW são locais C; válvula de corte de emergência sinalizada, acessível e no exterior do compartimento (art. 107.º).',
    base: 'RT-SCIE, arts. 106.º e 107.º, quadro XXXV', ...(liq ? { estado: 'aplica' as Estado } : porFacto(ut, 'liquidosGases', 'Não existem líquidos nem gases combustíveis.')),
  });

  // VII — sistemas não cobertos acima
  add({
    tema: 'VII.7', titulo: 'Sistemas de cortina de água',
    exigencia: 'Obrigatórios em fachadas-cortina envidraçadas nas condições do art. 8.º n.º 5 e nas situações específicas das UT II, VI e VIII; complementam e não substituem elementos resistentes ao fogo nem barreiras ao fumo; noutros casos, com fundamentação ou como medida compensatória (art. 177.º e 178.º). Caudal ≥ 10 l/min por m² de vão; comando automático e manual a partir do posto de segurança; alimentação pelo depósito privativo, se existir (art. 179.º).',
    base: 'RT-SCIE, arts. 177.º a 179.º', estado: sim([2, 6, 8].includes(t)),
    motivo: [2, 6, 8].includes(t) ? 'Nas situações das condições específicas da UT (título VIII).' : 'Exigidos apenas nas situações específicas das UT II, VI e VIII (art. 178.º n.º 1); noutros casos são opção ou medida compensatória.',
  });
  const polu = t === 2 && !ut.arLivre;
  add({
    tema: 'VII.8', titulo: 'Controlo de poluição de ar',
    exigencia: `CO ≤ 50 ppm em média de 8 h e ≤ 200 ppm instantâneos; alarme ótico e acústico «Atmosfera Saturada-CO» a 200 ppm, por cima das portas de acesso; deteção automática de CO a 1,5 m do pavimento (< 400 m² por detetor) com fonte local ≥ 60 min (art. 180.º).${t === 2 ? ' Ventilação passiva admitida em pisos acima do plano de referência ou no imediatamente abaixo, nas condições dos arts. 153.º n.º 8 e 160.º n.º 6 (art. 182.º); ativa com extração ≥ 300 m³/h por veículo (50 ppm) ou 600 m³/h (100 ppm)' : ' Ventilação ativa nas condições específicas da UT VIII'}, comandada pela central de CO e manualmente no posto de segurança${t === 2 ? ' e junto à entrada de veículos' : ''}; câmaras corta-fogo de acesso com 5 renovações por hora (art. 183.º).`,
    base: 'RT-SCIE, arts. 180.º a 183.º', ...(polu ? { estado: 'aplica' as Estado } : t === 8 ? porFacto(ut, 'polucaoVIII', 'Sem espaços de pesados de passageiros nem plataformas com locomotivas a gasóleo.') : { estado: 'nao' as Estado, motivo: 'Exigido em espaços cobertos fechados da UT II e em certos espaços da UT VIII (art. 181.º).' }),
  });
  add({
    tema: 'VII.12', titulo: 'Instalação de para-raios',
    exigencia: 'Edifícios em relação aos quais as descargas atmosféricas constituem um risco significativo de incêndio: instalação de para-raios, de acordo com os critérios técnicos aplicáveis.',
    base: 'RT-SCIE, art. 191.º', ...(ut.arLivre ? { estado: 'nao' as Estado, motivo: 'Recinto ao ar livre.' } : porFacto(ut, 'descargas', 'As descargas atmosféricas não constituem risco significativo de incêndio.')),
  });
  if (H > 28) add({
    tema: 'VII.12', titulo: 'Sinalização ótica para a aviação',
    exigencia: 'Edifício com altura > 28 m com posição dominante na volumetria urbana ou natural envolvente: instalação de sinalização ótica para a aviação.',
    base: 'RT-SCIE, art. 192.º', ...porFacto(ut, 'dominante', 'Sem posição dominante na envolvente.'),
  });

  /* --------------------------- Condições específicas ------------------ */
  if (t === 12) {
    add({ tema: 'II.3', titulo: 'Distâncias entre edifícios (UT XII)', exigencia: `Paredes exteriores EI/REI 60 e vãos E 30 / E 30 C quando confrontem com edifícios a menos de ${quadroXLIX(cat, H)} m; se a menos de metade: EI/REI 90 e vãos E 45 / E 45 C; +4 m para equipamentos ao ar livre.`, base: 'RT-SCIE, art. 300.º, quadro XLIX', estado: 'aplica' });
  }
  const esp = ESPECIFICAS[t] ?? [];
  if (esp.length) add({
    tema: 'ESP', titulo: `Condições específicas da UT ${R}`,
    exigencia: `Cumprimento das condições específicas da UT ${R} (título VIII do RT-SCIE), aplicáveis às situações existentes: ${esp.map((a) => `art. ${a.art} — ${a.titulo}`).join('; ')}.`,
    base: `RT-SCIE, título VIII, arts. ${esp[0].art} a ${esp[esp.length - 1].art}`, estado: 'aplica',
  });

  return M;
}

export function resumoMedidas(m: Medida[]) {
  return {
    aplica: m.filter((x) => x.estado === 'aplica').length,
    verificar: m.filter((x) => x.estado === 'verificar').length,
    nao: m.filter((x) => x.estado === 'nao').length,
  };
}
