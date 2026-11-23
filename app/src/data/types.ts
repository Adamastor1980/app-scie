export type Risco = 'A' | 'M' | 'B';

export interface ProdutoHi {
  p: string;
  h: number;
}

export interface Atividade {
  id: number;
  a: string;
  qs?: number;
  rs?: Risco;
  qv?: number;
  rv?: Risco;
}

export type Cat = 1 | 2 | 3 | 4;
export type UTNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type LocalRisco = 'A' | 'B' | 'C' | 'Cag' | 'D' | 'E' | 'F';

/* ------------------------------------------------------------------ */
/* Modelo de dados do projeto                                          */
/* ------------------------------------------------------------------ */

export interface Empresa {
  nome: string;
  nif: string;
  morada: string;
  telefone: string;
  email: string;
  website: string;
  alvara: string;
  apresentacao: string;
  logo?: string; // dataURL
}

export interface Autor {
  nome: string;
  qualificacao: string;
  ordem: string;
  numero: string;
  registoAnepc: string;
  email: string;
}

export interface Planta {
  id: string;
  tipo: 'localizacao' | 'implantacao' | 'cortes' | 'piso' | 'outra';
  titulo: string;
  escala: string;
  imagem: string; // dataURL
  legenda: string;
}

export type CriterioEfetivo =
  | 'indice'
  | 'camas'
  | 'acamados'
  | 'tipologia'
  | 'lugares'
  | 'declarado'
  | 'comprimento'
  | 'desportivo'
  | 'fundamentado';

export interface Espaco {
  id: string;
  nome: string;
  piso: string;
  local: LocalRisco;
  subtipoC?: string; // alínea do art. 10.º n.º 3
  criterio: CriterioEfetivo;
  indiceId?: string;
  area?: number;
  n?: number; // camas, lugares, acamados, n.º apartamentos, declarado, manual
  tipologia?: number; // n do Tn
  comprimento?: number;
  comprimentoTipo?: 'sentados' | 'pe';
  desportivoTipo?: 'apoio' | 'patinagem' | 'agua';
  espectadores?: number;
  efetivoPublico?: number;
  /** local B atribuído automaticamente pelo efetivo (volta a A se o efetivo descer); B escolhido à mão fica B */
  localAuto?: boolean;
  mobilidadeReduzida?: boolean; // fator 1,3 (art. 51.º n.º 5 / art. 232.º)
  naoSimultaneo?: boolean; // art. 51.º n.º 9
  justificacao?: string;
  saidasExistentes?: number;
  upExistentes?: number;
}

export interface Piso {
  id: string;
  nome: string;
  cota: number; // m relativamente ao plano de referência (negativo = abaixo)
  area: number; // área de pavimento do piso afeta à UT (m²)
  tecnico?: boolean; // só instalações técnicas (não conta para pisos abaixo)
}

export interface ItemDet {
  id: string;
  produto: string;
  hi: number;
  massa: number;
  ci: number;
  rai: number;
  /** líquidos: quantidade em litros e densidade (kg/L) — massa = litros × densidade */
  emLitros?: boolean;
  litros?: number;
  densidade?: number;
  fonteDensidade?: string;
}

export interface ZonaAtividade {
  id: string;
  atividadeId?: number;
  nome: string;
  qs: number;
  area: number;
  ci: number;
  rai: number;
}

export interface ZonaArmazem {
  id: string;
  atividadeId?: number;
  nome: string;
  qv: number;
  altura: number;
  area: number;
  ci: number;
  rai: number;
}

export interface Compartimento {
  id: string;
  nome: string;
  area: number;
  metodo: 'deterministico' | 'probabilistico';
  itens: ItemDet[];
  atividades: ZonaAtividade[];
  armazens: ZonaArmazem[];
  regraRai: boolean; // (legado) o n.º 7.º-3 aplica-se sempre
  atividadeDetId?: number; // determinístico: atividade do compartimento (quadro II) que define o Rai
  raiDet?: number;
}

export type Conformidade = 'cumpre' | 'nao_cumpre' | 'na';

/** Verificação de uma exigência no local (avaliação de edifício existente) */
export interface Verificacao {
  estado?: Conformidade;
  obs?: string;
  corretiva?: string;
  prazo?: string; // ex.: 'Imediato', '2027 · 1.º S'
  /** evidências: fotografias (ids de anexos do levantamento da UT) */
  fotos?: string[];
  /** localização na planta (coordenadas relativas 0–1) */
  ponto?: { plantaId: string; x: number; y: number };
}

export interface Revisao {
  versao: string;
  data: string;
  descricao: string;
}

export interface Distribuicao {
  exemplar: string;
  entidade: string;
  suporte: string;
}

export interface UT {
  id: string;
  tipo: UTNum;
  designacao: string;
  descricao: string;
  altura: number;
  pisosAbaixo: number;
  /** o técnico indicou o valor (0 também é válido, mas tem de ser confirmado) */
  indicados?: { altura?: boolean; pisos?: boolean };
  areaBruta: number;
  arLivre: boolean;
  exclusivoArmazem: boolean;
  saidaIndependenteD: boolean; // locais D/E com saídas independentes diretas ao exterior no plano de referência
  efetivoManual?: number;
  usarEfetivoManual: boolean;
  pisos: Piso[];
  espacos: Espaco[];
  compartimentos: Compartimento[];
  // dados complementares para as medidas
  parqueAutomatico?: boolean;
  turismoRural?: boolean;
  temCozinhaC?: boolean;
  temGas?: boolean;
  espacoCenicoIsolavel?: boolean;
  patrimonio?: boolean;
  liquidosInflamaveisL?: number;
  pinturaArea?: number;
  casoXII?: 1 | 2 | 3 | 4;
  observacoes: string;
  /** chave da medida (secção + título) → verificação */
  verificacao?: Record<string, Verificacao>;
  /** levantamento no local: fotografias e desenhos de apoio (uso interno, não entram nos cálculos) */
  levantamento?: Anexo[];
  /** factos do local que decidem a aplicabilidade das medidas (Sim/Não); ausente = por responder */
  factos?: Record<string, boolean>;
}

export interface Anexo {
  id: string;
  tipo: 'foto' | 'desenho';
  imagem: string; // data URL (na nuvem é guardada à parte, como as plantas)
  legenda: string;
  data: number;
}

export interface Edificio {
  id: string;
  nome: string;
  descricao: string;
  altura: number; // altura do edifício (anexo I RT-SCIE)
  /** o técnico indicou a altura do edifício (0 também é válido, mas tem de ser indicado) */
  alturaIndicada?: boolean;
  pisosAcima: number;
  /** o técnico indicou os pisos acima do plano de referência */
  pisosAcimaIndicado?: boolean;
  pisosAbaixo: number;
  independente: boolean;
  comunicacoesComuns: boolean; // utilização mista com comunicações interiores comuns
  uts: UT[];
}

export interface Projeto {
  id: string;
  /** projeto de exemplo: só para ver o funcionamento; não é guardado nem sincronizado */
  exemplo?: boolean;
  nome: string;
  referencia: string;
  cliente: string;
  morada: string;
  concelho: string;
  distrito: string;
  coordenadas: string;
  tipoIntervencao: string;
  objetivo: string;
  data: string;
  versao: string;
  autor: Autor;
  empresa: Empresa;
  edificios: Edificio[];
  plantas: Planta[];
  conclusoes: string;
  clienteLogo?: string;
  revisoes?: Revisao[];
  distribuicao?: Distribuicao[];
  /** medidas de autoproteção: organização da segurança e registos (RT-SCIE, título VII) */
  autoprotecao?: Autoprotecao;
  criadoEm: number;
  atualizadoEm: number;
}

/* ------------------------- Autoproteção ---------------------------- */

export interface Pessoa {
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
}

export interface ElementoEquipa {
  id: string;
  nome: string;
  funcao: string; // ex.: chefe de equipa, 1.ª intervenção, evacuação, alarme e alerta, corte de energia…
  turno: string;
  telefone: string;
}

export interface Contacto {
  id: string;
  entidade: string;
  telefone: string;
}

export type TipoRegisto = 'relatorio' | 'anomalia' | 'manutencao' | 'modificacao' | 'ocorrencia' | 'bombeiros' | 'formacao' | 'simulacro';

export interface Registo {
  id: string;
  tipo: TipoRegisto;
  data: string; // AAAA-MM-DD
  dataFim?: string; // modificações / trabalhos perigosos: data de finalização
  uts: string[]; // ids das UT abrangidas (vazio = todo o projeto)
  elemento: string; // manutenção: elemento intervencionado; formação: ação; simulacro: cenário; relatório: entidade/assunto
  tipoAcao: string; // manutenção: tipo de ação; ocorrência: tipo (alarme falso, princípio de incêndio…)
  motivo: string;
  descricao: string;
  responsavel: string;
  participantes?: number;
  anexos?: Anexo[];
}

export interface Autoprotecao {
  rs: Pessoa; // responsável de segurança (art. 6.º RJ-SCIE)
  delegado: Pessoa; // delegado de segurança
  equipa: ElementoEquipa[];
  fundamentacaoEquipa: string; // art. 200.º n.os 3 e 4 RT-SCIE
  postoSeguranca: string;
  horario: string;
  contactos: Contacto[];
  registos: Registo[];
  /** data de entrada em funcionamento (art. 203.º n.º 1 a) ii)) */
  dataFuncionamento?: string;
  /** textos do documento MAP escritos pelo autor, por secção (chave = artigo/alínea) */
  textos?: Record<string, string>;
}
