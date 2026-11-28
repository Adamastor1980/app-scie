/**
 * Módulo «Fichas de procedimentos de segurança» (FPS) — independente dos módulos SCIE e Avaliação de riscos.
 * Base legal: Decreto-Lei n.º 273/2003, de 29 de outubro (estaleiros temporários ou móveis), art. 14.º — texto original.
 */
export interface Interveniente { nome: string; funcao: string; contacto: string }
export interface Subempreiteiro { id: string; nome: string; atividade: string; contacto: string }
export interface TrabalhoFPS {
  id: string;
  descricao: string;
  /** alíneas do art. 7.º que este trabalho comporta */
  riscosEspeciais: string[];
  riscos: string;
  medidas: { id: string; texto: string }[];
  epi: string;
}
export interface FPS {
  id: string;
  titulo: string; codigo: string; revisao: string; data: string;
  /** enquadramento (art. 2.º, 5.º n.º 4, 7.º, 14.º n.º 1, 15.º n.º 1) */
  tipoTrabalho: string[];            // alíneas do art. 2.º n.º 2
  sujeitaProjeto?: boolean;
  duracaoDias?: number; maxSimultaneos?: number; diasTrabalho?: number;
  riscosEspeciais?: string[];        // alíneas do art. 7.º (undefined = por responder; [] = nenhum)
  /** a) identificação, caracterização e duração da obra */
  obra: { designacao: string; localizacao: string; coordenadas: string; caracterizacao: string; inicio: string; fim: string };
  /** b) intervenientes */
  donoObra: Interveniente; executante: Interveniente; diretorTecnico: Interveniente; tecnicoSST: Interveniente; coordenadorObra: Interveniente;
  subempreiteiros: Subempreiteiro[];
  /** c) medidas de prevenção por trabalho */
  trabalhos: TrabalhoFPS[];
  /** d) condicionantes do estaleiro e da área envolvente */
  condicionantes: { terreno: string; redes: string; atividades: string; outras: string };
  /** e) emergência */
  emergencia: { contactos: { id: string; nome: string; telefone: string }[]; pontoEncontro: string; procedimentos: string };
  /** art. 14.º n.º 3 — análise do coordenador de segurança em obra */
  analiseCSO: { nome: string; data: string; observacoes: string };
  revisoes: { revisao: string; data: string; descricao: string }[];
  criadoEm: number; atualizadoEm: number;
}
