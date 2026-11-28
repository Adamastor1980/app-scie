/**
 * Módulo «Avaliação de riscos» (SST) — independente do módulo SCIE.
 * Base legal: Lei n.º 102/2009 (regime jurídico da promoção da segurança e saúde no trabalho).
 * Método: SSARA — Sistema Simplificado de Avaliação de Riscos de Acidente (NTP 330, INSST), como na matriz do utilizador (V5.0).
 */

export type VersaoSSARA = 'light' | 'completa';
export type TipoMedida = 1 | 2 | 3 | 4 | 5;
export type EstadoMedida = 'por_iniciar' | 'em_curso' | 'concluido' | 'cancelado';
export type Eficacia = 'eficaz' | 'parcial' | 'ineficaz';

export interface MedidaPlano {
  id: string;
  descricao: string;
  /** hierarquia (art. 15.º n.º 2 da Lei n.º 102/2009): 1 eliminação › 2 substituição › 3 proteção coletiva/engenharia › 4 organizativa/sinalização/formação › 5 EPI */
  tipo?: TipoMedida;
  responsavel: string;
  prazo: string;
  custo?: number;
  estado: EstadoMedida;
  conclusao: string;
  evidencia: string;
  observacoes: string;
}

export interface LinhaRisco {
  id: string;
  /** id da entrada da biblioteca de onde veio a sugestão (o técnico valida) */ origem?: string;
  /** completa */ area: string;
  atividade: string;
  /** completa */ expostos?: number;
  perigo: string;
  risco: string;
  /** Nível de Deficiência (10, 6, 2, 1) */ nd?: number;
  /** respostas do Quadro 2 que dão o ND (opcional) */ q2?: { legal?: boolean; informacao?: boolean; formacao?: boolean };
  /** Nível de Exposição (4, 3, 2, 1) */ ne?: number;
  /** Nível de Consequência (100, 60, 25, 10) */ nc?: number;
  /** completa */ existentes: string;
  medidas: MedidaPlano[];
  /** completa — acompanhamento */ estado?: EstadoMedida; responsavel: string; dataAvaliacao: string; prazo: string; avaliador: string;
  /** reavaliação — risco residual */
  implementadas: string; nd2?: number; ne2?: number; nc2?: number;
  /** completa */ aceitavel?: boolean; eficacia?: Eficacia; dataReav: string; verificadoPor: string; acoesAdicionais: string;
}

export interface Pessoa { nome: string; funcao: string; data: string }

export interface AvaliacaoRiscos {
  id: string;
  versao: VersaoSSARA;
  titulo: string;
  codigo: string; revisao: string; dataEmissao: string; classificacao: string;
  entidade: { designacao: string; nipc: string; morada: string; cae: string; responsavel: string; contacto: string; tecnicoSST: string };
  executante: { designacao: string; nipc: string; morada: string; habilitacoes: string; responsavelTecnico: string; servicoSST: string; contacto: string };
  trabalho: { atividade: string; tipoIntervencao: string; local: string; equipamentos: string; periodo: string; razao: string };
  equipa: { elaborado: Pessoa; revisto: Pessoa; aprovado: Pessoa; consulta: Pessoa };
  metodo: { dataAvaliacao: string; atualizadoEm: string; proximaRevisao: string };
  riscos: LinhaRisco[];
  /** completa — reavaliação e verificação da eficácia (Lei n.º 102/2009, art. 15.º) */
  reavaliacao: { reavaliadoPor: string; verificadoPor: string; aprovadoPor: string; data: string; consulta: string; proxima: string; observacoes: string };
  conclusoes: string;
  /** registo de revisões do documento (completa) */
  revisoes?: { revisao: string; data: string; descricao: string }[];
  criadoEm: number;
  atualizadoEm: number;
}
