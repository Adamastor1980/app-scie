import type { Cat, Edificio, UT } from '../data/types';
import { INSPECOES, ROMANO } from '../data/rjscie';
import {
  ENVOLVENTE_LOCAIS, ESPECIFICAS, MAP_INFO, QUADRO_XXV, QUADRO_XXXVI, QUADRO_XXXVII, classeAltura,
  quadroIX, quadroL, quadroLI, quadroX, quadroXI, quadroXII, quadroXIX, quadroXLI, quadroXLIX, quadroXXII,
  quadroXXIII, quadroXXIV, quadroXXXIX, saidasMinimas, upMinimas,
} from '../data/rtscie';
import { classificar, efetivoEspaco, efetivoUT, fmt, type Classificacao, type EfetivoUT } from './calc';

export type Estado = 'aplica' | 'verificar' | 'nao';

export interface Medida {
  id: string;
  tema: string;
  titulo: string;
  exigencia: string;
  base: string;
  estado: Estado;
  motivo?: string;
}

export const TEMAS = [
  'Enquadramento e procedimento',
  'Condições exteriores',
  'Resistência ao fogo e compartimentação',
  'Isolamento e proteção de locais de risco',
  'Isolamento e proteção das vias e circulações',
  'Reação ao fogo',
  'Evacuação',
  'Sinalização e iluminação de emergência',
  'Deteção, alarme e alerta',
  'Controlo de fumo',
  'Meios de intervenção',
  'Sistemas fixos de extinção e outros sistemas',
  'Posto de segurança',
  'Autoproteção',
  'Condições específicas da UT',
] as const;

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

export function gerarMedidas({ ed, ut, cls, ef }: Contexto): Medida[] {
  const M: Medida[] = [];
  const cat: Cat = cls.cat;
  const t = ut.tipo;
  const R = ROMANO[t];
  const H = ed.altura || ut.altura;
  const classe = classeAltura(H);
  const locais = new Set(ut.espacos.map((e) => e.local));
  const temD = locais.has('D');
  const temE = locais.has('E');
  const temDE = temD || temE;
  const temC = locais.has('C') || locais.has('Cag');
  const temCag = locais.has('Cag');
  const temF = locais.has('F');
  const abaixo = ut.pisosAbaixo > 0;
  const add = (m: Omit<Medida, 'id'>) => M.push({ id: `${M.length + 1}`.padStart(3, '0'), ...m });

  /* ------------------- Enquadramento e procedimento ------------------- */
  const T0 = TEMAS[0];
  add({
    tema: T0, titulo: 'Entidade competente',
    exigencia: cat === 1 ? 'Município da área do edifício ou recinto (1.ª categoria de risco).' : 'Autoridade Nacional de Emergência e Proteção Civil (ANEPC).',
    base: 'RJ-SCIE, art. 5.º n.º 1, art. 21.º n.º 2 e art. 24.º n.º 1', estado: 'aplica',
  });
  add({
    tema: T0, titulo: 'Peça de SCIE da operação urbanística',
    exigencia: cat === 1
      ? 'Ficha de segurança por utilização-tipo, segundo modelo da ANEPC, com o conteúdo do anexo V.' + (t === 4 || t === 5 ? ' Nas UT IV e V a ficha é complementada com as peças desenhadas do art. 2.º n.º 2 do anexo V.' : '')
      : 'Projeto da especialidade de SCIE com memória descritiva e justificativa e peças desenhadas, com o conteúdo do anexo IV.',
    base: cat === 1 ? 'RJ-SCIE, art. 17.º n.º 2 e anexo V' : 'RJ-SCIE, art. 17.º n.º 1 e anexo IV', estado: 'aplica',
  });
  add({
    tema: T0, titulo: 'Autor do projeto e das medidas de autoproteção',
    exigencia: 'Arquiteto (OA), engenheiro (OE) ou engenheiro técnico (OET) com certificação de especialização em SCIE, registado na ANEPC.',
    base: 'RJ-SCIE, art. 15.º-A', estado: sim(cat >= 2), motivo: cat === 1 ? 'Exigência aplicável às 2.ª, 3.ª e 4.ª categorias.' : undefined,
  });
  add({
    tema: T0, titulo: 'Inspeções regulares',
    exigencia: `Inspeção regular no prazo máximo de ${INSPECOES[cat]} anos, a pedido do responsável de segurança, pela ${cat === 1 ? 'câmara municipal' : 'ANEPC ou entidade por ela credenciada'}.`,
    base: 'RJ-SCIE, art. 19.º n.os 1, 2 e 4',
    estado: cat === 1 && t !== 4 && t !== 5 ? 'nao' : t === 1 && cat === 2 ? 'verificar' : 'aplica',
    motivo: cat === 1 && t !== 4 && t !== 5
      ? `Excetuadas as UT I, II, III, VI, VII, VIII, IX, X, XI e XII da 1.ª categoria (art. 19.º n.º 5).`
      : t === 1 && cat === 2 ? 'Excetuados os edifícios de utilização exclusiva da UT I da 2.ª categoria (art. 19.º n.º 5).' : undefined,
  });
  add({
    tema: T0, titulo: 'Vistoria com representante da ANEPC',
    exigencia: 'As vistorias para autorização de utilização integram um representante da ANEPC ou de entidade por ela credenciada.',
    base: 'RJ-SCIE, art. 18.º n.º 3', estado: sim(cat >= 2), motivo: cat === 1 ? 'Aplicável às 2.ª, 3.ª e 4.ª categorias.' : undefined,
  });
  add({
    tema: T0, titulo: 'Grau de prontidão do socorro',
    exigencia: 'O licenciamento e a localização de novos edifícios ou recintos depende do grau de prontidão do socorro do corpo de bombeiros local; na sua falta, agravamento fundamentado das medidas aprovado pela ANEPC.',
    base: 'RT-SCIE, art. 13.º', estado: sim(cat >= 3), motivo: cat < 3 ? 'Aplicável às 3.ª e 4.ª categorias.' : undefined,
  });

  /* ------------------------ Condições exteriores ----------------------- */
  const T1 = TEMAS[1];
  if (ut.arLivre) {
    const vias = cat === 1 ? 'Uma via com 3,5 m de largura útil' : cat === 2 ? 'Duas vias, tão afastadas quanto possível, com 3,5 m de largura útil' : 'Duas vias, tão afastadas quanto possível, com 7,0 m de largura útil';
    add({ tema: T1, titulo: 'Vias de acesso a recinto ao ar livre', exigencia: `${vias}; corredor livre para operações de socorro com comprimento ≥ metade do perímetro, largura útil ≥ 3,5 m e altura útil ≥ 4 m.`, base: 'RT-SCIE, art. 4.º n.os 5 e 6, quadro I', estado: 'aplica' });
    add({ tema: T1, titulo: 'Hidrantes exteriores (recinto ao ar livre)', exigencia: cat <= 2 ? 'Boca ou marco de incêndio a distância ≤ 150 m.' : 'Marco de incêndio a distância ≤ 100 m.', base: 'RT-SCIE, art. 12.º n.º 6, quadro VIII', estado: 'aplica' });
  } else if (H <= 9) {
    add({
      tema: T1, titulo: 'Vias de acesso (edifício com altura ≤ 9 m)',
      exigencia: 'Estacionamento dos veículos de socorro a ≤ 30 m de pelo menos uma saída do edifício; largura útil 3,5 m; altura útil 4 m; raio de curvatura mínimo 11 m ao eixo; inclinação máxima 15 %; capacidade para veículo de 130 kN (40 kN eixo dianteiro, 90 kN eixo traseiro).'
        + (cat === 1 && !temD ? '' : ' Vias em impasse: largura útil 7 m ou rotunda/entroncamento que evite mais de 30 m em marcha-atrás.'),
      base: 'RT-SCIE, art. 4.º n.os 1, 3 e 4', estado: 'aplica',
    });
  } else {
    add({
      tema: T1, titulo: 'Vias de acesso (edifício com altura > 9 m)',
      exigencia: 'Largura útil 6 m (10 m em impasse); altura útil 5 m; raio de curvatura 13 m; inclinação máxima 10 %; capacidade 260 kN (90 kN + 170 kN); marcha-atrás ≤ 20 m em impasse; faixa de operação com 7 m de largura, ≥ 15 m de comprimento, a 3–10 m da fachada, resistente ao punçoamento de 170 kN em Ø 20 cm e permanentemente livre.',
      base: 'RT-SCIE, art. 5.º', estado: 'aplica',
    });
    add({ tema: T1, titulo: 'Fachada acessível', exigencia: 'Pelo menos uma fachada acessível aos veículos de socorro nas condições do art. 5.º.', base: 'RT-SCIE, art. 6.º n.º 6', estado: 'aplica' });
  }
  if (!ut.arLivre) {
    const areaMax = Math.max(0, ...ut.pisos.map((p) => p.area));
    add({
      tema: T1, titulo: 'Pontos de penetração nas fachadas',
      exigencia: 'Pontos de penetração em todos os pisos até 50 m de altura, à razão mínima de um por cada 800 m² de piso ou fração, com dimensões mínimas de 1,2 × 0,6 m e abertura fácil a partir do exterior.'
        + (areaMax > 0 ? ` Piso de maior área: ${fmt(areaMax)} m² → mínimo ${Math.ceil(areaMax / 800)} ponto(s) nesse piso.` : '')
        + (areaMax > 800 ? ' Pisos com mais de 800 m²: pontos distribuídos por, no mínimo, duas fachadas acessíveis.' : ''),
      base: 'RT-SCIE, art. 6.º n.os 2, 5 e 7', estado: 'aplica',
    });
    add({
      tema: T1, titulo: 'Hidrantes exteriores',
      exigencia: 'Marcos de incêndio (preferencialmente) ou bocas de incêndio, segundo a EN 14384, a ≤ 30 m das saídas do edifício nas fachadas acessíveis e das bocas de alimentação das redes secas ou húmidas. Sem rede pública: depósito ≥ 60 m³ garantindo 20 l/s por marco (8 l/s DN 70; 4 l/s DN 50) a 150 kPa.',
      base: 'RT-SCIE, art. 12.º n.os 1 a 5 e 7', estado: 'aplica',
    });
  }
  add({
    tema: T1, titulo: 'Limitação da propagação pelo exterior',
    exigencia: 'Elementos de fachada entre vãos sobrepostos, paredes de empena, coberturas, revestimentos exteriores e ETICS nas condições dos arts. 7.º a 11.º e quadros II a VI (por classe de altura do edifício).',
    base: 'RT-SCIE, arts. 7.º a 11.º', estado: ut.arLivre ? 'nao' : 'verificar',
    motivo: ut.arLivre ? 'Recinto ao ar livre.' : 'Depende da geometria das fachadas e coberturas: verificar no projeto de arquitetura.',
  });

  /* --------------- Resistência ao fogo e compartimentação -------------- */
  const T2 = TEMAS[2];
  const q9 = quadroIX(t, cat);
  const umPisoPR = ut.pisos.length === 1 && ut.pisos[0].cota === 0;
  const isentoEstr = (t === 1 && cat === 1) || (t !== 1 && cat === 1 && umPisoPR);
  add({
    tema: T2, titulo: 'Resistência ao fogo dos elementos estruturais',
    exigencia: umPisoPR && t !== 1 && cat >= 2
      ? 'Edifício com um só piso no plano de referência: R 60 (apenas suporte) e REI 60 (suporte e compartimentação).'
      : `${q9.suporte} (apenas suporte) e ${q9.compartimentacao} (suporte e compartimentação).`,
    base: umPisoPR && t !== 1 && cat >= 2 ? 'RT-SCIE, art. 15.º n.º 2' : 'RT-SCIE, art. 15.º n.º 1, quadro IX',
    estado: isentoEstr ? 'nao' : 'aplica',
    motivo: isentoEstr ? (t === 1 ? 'Sem exigências se for habitação unifamiliar da 1.ª categoria (art. 15.º n.º 6 a)).' : 'UT II a XII da 1.ª categoria só com um piso no plano de referência (art. 15.º n.º 6 b)).') : undefined,
  });
  add({
    tema: T2, titulo: 'Isolamento entre utilizações-tipo distintas',
    exigencia: `Paredes e pavimentos EI/REI ${quadroX(t, cat)} (valor desta UT; adotar o mais gravoso das UT confinantes); vãos de comunicação com vias de evacuação protegidas: ${quadroXI(t, cat)}.`,
    base: 'RT-SCIE, art. 17.º n.º 2, quadros X e XI', estado: ed.uts.length > 1 ? 'aplica' : 'nao',
    motivo: ed.uts.length > 1 ? undefined : 'Edifício de utilização exclusiva.',
  });
  if (t === 12 && cat >= 3) {
    const outras = ed.uts.filter((u) => u.id !== ut.id && u.tipo !== 2 && u.tipo !== 8);
    add({
      tema: T2, titulo: 'Coexistência com outras UT',
      exigencia: 'Não é admitida a coexistência no mesmo edifício de UT XII das 3.ª/4.ª categorias com outras UT das 2.ª à 4.ª categorias, exceto UT II e VIII e UT I da 1.ª categoria destinada a proprietários ou funcionários.',
      base: 'RT-SCIE, art. 17.º n.º 1', estado: outras.length ? 'verificar' : 'nao',
      motivo: outras.length ? 'Existem outras UT no edifício: confirmar a categoria de cada uma.' : 'Sem outras UT no edifício.',
    });
  }
  if (t === 12) {
    const caso = ut.casoXII ?? 3;
    const l = quadroL(caso, cat);
    add({
      tema: T2, titulo: 'Compartimentação corta-fogo da UT XII',
      exigencia: `Caso ${['I', 'II', 'III', 'IV'][caso - 1]}: área máxima por compartimento acima do plano de referência ${l.acima === Infinity ? 'sem limite' : fmt(l.acima ?? 0) + ' m²'}; abaixo ${l.abaixo === null ? 'não aplicável' : fmt(l.abaixo) + ' m²'}. Isolamento EI/REI 60 com vãos E 30 / E 30 C.`,
      base: 'RT-SCIE, art. 302.º, quadro L; art. 18.º n.º 7', estado: 'aplica',
    });
  } else {
    const q12 = quadroXII(t, temD);
    const isento = t === 1 && cat === 1;
    add({
      tema: T2, titulo: 'Compartimentação geral corta-fogo',
      exigencia: `Cada piso constitui, em regra, compartimento corta-fogo distinto. Área máxima por compartimento: ${fmt(q12.acima)} m² acima/no plano de referência; ${fmt(q12.abaixo)} m² abaixo${q12.nota ? ` (${q12.nota})` : ''}. Isolamento EI/REI ${t === 1 || (t >= 3 && t <= 10) ? 30 : 60} com vãos E 30 (fixos) ou E 30 C. Áreas duplicáveis com sprinklers de cobertura total, exceto UT I e locais D (n.º 6).`,
      base: 'RT-SCIE, art. 18.º n.os 1, 2, 6 e 7, quadro XII', estado: isento ? 'nao' : 'aplica',
      motivo: isento ? 'Espaços da UT I da 1.ª categoria (art. 18.º n.º 3).' : undefined,
    });
    if ([3, 4, 5, 7, 8].includes(t) && H <= 9) {
      add({
        tema: T2, titulo: 'Três pisos num só compartimento (pequena altura)',
        exigencia: 'Admite-se que três pisos constituam um só compartimento corta-fogo se a área útil total não ultrapassar o quadro XII, nenhum piso exceder 800 m² e nenhum se situar mais de um piso abaixo do plano de referência' + (t === 4 || t === 5 ? '; locais D apenas no piso do plano de referência.' : '.'),
        base: 'RT-SCIE, art. 18.º n.º 4', estado: 'verificar', motivo: 'Opção de projeto.',
      });
    }
  }
  add({
    tema: T2, titulo: 'Atravessamentos e condutas',
    exigencia: 'Selagem dos atravessamentos com a resistência do elemento atravessado; condutas > 75 mm ou de efluentes de combustão com meios de isolamento; ductos > 0,2 m² em A1; portas de ductos E 30 C (H ≤ 28 m) ou E 60 C.',
    base: 'RT-SCIE, art. 14.º n.os 5 e 8, arts. 29.º a 33.º', estado: 'aplica',
  });

  /* ---------------- Isolamento e proteção de locais de risco ------------ */
  const T3 = TEMAS[3];
  for (const k of ['B', 'C', 'Cag', 'D', 'E', 'F'] as const) {
    const q = ENVOLVENTE_LOCAIS[k];
    const existe = locais.has(k);
    const nome = k === 'Cag' ? 'C agravado' : k;
    add({
      tema: T3, titulo: `Envolvente de locais de risco ${nome}`,
      exigencia: `Paredes sem função de suporte ${q.paredes}; pavimentos e paredes com função de suporte ${q.suporte}; portas ${q.portas}.`
        + (k === 'D' ? ' Locais D com área útil > 400 m² subcompartimentados com as mesmas classes, permitindo evacuação horizontal.' : '')
        + (k === 'C' ? ' Cozinhas ligadas a salas de refeições: admite-se que só a envolvente do conjunto cumpra, com controlo de fumo.' : ''),
      base: `RT-SCIE, art. ${q.artigo}, quadro ${q.quadro}`, estado: sim(existe), motivo: existe ? undefined : `Sem locais de risco ${nome} registados.`,
    });
  }
  add({
    tema: T3, titulo: 'Localização de locais de risco B acessíveis a público',
    exigencia: 'Próximo do piso de saída para o exterior; se abaixo das saídas, diferença de cota ≤ 6 m (exceto anfiteatros e plataformas de embarque da UT VIII).',
    base: 'RJ-SCIE, art. 11.º n.os 1 e 2', estado: sim(locais.has('B')), motivo: locais.has('B') ? undefined : 'Sem locais de risco B.',
  });
  add({
    tema: T3, titulo: 'Localização de locais de risco C agravado',
    exigencia: 'Sempre que possível ao nível do plano de referência e na periferia; sem comunicação direta com locais D, E ou F nem com vias verticais que sirvam outros espaços; portas a abrir no sentido da saída.',
    base: 'RJ-SCIE, art. 11.º n.º 3; RT-SCIE, art. 62.º n.º 11', estado: sim(temCag), motivo: temCag ? undefined : 'Sem locais de risco C agravado.',
  });
  add({
    tema: T3, titulo: 'Localização de locais de risco D e E',
    exigencia: 'Ao nível ou acima do piso de saída para local seguro no exterior.',
    base: 'RJ-SCIE, art. 11.º n.º 4', estado: sim(temDE), motivo: temDE ? undefined : 'Sem locais de risco D ou E.',
  });

  /* ---------------- Isolamento e proteção das vias -------------------- */
  const T4 = TEMAS[4];
  const q19 = quadroXIX(H);
  const viasProt: string[] = [];
  if (cat >= 3) viasProt.push('vias integradas nas comunicações comuns (UT da 3.ª/4.ª categoria)');
  viasProt.push('vias com comprimento > 30 m');
  if (H > 28 || abaixo) viasProt.push('vias com comprimento > 10 m em pisos acima de 28 m ou abaixo do plano de referência');
  if (locais.has('B')) viasProt.push('caminhos de locais B sem vias alternativas');
  if (temD) viasProt.push('caminhos de locais de risco D');
  add({
    tema: T4, titulo: 'Proteção das vias horizontais de evacuação',
    exigencia: `Vias protegidas: ${viasProt.join('; ')}. Envolvente (altura ${classe.toLowerCase()}): paredes ${q19.paredes}, paredes de suporte ${q19.suporte}, portas ${q19.portas}. Vias com acesso direto a locais D ou E: a classe mais gravosa dos quadros XIV a XIX.`,
    base: 'RT-SCIE, art. 25.º, quadro XIX', estado: 'aplica',
  });
  const vertIsenta = (t === 1 && cat === 1);
  add({
    tema: T4, titulo: 'Proteção das vias verticais de evacuação',
    exigencia: `Separação por paredes e pavimentos com escalão de tempo ≥ ao dos elementos estruturais (${q9.compartimentacao}). Acessos: quadros XX (piso de saída) e XXI (restantes pisos)${H > 28 ? '; H > 28 m: câmaras corta-fogo nos acessos interiores a vias enclausuradas' : ''}${abaixo ? '; vias abaixo do plano de referência: câmaras corta-fogo nos acessos interiores, exceto se derem acesso direto ao exterior' : ''}.`,
    base: 'RT-SCIE, art. 26.º, quadros XX e XXI', estado: vertIsenta ? 'nao' : 'aplica',
    motivo: vertIsenta ? 'Vias que sirvam em exclusivo UT I da 1.ª categoria (art. 26.º n.º 1 a)).' : undefined,
  });
  const q22 = quadroXXII(H);
  add({
    tema: T4, titulo: 'Outras circulações verticais e caixas de elevadores',
    exigencia: `Circulações verticais que não sejam vias de evacuação: paredes ${q22.paredes}, de suporte ${q22.suporte}, portas ${q22.portas}. Caixas de elevadores: EI/REI 60 e portas E 30 C quando sirvam mais de um piso abaixo do plano de referência ou H > 28 m; portas de patamar de funcionamento automático.`,
    base: 'RT-SCIE, arts. 27.º e 28.º, quadro XXII', estado: 'aplica',
  });
  add({
    tema: T4, titulo: 'Câmaras corta-fogo',
    exigencia: 'Envolvente EI 60 / REI 60, portas E 30 C; área ≥ 3 m² (≥ 6 m² se utilizáveis por mais de 50 pessoas); distância entre portas ≥ 1,2 m; pé-direito ≥ 2 m; dimensão linear ≥ 1,40 m; controlo de fumo.',
    base: 'RT-SCIE, arts. 35.º e 63.º', estado: H > 28 || abaixo || temCag ? 'aplica' : 'verificar',
    motivo: H > 28 || abaixo || temCag ? undefined : 'Só se previstas no projeto.',
  });
  add({
    tema: T4, titulo: 'Portas resistentes ao fogo',
    exigencia: 'Escalão de tempo igual a metade do da parede onde se inserem; dispositivos de fecho automático (classe C); retenção magnética libertada em caso de incêndio quando mantidas abertas, com sinalização.',
    base: 'RT-SCIE, arts. 34.º e 36.º', estado: 'aplica',
  });

  /* ---------------------------- Reação ao fogo ------------------------- */
  const T5 = TEMAS[5];
  const q23 = quadroXXIII(H);
  const q24 = quadroXXIV(H);
  const isentoRF = t === 1;
  add({
    tema: T5, titulo: 'Revestimentos de vias horizontais de evacuação',
    exigencia: `${q23.faixa}: paredes e tetos ${q23.paredes}; pavimentos ${q23.pavimentos}.${abaixo && H <= 28 ? ' Nos pisos abaixo do plano de referência: paredes e tetos A2-s1, d0; pavimentos Cfl-s1.' : ''}`,
    base: 'RT-SCIE, art. 39.º, quadro XXIII', estado: 'aplica',
  });
  add({
    tema: T5, titulo: 'Revestimentos de vias verticais e câmaras corta-fogo',
    exigencia: `${q24.faixa}: paredes e tetos ${q24.paredes}; pavimentos ${q24.pavimentos}. Vias exteriores: B-s3, d0 e Cfl-s2.`,
    base: 'RT-SCIE, art. 40.º, quadro XXIV', estado: 'aplica',
  });
  const locaisRF = [...locais].map((l) => (l === 'Cag' ? 'C' : l));
  const linhasRF = [...new Set(locaisRF)].sort().map((l) => `local ${l}: paredes e tetos ${QUADRO_XXV[l].paredes}, pavimentos ${QUADRO_XXV[l].pavimentos}`);
  add({
    tema: T5, titulo: 'Revestimentos de locais de risco',
    exigencia: linhasRF.length ? linhasRF.join('; ') + '.' : 'Classes do quadro XXV em função do local de risco.',
    base: 'RT-SCIE, art. 41.º, quadro XXV', estado: isentoRF && !linhasRF.length ? 'verificar' : 'aplica',
    motivo: isentoRF ? 'Espaços não comuns da UT I isentos (art. 38.º n.º 2).' : undefined,
  });
  add({
    tema: T5, titulo: 'Tetos falsos, mobiliário fixo e elementos suspensos',
    exigencia: 'Tetos falsos ≥ C-s2, d0 com fixações A1; difusores ≤ 25 % da área e ≥ D-s2, d0; mobiliário fixo em locais B ou D ≥ C-s2, d0; elementos em relevo ou suspensos em vias de evacuação ≤ 20 % da área e ≥ B-s1, d0.',
    base: 'RT-SCIE, arts. 43.º a 45.º', estado: 'aplica',
  });

  /* ------------------------------ Evacuação ---------------------------- */
  const T6 = TEMAS[6];
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
    if (e.local === 'D') extras.push('saídas para vias protegidas ou exterior (art. 60.º); 2 UP onde se evacuem pessoas em camas (art. 56.º n.º 4 c))');
    if (ev > 200) extras.push('barras antipânico nas portas (art. 62.º n.º 7 a))');
    if (ev > 50) extras.push('portas a abrir no sentido da evacuação (art. 62.º n.º 1)');
    const conforme = (e.saidasExistentes === undefined || e.saidasExistentes >= s.n) && (e.upExistentes === undefined || e.upExistentes >= upMin);
    const verif = e.saidasExistentes !== undefined || e.upExistentes !== undefined;
    add({
      tema: T6, titulo: `Saídas — ${e.nome || 'espaço'} (${e.piso || '—'})`,
      exigencia: `Efetivo ${c.valor}${e.mobilidadeReduzida ? ` × 1,3 = ${ev} para dimensionamento` : ''}: mínimo ${s.n} saída(s) [${s.texto}] e ${upMin} UP [${up.texto}]${extras.length ? '; ' + extras.join('; ') : ''}.`
        + (verif ? ` Existente: ${e.saidasExistentes ?? '—'} saída(s), ${e.upExistentes ?? '—'} UP → ${conforme ? 'CONFORME' : 'NÃO CONFORME'}.` : ''),
      base: `RT-SCIE, arts. 54.º e 56.º, quadros ${ut.arLivre ? 'XXX e XXXII' : 'XXIX e XXXI'}${e.mobilidadeReduzida ? '; art. 51.º n.º 5' + (t === 5 ? ' e art. 232.º' : '') : ''}`,
      estado: verif && !conforme ? 'verificar' : 'aplica',
      motivo: verif && !conforme ? 'Saídas ou largura existentes inferiores ao mínimo regulamentar.' : undefined,
    });
  }
  if (t === 12) {
    const d = quadroLI(cat);
    add({ tema: T6, titulo: 'Distâncias máximas nos locais (UT XII)', exigencia: `Impasse ≤ ${d.impasse} m; com alternativa de fuga ≤ ${d.alternativa} m (dobro ao ar livre).`, base: 'RT-SCIE, art. 304.º, quadro LI', estado: 'aplica' });
  } else {
    add({
      tema: T6, titulo: 'Distâncias máximas a percorrer nos locais',
      exigencia: `≤ 15 m em impasse; ≤ 30 m com acesso a saídas distintas (+50 % em locais amplos > 800 m² no piso do plano de referência com saídas diretas ao exterior; dobro ao ar livre).${t === 1 && cat > 1 ? ' Na UT I das 2.ª a 4.ª categorias apenas nas circulações horizontais comuns.' : ''}`,
      base: 'RT-SCIE, art. 57.º', estado: t === 1 && cat === 1 ? 'nao' : 'aplica',
      motivo: t === 1 && cat === 1 ? 'Exceção da UT I da 1.ª categoria (art. 57.º n.º 2 a)).' : undefined,
    });
  }
  add({
    tema: T6, titulo: 'Distâncias nas vias horizontais de evacuação',
    exigencia: `Até saída para o exterior ou via vertical protegida: ≤ ${temDE ? '10 m em impasse (vias que servem locais D ou E)' : '15 m em impasse'}; ≤ ${H > 28 || (abaixo && t !== 2) || temD ? 20 : 30} m fora de impasse; dobro em vias exteriores.`,
    base: 'RT-SCIE, art. 61.º n.os 2 a 4', estado: 'aplica',
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
    tema: T6, titulo: 'Vias verticais de evacuação',
    exigencia: `${H > 28 ? 'Pelo menos duas vias verticais (H > 28 m), com acessos afastados ≥ 10 m. ' : ''}Largura útil ≥ 1 UP por 70 utilizadores, considerando a maior soma dos efetivos de dois pisos consecutivos${maxDois ? `: ${maxDois} → ${upV} UP (verificar a ordem dos pisos)` : ''}${H > 28 ? ', mínimo 2 UP' : ''}. Barras antipânico nos acessos utilizáveis por mais de 50 pessoas. Vias abaixo do plano de referência não comunicam diretamente com as de cima (exceto 1.ª/2.ª categoria com ≤ 3 pisos).`,
    base: 'RT-SCIE, art. 64.º n.os 2, 3, 6, 7, 11 e 12; art. 62.º n.º 7 b)', estado: t === 1 || t === 2 ? 'verificar' : 'aplica',
    motivo: t === 1 || t === 2 ? 'Nas vias que servem exclusivamente UT I e II não se aplica o n.º 11 (1 UP/70).' : undefined,
  });
  add({
    tema: T6, titulo: 'Escadas e rampas',
    exigencia: 'No máximo dois lanços consecutivos sem mudança de direção; 3 a 25 degraus por lanço; degraus iguais em cada lanço; patamares com ≥ 1 m; rampas com inclinação e revestimento antiderrapante nos termos dos arts. 65.º a 67.º.',
    base: 'RT-SCIE, arts. 65.º a 67.º', estado: 'aplica',
  });
  if (t === 6 || t === 9) {
    add({
      tema: T6, titulo: 'Lugares destinados ao público',
      exigencia: 'Filas com ≤ 16 cadeiras entre coxias (8 entre coxia e parede); espaçamento ≥ 0,4 m; bancadas com ≤ 40 lugares entre coxias (20 junto a parede); 3.ª/4.ª categoria: coxias transversais de 2 UP, uma por 1 000 pessoas.',
      base: 'RT-SCIE, art. 53.º' + (t === 9 ? '; art. 284.º' : ''), estado: 'verificar', motivo: 'Aplicável se existirem lugares fixos para espectadores.',
    });
    if (ef.total > (ut.arLivre ? 15000 : 1000)) {
      add({ tema: T6, titulo: 'Lugares para espectadores com mobilidade condicionada', exigencia: 'Locais reservados servidos por caminhos de evacuação de locais D, com lugar para acompanhante.', base: 'RT-SCIE, art. 60.º n.º 3', estado: 'aplica' });
    }
  }

  /* ---------------- Sinalização e iluminação de emergência ------------- */
  const T7 = TEMAS[7];
  add({
    tema: T7, titulo: 'Sinalização de segurança',
    exigencia: 'Placas fotoluminescentes (DL 141/95, Portaria 1456-A/95, EN ISO 7010) com área A ≥ d²/2000 (6 m ≤ d ≤ 50 m), espaçadas de 6 a 30 m, visíveis de qualquer ponto; placas salientes entre 2,1 m e 3 m; a menos de 2 m em projeção horizontal das fontes luminosas.',
    base: 'RT-SCIE, arts. 108.º a 112.º', estado: t === 1 && cat === 1 ? 'nao' : 'aplica',
    motivo: t === 1 && cat === 1 ? 'Excetuados os espaços comuns da UT I da 1.ª categoria e os fogos (art. 108.º n.º 4).' : undefined,
  });
  add({
    tema: T7, titulo: 'Iluminação de emergência',
    exigencia: `Iluminação de ambiente (≥ 1 lux no pavimento) em locais B, C, D, E (exceto quartos), F e sanitários públicos > 10 m²; balizagem/circulação (5 lux a 1 m do pavimento) a < 2 m de interseções, mudanças de direção, patamares, CCF, botões de alarme, comandos, meios de 1.ª intervenção e saídas; autonomia ≥ 15 min.${[4, 5, 6, 8, 10, 11].includes(t) ? ' Blocos autónomos do tipo permanente (art. 115.º n.º 1).' : ''}`,
    base: 'RT-SCIE, arts. 113.º a 115.º', estado: t === 1 && cat === 1 ? 'nao' : 'aplica',
    motivo: t === 1 && cat === 1 ? 'Excetuada a UT I da 1.ª categoria (art. 113.º n.º 1).' : undefined,
  });

  /* ------------------------- Deteção, alarme e alerta ------------------ */
  const T8 = TEMAS[8];
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
    if (t === 7 && cat === 1) { config = 1; notaCfg = 'UT VII da 1.ª categoria (art. 129.º n.º 2 a)).'; }
    else if (cat === 1 && !abaixo) { config = 2; notaCfg = '1.ª categoria exclusivamente acima do solo (art. 129.º n.º 2 b)).'; }
    else config = 3;
    if (ut.turismoRural && cat === 1 && !abaixo && ef.emE <= 20) { config = 1; notaCfg = 'Turismo no espaço rural, de natureza e de habitação da 1.ª categoria, efetivo em locais E ≤ 20 (art. 129.º n.º 2 c)).'; }
  }
  if ((t === 6 || t === 9 || ut.arLivre) && ut.arLivre && t !== 2) { config = 0; notaCfg = 'Recintos ao ar livre isentos de alarme (art. 116.º n.º 2).'; }
  if (ed.uts.length > 1 && ed.comunicacoesComuns && cat >= 2 && t !== 1 && t !== 2) {
    config = 3; notaCfg += ' Edifício misto com comunicações interiores comuns: configuração 3 e quadro centralizador no posto de segurança (art. 130.º n.º 2).';
  }
  if ((temC || temF) && config < 2) {
    notaCfg += ' Locais de risco C e F inseridos em sistema, pelo menos, da configuração 2 (art. 131.º).';
  }
  const comps = config ? QUADRO_XXXVI.linhas.filter((l) => l.c[config - 1]).map((l) => l.comp.toLowerCase()) : [];
  add({
    tema: T8, titulo: 'Configuração do sistema de alarme',
    exigencia: config ? `Configuração ${config}: ${comps.join('; ')}. ${notaCfg}`.trim() : notaCfg || 'Isento.',
    base: `RT-SCIE, ${baseCfg}, art. 125.º, quadro XXXVI`, estado: config ? 'aplica' : 'nao', motivo: config ? undefined : notaCfg,
  });
  if ((temC || temF) && config < 2) {
    add({ tema: T8, titulo: 'Alarme em locais de risco C e F', exigencia: 'Inserção em sistema de alarme, pelo menos, da configuração 2.', base: 'RT-SCIE, art. 131.º', estado: 'aplica' });
  }
  add({
    tema: T8, titulo: 'Requisitos de funcionamento do SADI',
    exigencia: 'EN 54; botões a ~1,2 m junto às saídas dos pisos; alarme geral audível em todo o edifício durante ≥ 5 min; fonte de emergência: 72 h vigília + 30 min alarme (não vigiado) ou 12 h + 5 min (vigiado); deteção em tetos falsos > 0,8 m e pavimentos sobrelevados > 0,2 m com cablagens.',
    base: 'RT-SCIE, arts. 117.º a 123.º e 132.º', estado: config ? 'aplica' : 'nao', motivo: config ? undefined : 'Sem exigência de alarme.',
  });
  if (t === 5 && temD) add({ tema: T8, titulo: 'Alarme em locais de risco D (UT V)', exigencia: 'Difusão do alarme não reconhecível pelo público, destinada ao pessoal; na 2.ª categoria ou superior, posto não acessível a público com comunicação oral com o posto de segurança.', base: 'RT-SCIE, art. 236.º', estado: 'aplica' });
  if (ut.temGas || temC) {
    add({ tema: T8, titulo: 'Deteção automática de gás combustível', exigencia: 'Em locais de risco C com aparelhos de queima de gás ou armazenamento do quadro XXXV, e em ductos com canalizações de gás (2.ª categoria ou superior).', base: 'RT-SCIE, art. 184.º', estado: ut.temGas ? 'aplica' : 'verificar', motivo: ut.temGas ? undefined : 'Confirmar se existem aparelhos a gás ou ductos de gás.' });
  }

  /* ---------------------------- Controlo de fumo ----------------------- */
  const T9 = TEMAS[9];
  const cf: string[] = ['vias verticais enclausuradas', 'câmaras corta-fogo', 'vias horizontais protegidas (art. 25.º n.º 1)'];
  const areaAbaixo = ut.pisos.filter((p) => p.cota < 0).reduce((s, p) => Math.max(s, p.area), 0);
  const efAbaixo = ef.porPiso.filter((p) => ut.pisos.find((x) => x.nome === p.piso && x.cota < 0)).reduce((s, p) => s + p.efetivo, 0);
  if (abaixo && (efAbaixo > 200 || areaAbaixo > 400)) cf.push('pisos no subsolo (efetivo > 200 ou área > 400 m²)');
  const bGrandes = ut.espacos.filter((e) => e.local === 'B' && efetivoEspaco(e).valor > 500);
  if (bGrandes.length) cf.push(`locais de risco B com efetivo > 500 (${bGrandes.map((e) => e.nome).join(', ')})`);
  if (temCag) cf.push('locais de risco C agravado');
  if (ut.temCozinhaC) cf.push('cozinhas ligadas a salas de refeições (desenfumagem ativa e painéis de cantonamento)');
  if (t === 2 && !ut.arLivre) cf.push('espaços cobertos da UT II');
  if (t === 12) cf.push('espaços da UT XII (art. 306.º)');
  if (ut.espacoCenicoIsolavel) cf.push('espaços cénicos isoláveis');
  add({
    tema: T9, titulo: 'Espaços com controlo de fumo obrigatório',
    exigencia: cf.join('; ') + '.'
      + (H > 28 ? ' H > 28 m: vias verticais enclausuradas por sobrepressão duplicada por desenfumagem passiva de emergência; vias horizontais enclausuradas com sistemas ativos de arranque automático.' : '')
      + (ut.pisosAbaixo > 1 ? ' Mais de um piso enterrado: meios ativos, de preferência hierarquia de pressões.' : '')
      + (abaixo ? ' Escadas que servem pisos no subsolo sem saída direta ao exterior: pressurizadas.' : '')
      + ' Desenfumagem passiva interdita em espaços amplos com altura > 12 m.',
    base: 'RT-SCIE, arts. 133.º a 135.º; secções II a VII do capítulo IV do título VI (arts. 136.º a 161.º)', estado: 'aplica',
  });

  /* --------------------------- Meios de intervenção -------------------- */
  const T10 = TEMAS[10];
  const extIsento = t === 1 && cat <= 2;
  const extPisos = ut.pisos.map((p) => `${p.nome}: ${Math.max(Math.ceil(p.area / 200), 2)} extintores (1 por 200 m², mín. 2) e ${Math.ceil(p.area / 500) * 18} L de agente padrão (18 L por 500 m²)`);
  add({
    tema: T10, titulo: 'Extintores portáteis',
    exigencia: `Distância ≤ 15 m de qualquer saída de local de risco até ao extintor mais próximo; manípulo ≤ 1,2 m; em todos os locais C e F.${extPisos.length ? ' Dimensionamento por piso — ' + extPisos.join('; ') + '.' : ' Por piso: 1 extintor por 200 m² ou fração (mínimo 2) e 18 L de agente extintor padrão por 500 m² ou fração.'}${temC ? ' Cozinhas e laboratórios C: manta ignífuga; extintor 25F com óleos ou gorduras.' : ''}`,
    base: 'RT-SCIE, art. 163.º', estado: extIsento ? 'nao' : ut.arLivre ? 'verificar' : 'aplica',
    motivo: extIsento ? 'UT I das 1.ª e 2.ª categorias (art. 163.º n.º 1).' : ut.arLivre ? 'Ao ar livre, apenas em locais de risco C (art. 163.º n.º 8).' : undefined,
  });
  const carretelCond =
    ([2, 3, 4, 5, 6, 7, 8, 11, 12].includes(t) && cat >= 2) ||
    (t === 2 && cat === 1 && !ut.arLivre && ut.areaBruta > 500) ||
    ([1, 9, 10].includes(t) && cat >= 3) ||
    ut.espacos.some((e) => efetivoEspaco(e).valor > 200);
  const ruralVII = t === 7 && cat === 2 && ut.turismoRural;
  add({
    tema: T10, titulo: 'Rede de incêndio armada tipo carretel',
    exigencia: 'Carretéis EN 671-1 que cubram todos os pontos a ≤ 5 m de uma agulheta; distância entre bocas ≤ 2× o comprimento da mangueira; junto às saídas para vias verticais (< 3 m) e junto às saídas de locais com > 200 pessoas; manípulo ≤ 1,5 m; 1,5 l/s por boca com metade abertas (máx. 4), K ≥ 42.',
    base: 'RT-SCIE, arts. 164.º a 167.º', estado: ruralVII ? 'nao' : sim(carretelCond),
    motivo: ruralVII ? 'UT VII da 2.ª categoria de turismo no espaço rural dispensada (art. 257.º).' : carretelCond ? undefined : 'Não preenche as condições do art. 164.º.',
  });
  const seg = cat >= 3 ? 'húmida' : (t === 1 || t === 2) && cat === 2 ? 'seca ou húmida' : '';
  add({
    tema: T10, titulo: 'Meios de segunda intervenção (rede seca/húmida)',
    exigencia: seg
      ? `Rede ${seg}${cat === 4 && [4, 5, 6, 8, 12].includes(t) ? ' com bocas de incêndio armadas tipo teatro (EN 671-2)' : ''}; bocas duplas DN 50 storz a 0,8–1,2 m nos patamares ou CCF de todos os pisos; boca siamesa a ≤ 14 m da coluna${cat >= 3 ? '; rede húmida em carga com depósito privativo e grupo sobrepressor, alimentação alternativa pelos bombeiros; 3 l/s por boca (K = 85)' : ''}.`
      : 'Não exigida.',
    base: 'RT-SCIE, arts. 168.º a 171.º' + (t === 8 ? '; arts. 274.º' : '') + (t === 6 ? '; art. 251.º' : ''),
    estado: seg ? 'aplica' : 'nao', motivo: seg ? undefined : 'Exigida às UT I e II da 2.ª categoria e a todas as UT da 3.ª categoria ou superior.',
  });
  if (t === 12 && (ut.liquidosInflamaveisL ?? 0) > 0) {
    const L = ut.liquidosInflamaveisL!;
    const ef307 = L < 50 ? '113 B/C' : L <= 100 ? '144 B/C' : L <= 200 ? '233 B/C' : L <= 750 ? '233 B/C + extintor móvel de 50 kg de pó BC/ABC' : `233 B/C + ${Math.ceil(L / 1000)} extintor(es) móvel(eis) de 50 kg (1 por 1 000 l ou fração)`;
    add({ tema: T10, titulo: 'Extintores para líquidos combustíveis (UT XII)', exigencia: `${fmt(L)} l de líquidos combustíveis: eficácia mínima ${ef307} (escalão inferior se > 50 % em recipientes metálicos estanques).`, base: 'RT-SCIE, art. 307.º', estado: 'aplica' });
  }
  if (t === 2 && (ut.arLivre || ut.parqueAutomatico)) {
    add({ tema: T10, titulo: 'Meios de 1.ª intervenção específicos (UT II)', exigencia: ut.arLivre ? 'Um extintor portátil 21 A/113 B/C e um móvel de CO₂ ou pó ABC no posto de controlo.' : 'Extintores móveis de CO₂ ou pó ABC em cada piso junto ao acesso a cada escada; sprinklers em todos os pisos.', base: 'RT-SCIE, art. 226.º', estado: 'aplica' });
  }

  /* ------------------ Sistemas fixos de extinção ----------------------- */
  const T11 = TEMAS[11];
  const sprCond = (t === 2 && cat >= 3 && abaixo) || ([3, 6, 7, 8, 12].includes(t) && cat >= 3 && !ut.arLivre) || (t === 2 && ut.parqueAutomatico);
  const q37 = t === 2 ? QUADRO_XXXVII.II : t === 12 ? QUADRO_XXXVII.XII : QUADRO_XXXVII['III, VI, VII, VIII'];
  add({
    tema: T11, titulo: 'Sistema de extinção automática por água (sprinklers)',
    exigencia: `Sistema húmido: densidade ${q37.densidade} L/min/m², área de operação ${q37.area} m², ${q37.n} aspersores em simultâneo, calibre ${q37.calibre} mm, ${q37.tempo} min; depósito privativo e central de bombagem; posto de comando acessível aos bombeiros.`,
    base: 'RT-SCIE, arts. 173.º e 174.º, quadro XXXVII' + (t === 8 ? ' (ver exceções do capítulo VI do título VIII)' : ''),
    estado: sprCond ? 'aplica' : 'nao',
    motivo: sprCond ? undefined : 'Não exigido pelo art. 173.º n.º 1 para esta UT/categoria (pode ser medida compensatória, n.º 2, ou para duplicar áreas de compartimentação, art. 18.º n.º 6).',
  });
  if (ut.temCozinhaC) add({ tema: T11, titulo: 'Extinção automática em blocos de confeção', exigencia: 'Sistemas fixos de extinção por agente diferente da água nos blocos de confeção quando a potência total instalada o exija.', base: 'RT-SCIE, art. 175.º n.º 2', estado: 'verificar', motivo: 'Confirmar a potência instalada nos aparelhos de confeção.' });
  if (t === 12 && (ut.pinturaArea ?? 0) > 30) add({ tema: T11, titulo: 'Extinção automática em zonas de pintura', exigencia: 'Zonas de pintura ou aplicação de vernizes, colas ou solventes com ponto de inflamação < 55 °C com área > 30 m²: instalação fixa de extinção automática por água.', base: 'RT-SCIE, art. 308.º n.º 1', estado: 'aplica' });
  if (t === 12 && (ut.liquidosInflamaveisL ?? 0) > 750) add({ tema: T11, titulo: 'Extinção automática por agente diferente da água', exigencia: 'Armazenagem > 750 l (ou manuseamento > 50 l) de produtos combustíveis: instalação fixa por agente apropriado diferente da água.', base: 'RT-SCIE, art. 308.º n.º 2', estado: 'aplica' });
  if (ut.patrimonio && (t === 10 || t === 11)) add({ tema: T11, titulo: 'Proteção de bens patrimoniais', exigencia: 'Sistemas automáticos de extinção com agentes adequados à preservação nos locais de arquivo, conservação e restauro e nas casas-fortes.', base: t === 10 ? 'RT-SCIE, art. 294.º' : 'RT-SCIE, art. 298.º', estado: 'aplica' });
  add({ tema: T11, titulo: 'Drenagem de águas residuais da extinção', exigencia: 'Sistemas de drenagem das águas da extinção nos termos dos arts. 186.º a 189.º' + (t === 2 ? ' e 227.º' : t === 12 ? ' e 309.º' : '') + '.', base: 'RT-SCIE, capítulo X do título VI', estado: 'verificar', motivo: 'Depende da existência de sistemas de extinção por água e da UT.' });

  /* --------------------------- Posto de segurança ---------------------- */
  const T12 = TEMAS[12];
  const psCond = (t === 1 && cat >= 3) || (t >= 2 && cat >= 2) || (cat === 1 && temD) || (t === 9 && ut.designacao.toLowerCase().includes('campismo'));
  add({
    tema: T12, titulo: 'Posto de segurança',
    exigencia: 'Centraliza a informação de segurança, a receção e difusão de alarmes e a transmissão do alerta; pode ser na receção/portaria junto a um acesso principal; chaveiro de segurança e exemplares do plano de prevenção e do PEI; ocupado em permanência durante o funcionamento (art. 200.º n.º 5).'
      + (cat === 4 || (cat === 3 && temDE) ? ' 4.ª categoria ou 3.ª com locais D e E: constitui local de risco F e dispõe de comunicação oral com todos os pisos e locais técnicos por meios distintos da rede pública.' : ''),
    base: 'RT-SCIE, art. 190.º' + (t === 6 ? '; art. 254.º' : t === 8 ? '; art. 277.º' : t === 9 ? '; art. 287.º' : ''),
    estado: sim(psCond), motivo: psCond ? undefined : 'Exigido à UT I das 3.ª/4.ª categorias, às UT II a XII da 2.ª categoria ou superior e às UT da 1.ª categoria com locais D.',
  });

  /* ------------------------------ Autoproteção ------------------------- */
  const T13 = TEMAS[13];
  const map = quadroXXXIX(t, cat, temDE);
  add({
    tema: T13, titulo: 'Medidas de autoproteção exigíveis',
    exigencia: map ? map.map((m) => `${MAP_INFO[m].nome} (art. ${MAP_INFO[m].art})`).join('; ') + '.' : 'Não exigíveis.',
    base: 'RT-SCIE, art. 198.º, quadro XXXIX; RJ-SCIE, arts. 21.º e 22.º', estado: map ? 'aplica' : 'nao',
    motivo: map ? undefined : 'UT I das 1.ª e 2.ª categorias excluídas (RJ-SCIE, art. 22.º n.º 1).',
  });
  if (map) {
    add({ tema: T13, titulo: 'Responsável e delegado de segurança', exigencia: `RS: ${t === 1 ? 'administração do condomínio (espaços comuns)' : 'proprietário ou entidade exploradora'}; o RS designa um delegado de segurança para executar as medidas de autoproteção.`, base: 'RT-SCIE, art. 194.º, quadro XXXVIII; RJ-SCIE, arts. 6.º e 20.º', estado: 'aplica' });
    add({ tema: T13, titulo: 'Entrega das medidas de autoproteção', exigencia: `Submeter a parecer da ${cat === 1 ? 'câmara municipal' : 'ANEPC'} até 30 dias antes da entrada em funcionamento (construção nova, alteração, ampliação ou mudança de uso); atualizar sempre que mude a categoria de risco ou a UT.`, base: 'RJ-SCIE, art. 21.º n.os 2 e 3 e art. 22.º n.º 2', estado: 'aplica' });
    add({ tema: T13, titulo: 'Registos de segurança', exigencia: 'Relatórios de vistoria e inspeção, anomalias, manutenções, modificações e trabalhos perigosos, ocorrências, relatórios dos bombeiros, formação e simulacros; arquivo ≥ 10 anos.', base: 'RT-SCIE, art. 201.º', estado: 'aplica' });
  }
  if (map?.includes('pei')) {
    add({ tema: T13, titulo: 'Serviço de segurança contra incêndio (SSI)', exigencia: 'Delegado de segurança como chefe de equipa e elementos em número adequado à dimensão da UT e à categoria de risco; dimensionamento fundamentado e aceite pela ANEPC.', base: 'RT-SCIE, art. 200.º n.os 3, 4 e 6', estado: 'aplica' });
    add({ tema: T13, titulo: 'Plantas de emergência', exigencia: 'Para cada piso, segundo a NP 4386, afixadas junto aos acessos principais, nos locais D e E e nas zonas de refúgio.', base: 'RT-SCIE, art. 205.º n.º 6', estado: 'aplica' });
  }
  const sim41 = quadroXLI(t, cat, temDE);
  add({
    tema: T13, titulo: 'Periodicidade dos simulacros',
    exigencia: sim41 ? `Período máximo entre simulacros: ${sim41}.${t === 4 ? ' Na UT IV, no início do ano escolar.' : ''}` : 'Não exigidos.',
    base: 'RT-SCIE, art. 207.º, quadro XLI', estado: map?.includes('simulacros') && sim41 ? 'aplica' : 'nao',
    motivo: map?.includes('simulacros') && sim41 ? undefined : 'Sem plano de emergência interno exigível nesta categoria (quadro XXXIX).',
  });
  add({
    tema: T13, titulo: 'Instruções de segurança',
    exigencia: `Instruções afixadas para os ocupantes dos locais de risco C, D, E e F (com planta simplificada nos locais D e E)${map && !map.includes('pei') && !map.includes('procEmergencia') ? '; instruções simplificadas de alarme, alerta e uso de meios de 1.ª intervenção' : ''}.`,
    base: 'RT-SCIE, art. 199.º', estado: sim(temC || temDE || temF || (!!map && !map.includes('pei') && !map.includes('procEmergencia'))),
    motivo: temC || temDE || temF ? undefined : 'Sem locais C, D, E ou F.',
  });
  add({
    tema: T13, titulo: 'Formação em SCIE',
    exigencia: 'Sensibilização de todos os funcionários e colaboradores no prazo de 60 dias após a entrada ao serviço; formação específica para quem trabalha em locais C, D ou F e para os elementos com atribuições em emergência.' + (t === 1 ? ' Ocupantes dos fogos da UT I das 3.ª/4.ª categorias.' : t === 4 ? ' Alunos que permaneçam mais de 30 dias, no primeiro período do ano escolar.' : t === 9 ? ' Frequentadores que permaneçam mais de 30 dias.' : ''),
    base: 'RT-SCIE, art. 206.º', estado: map?.includes('formacao') ? 'aplica' : 'verificar',
    motivo: map?.includes('formacao') ? undefined : 'Não consta do quadro XXXIX nesta categoria; aplica-se o art. 206.º n.º 1 aos destinatários aí indicados.',
  });

  /* --------------------------- Condições específicas ------------------ */
  const T14 = TEMAS[14];
  if (t === 12) {
    add({ tema: T14, titulo: 'Distâncias entre edifícios (UT XII)', exigencia: `Paredes exteriores EI/REI 60 e vãos E 30 / E 30 C quando confrontem com edifícios a menos de ${quadroXLIX(cat, H)} m; se a menos de metade: EI/REI 90 e vãos E 45 / E 45 C; +4 m para equipamentos ao ar livre.`, base: 'RT-SCIE, art. 300.º, quadro XLIX', estado: 'aplica' });
  }
  for (const a of ESPECIFICAS[t] ?? []) {
    add({ tema: T14, titulo: `Art. ${a.art} — ${a.titulo}`, exigencia: `Condição específica da UT ${R}: verificar o cumprimento do art. ${a.art} do RT-SCIE no projeto.`, base: `RT-SCIE, título VIII, art. ${a.art}`, estado: 'verificar', motivo: 'Depende de elementos do projeto.' });
  }

  return M;
}

export function resumoMedidas(m: Medida[]) {
  return {
    aplica: m.filter((x) => x.estado === 'aplica').length,
    verificar: m.filter((x) => x.estado === 'verificar').length,
    nao: m.filter((x) => x.estado === 'nao').length,
  };
}
