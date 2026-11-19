// RJ-SCIE — Decreto-Lei n.º 220/2008, republicado pela Lei n.º 123/2019, de 18 de outubro (anexo II).
// Transcrição dos elementos necessários ao cálculo. Fonte: PDF da Lei 123/2019 (docs/legislacao).
import type { Cat, LocalRisco, UTNum } from './types';

export const ROMANO: Record<UTNum, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII',
};

export interface UTInfo {
  n: UTNum;
  nome: string;
  alinea: string;
  definicao: string;
  exemplos: string;
  fatores: string; // art. 12.º n.º 2
  quadro: string;
}

/** Art. 8.º n.º 1 e art. 12.º n.º 2 do RJ-SCIE */
export const UTS: UTInfo[] = [
  {
    n: 1, nome: 'Habitacionais', alinea: 'a)', quadro: 'Quadro I',
    definicao: 'Edifícios ou partes de edifícios destinados a habitação unifamiliar ou multifamiliar, incluindo os espaços comuns de acessos e as áreas não residenciais reservadas ao uso exclusivo dos residentes.',
    exemplos: 'Moradias, edifícios de habitação multifamiliar.',
    fatores: 'Altura da UT e número de pisos abaixo do plano de referência (art. 12.º n.º 2 a)).',
  },
  {
    n: 2, nome: 'Estacionamentos', alinea: 'b)', quadro: 'Quadro II',
    definicao: 'Edifícios ou partes de edifícios destinados exclusivamente à recolha de veículos e seus reboques, fora da via pública, ou recintos delimitados ao ar livre, para o mesmo fim.',
    exemplos: 'Parques de estacionamento cobertos, em estrutura ou ao ar livre.',
    fatores: 'Espaço coberto ou ao ar livre, altura da UT, número de pisos abaixo do plano de referência e área bruta (art. 12.º n.º 2 b)).',
  },
  {
    n: 3, nome: 'Administrativos', alinea: 'c)', quadro: 'Quadro III',
    definicao: 'Edifícios ou partes de edifícios onde se desenvolvem atividades administrativas, de atendimento ao público ou de serviços, nomeadamente escritórios, repartições públicas, tribunais, conservatórias, balcões de atendimento, notários, gabinetes de profissionais liberais, espaços de investigação não dedicados ao ensino, postos de forças de segurança e de socorro, excluindo as oficinas de reparação e manutenção.',
    exemplos: 'Escritórios, tribunais, repartições, conservatórias.',
    fatores: 'Altura da UT e efetivo (art. 12.º n.º 2 c)).',
  },
  {
    n: 4, nome: 'Escolares', alinea: 'd)', quadro: 'Quadro IV',
    definicao: 'Edifícios ou partes de edifícios recebendo público, onde se ministrem ações de educação, ensino e formação ou exerçam atividades lúdicas ou educativas para crianças e jovens, podendo ou não incluir espaços de repouso ou de dormida afetos aos participantes nessas ações e atividades.',
    exemplos: 'Escolas, creches, jardins de infância, centros de formação, ATL, centros de juventude.',
    fatores: 'Altura da UT, efetivo, efetivo em locais de risco D ou E e, apenas para a 1.ª categoria, saída independente direta ao exterior de locais de risco D, ao nível do plano de referência (art. 12.º n.º 2 d)).',
  },
  {
    n: 5, nome: 'Hospitalares e lares de idosos', alinea: 'e)', quadro: 'Quadro IV',
    definicao: 'Edifícios ou partes de edifícios recebendo público, destinados à execução de ações de diagnóstico ou à prestação de cuidados na área da saúde, com ou sem internamento, ao apoio a pessoas idosas ou com condicionalismos decorrentes de fatores de natureza física ou psíquica, ou onde se desenvolvam atividades dedicadas a essas pessoas.',
    exemplos: 'Hospitais, clínicas, centros de saúde, lares, centros de dia.',
    fatores: 'Altura da UT, efetivo, efetivo em locais de risco D ou E e, apenas para a 1.ª categoria, saída independente direta ao exterior de locais de risco D, ao nível do plano de referência (art. 12.º n.º 2 d)).',
  },
  {
    n: 6, nome: 'Espetáculos e reuniões públicas', alinea: 'f)', quadro: 'Quadro V',
    definicao: 'Edifícios, partes de edifícios, recintos itinerantes ou provisórios e ao ar livre que recebam público, destinados a espetáculos, reuniões públicas, exibição de meios audiovisuais, bailes, jogos, conferências, palestras, culto religioso e exposições.',
    exemplos: 'Teatros, cinemas, auditórios, discotecas, igrejas, pavilhões multiusos.',
    fatores: 'Espaço coberto ou ao ar livre, altura da UT, número de pisos abaixo do plano de referência e efetivo (art. 12.º n.º 2 e)).',
  },
  {
    n: 7, nome: 'Hoteleiros e restauração', alinea: 'g)', quadro: 'Quadro VI',
    definicao: 'Edifícios ou partes de edifícios, recebendo público, fornecendo alojamento temporário ou exercendo atividades de restauração e bebidas, em regime de ocupação exclusiva ou não.',
    exemplos: 'Hotéis, alojamento local, restaurantes, bares, residências de estudantes.',
    fatores: 'Altura da UT, efetivo, efetivo em locais de risco E e, apenas para a 1.ª categoria, saída independente direta ao exterior de locais de risco E, ao nível do plano de referência (art. 12.º n.º 2 d)).',
  },
  {
    n: 8, nome: 'Comerciais e gares de transportes', alinea: 'h)', quadro: 'Quadro VII',
    definicao: 'Edifícios ou partes de edifícios, recebendo público, ocupados por estabelecimentos comerciais onde se exponham e vendam materiais, produtos, equipamentos ou outros bens, destinados a ser consumidos no exterior desse estabelecimento, ou ocupados por gares destinados a aceder a meios de transporte.',
    exemplos: 'Lojas, centros comerciais, supermercados, gares.',
    fatores: 'Altura da UT, número de pisos abaixo do plano de referência e efetivo (art. 12.º n.º 2 g)).',
  },
  {
    n: 9, nome: 'Desportivos e de lazer', alinea: 'i)', quadro: 'Quadro V',
    definicao: 'Edifícios, partes de edifícios e recintos, recebendo ou não público, destinados a atividades desportivas e de lazer.',
    exemplos: 'Estádios, pavilhões, piscinas, ginásios, parques de campismo.',
    fatores: 'Espaço coberto ou ao ar livre, altura da UT, número de pisos abaixo do plano de referência e efetivo (art. 12.º n.º 2 e)).',
  },
  {
    n: 10, nome: 'Museus e galerias de arte', alinea: 'j)', quadro: 'Quadro VIII',
    definicao: 'Edifícios ou partes de edifícios, recebendo ou não público, destinados à exibição de peças do património histórico e cultural ou a atividades de exibição, demonstração e divulgação de carácter científico, cultural ou técnico.',
    exemplos: 'Museus, galerias de arte, oceanários, aquários.',
    fatores: 'Altura da UT e efetivo (art. 12.º n.º 2 c)).',
  },
  {
    n: 11, nome: 'Bibliotecas e arquivos', alinea: 'k)', quadro: 'Quadro IX',
    definicao: 'Edifícios ou partes de edifícios, recebendo ou não público, destinados a arquivo documental, podendo disponibilizar os documentos para consulta ou visualização no próprio local ou não.',
    exemplos: 'Bibliotecas, mediatecas, arquivos.',
    fatores: 'Altura da UT, número de pisos abaixo do plano de referência, efetivo e densidade de carga de incêndio modificada (art. 12.º n.º 2 h)).',
  },
  {
    n: 12, nome: 'Industriais, oficinas e armazéns', alinea: 'l)', quadro: 'Quadro X',
    definicao: 'Edifícios, partes de edifícios ou recintos ao ar livre, não recebendo habitualmente público, destinados ao exercício de atividades industriais ou ao armazenamento de materiais, substâncias, produtos ou equipamentos, oficinas de reparação e todos os serviços auxiliares ou complementares destas atividades.',
    exemplos: 'Fábricas, oficinas, armazéns.',
    fatores: 'Espaço coberto ou ao ar livre, número de pisos abaixo do plano de referência e densidade de carga de incêndio modificada (art. 12.º n.º 2 i)).',
  },
];

export const utInfo = (n: UTNum) => UTS[n - 1];

/* ------------------------------------------------------------------ */
/* Anexo III — quadros de categorias de risco                          */
/* ------------------------------------------------------------------ */

/** Um critério do anexo III: limites máximos para a 1.ª, 2.ª e 3.ª categorias (a 4.ª é "superior"). */
export interface Criterio {
  id: string;
  rotulo: string;
  unidade: string;
  /** limites máximos [1.ª, 2.ª, 3.ª]; null = critério não aplicável nessa categoria */
  max: [number, number, number];
  formato?: (v: number) => string;
}

export const fmtLim = (v: number, u: string) =>
  `${v.toLocaleString('pt-PT')}${u ? ' ' + u : ''}`;

/** Quadros I a X do anexo III, valores transcritos da Lei 123/2019 (págs. 45 a 48). */
export const ANEXO_III = {
  q1_altura: [9, 28, 50] as [number, number, number],
  q1_pisos: [1, 3, 5] as [number, number, number],
  q2_altura: [9, 28, 28] as [number, number, number],
  q2_area: [3200, 9600, 32000] as [number, number, number],
  q2_pisos: [1, 3, 5] as [number, number, number],
  q3_altura: [9, 28, 50] as [number, number, number],
  q3_efetivo: [100, 1000, 5000] as [number, number, number],
  q4_altura: [9, 9, 28] as [number, number, number],
  q4_efetivo: [100, 500, 1500] as [number, number, number],
  q4_efetivoDE: [25, 100, 400] as [number, number, number],
  q5_altura: [9, 28, 28] as [number, number, number],
  q5_pisos: [0, 1, 2] as [number, number, number],
  q5_efetivo: [100, 1000, 5000] as [number, number, number],
  q5_efetivoArLivre: [1000, 15000, 40000] as [number, number, number],
  q6_altura: [9, 28, 28] as [number, number, number],
  q6_efetivo: [100, 500, 1500] as [number, number, number],
  q6_efetivoE: [50, 200, 800] as [number, number, number],
  q7_altura: [9, 28, 28] as [number, number, number],
  q7_pisos: [0, 1, 2] as [number, number, number],
  q7_efetivo: [100, 1000, 5000] as [number, number, number],
  q8_altura: [9, 28, 28] as [number, number, number],
  q8_efetivo: [100, 500, 1500] as [number, number, number],
  q9_altura: [9, 28, 28] as [number, number, number],
  q9_pisos: [0, 1, 2] as [number, number, number],
  q9_efetivo: [100, 500, 1500] as [number, number, number],
  q9_carga: [1000, 10000, 30000] as [number, number, number],
  q10_carga: [500, 5000, 15000] as [number, number, number],
  q10_pisos: [0, 1, 1] as [number, number, number],
  q10_cargaArLivre: [1000, 10000, 30000] as [number, number, number],
};

export const NOTA_PISOS_TECNICOS =
  '(*) Não são contabilizados os pisos destinados exclusivamente a instalações e equipamentos técnicos que apenas impliquem a presença de pessoas para fins de manutenção e reparação, e/ou que disponham de instalações sanitárias.';

/* ------------------------------------------------------------------ */
/* Art. 10.º — locais de risco                                         */
/* ------------------------------------------------------------------ */

export const LOCAIS: Record<LocalRisco, { nome: string; def: string }> = {
  A: {
    nome: 'Local de risco A',
    def: 'Local que não apresenta riscos especiais: efetivo ≤ 100 pessoas; efetivo de público ≤ 50 pessoas; mais de 90 % dos ocupantes não limitados na mobilidade ou nas capacidades de perceção e reação a um alarme; atividades, produtos, materiais e equipamentos sem riscos agravados de incêndio (art. 10.º n.º 1 a)).',
  },
  B: {
    nome: 'Local de risco B',
    def: 'Local acessível ao público ou ao pessoal afeto ao estabelecimento, com efetivo > 100 pessoas ou efetivo de público > 50 pessoas, com mais de 90 % dos ocupantes não limitados e sem riscos agravados de incêndio (art. 10.º n.º 1 b)). Um conjunto de locais A no mesmo compartimento corta-fogo que ultrapasse estes limites é local B (n.º 2).',
  },
  C: {
    nome: 'Local de risco C',
    def: 'Local com riscos particulares agravados de eclosão e de desenvolvimento de incêndio devido às atividades ou às características dos produtos, materiais ou equipamentos (art. 10.º n.º 1 c) e n.º 3).',
  },
  Cag: {
    nome: 'Local de risco C agravado',
    def: 'Local de risco C com volume > 600 m³, ou carga de incêndio modificada > 20 000 MJ, ou potência instalada de equipamentos elétricos e eletromecânicos > 250 kW, ou alimentados a gás > 70 kW, ou com líquidos inflamáveis > 100 l (art. 11.º n.º 3).',
  },
  D: {
    nome: 'Local de risco D',
    def: 'Local com permanência de pessoas acamadas ou destinado a receber crianças com idade não superior a 3 anos ou pessoas limitadas na mobilidade ou nas capacidades de perceção e reação a um alarme (art. 10.º n.º 1 d) e n.º 4).',
  },
  E: {
    nome: 'Local de risco E',
    def: 'Local destinado a dormida, em que as pessoas não apresentem as limitações dos locais de risco D (art. 10.º n.º 1 e) e n.º 5).',
  },
  F: {
    nome: 'Local de risco F',
    def: 'Local que possua meios e sistemas essenciais à continuidade de atividades sociais relevantes, nomeadamente centros nevrálgicos de comunicação, comando e controlo (art. 10.º n.º 1 f) e n.º 6).',
  },
};

/** Art. 10.º n.º 3 — exemplos legais de locais de risco C */
export const SUBTIPOS_C: { id: string; txt: string }[] = [
  { id: 'a', txt: 'a) Oficinas de manutenção e reparação destinadas a carpintaria ou com chama nua, faíscas ou elementos incandescentes junto de materiais facilmente inflamáveis' },
  { id: 'b', txt: 'b) Farmácias, laboratórios, oficinas e outros locais com líquidos inflamáveis em quantidade superior a 10 l' },
  { id: 'c', txt: 'c) Cozinhas com aparelhos de confeção ou conservação com potência útil total superior a 20 kW (exceto no interior das habitações)' },
  { id: 'd', txt: 'd) Locais de confeção de alimentos que recorram a combustíveis sólidos' },
  { id: 'e', txt: 'e) Lavandarias ou engomadorias com potência útil total superior a 20 kW' },
  { id: 'f', txt: 'f) Instalações de frio para conservação com potência útil total superior a 70 kW' },
  { id: 'g', txt: 'g) Arquivos, depósitos, armazéns e arrecadações com volume de compartimento superior a 100 m³' },
  { id: 'h', txt: 'h) Reprografias com área superior a 50 m²' },
  { id: 'i', txt: 'i) Locais de recolha de contentores ou compactadores de lixo com capacidade total superior a 10 m³' },
  { id: 'j', txt: 'j) Serviços técnicos com equipamentos elétricos, eletromecânicos ou térmicos com potência útil total superior a 70 kW' },
  { id: 'k', txt: 'k) Locais de pintura e aplicação de vernizes com produtos inflamáveis' },
  { id: 'l', txt: 'l) Centrais de incineração' },
  { id: 'm', txt: 'm) Estacionamentos cobertos com área bruta entre 50 m² e 200 m² em edifícios da UT I (exceto individuais)' },
  { id: 'n', txt: 'n) Outros locais com carga de incêndio modificada superior a 10 000 MJ associada a materiais facilmente inflamáveis, ou com riscos de explosão' },
];

/* ------------------------------------------------------------------ */
/* Competências, inspeções, projeto (arts. 5.º, 17.º, 19.º)            */
/* ------------------------------------------------------------------ */

/** Art. 19.º n.º 4 — prazo máximo das inspeções regulares (anos) */
export const INSPECOES: Record<Cat, number> = { 1: 6, 2: 5, 3: 4, 4: 3 };

export const DIPLOMAS = [
  {
    sigla: 'RJ-SCIE',
    titulo: 'Decreto-Lei n.º 220/2008, de 12 de novembro, na redação dada pela Lei n.º 123/2019, de 18 de outubro',
    objeto: 'Regime jurídico da segurança contra incêndio em edifícios.',
  },
  {
    sigla: 'RT-SCIE',
    titulo: 'Portaria n.º 1532/2008, de 29 de dezembro, na redação dada pela Portaria n.º 135/2020, de 2 de junho',
    objeto: 'Regulamento técnico de segurança contra incêndio em edifícios.',
  },
  {
    sigla: 'Despacho 2074/2009',
    titulo: 'Despacho n.º 2074/2009, de 15 de janeiro, na redação dada pelo Despacho n.º 8954/2020, de 18 de setembro',
    objeto: 'Critérios técnicos para determinação da densidade de carga de incêndio modificada.',
  },
];
