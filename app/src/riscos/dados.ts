import type { AvaliacaoRiscos, LinhaRisco, MedidaPlano, VersaoSSARA } from './tipos';

export const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const p = () => ({ nome: '', funcao: '', data: '' });

export const novaMedida = (descricao = '', tipo?: MedidaPlano['tipo']): MedidaPlano => ({ id: rid(), descricao, tipo, responsavel: '', prazo: '', estado: 'por_iniciar', conclusao: '', evidencia: '', observacoes: '' });
export const novaLinha = (): LinhaRisco => ({
  id: rid(), area: '', atividade: '', perigo: '', risco: '', existentes: '', medidas: [], responsavel: '', dataAvaliacao: '', prazo: '', avaliador: '',
  implementadas: '', dataReav: '', verificadoPor: '', acoesAdicionais: '',
});
export const novaAvaliacao = (versao: VersaoSSARA): AvaliacaoRiscos => ({
  id: rid(), versao, titulo: 'Avaliação de riscos profissionais',
  codigo: '', revisao: '00', dataEmissao: new Date().toISOString().slice(0, 10), classificacao: 'Uso interno / Confidencial',
  entidade: { designacao: '', nipc: '', morada: '', cae: '', responsavel: '', contacto: '', tecnicoSST: '' },
  executante: { designacao: '', nipc: '', morada: '', habilitacoes: '', responsavelTecnico: '', servicoSST: '', contacto: '' },
  trabalho: { atividade: '', tipoIntervencao: '', local: '', equipamentos: '', periodo: '', razao: '' },
  equipa: { elaborado: p(), revisto: p(), aprovado: p(), consulta: p() },
  metodo: { dataAvaliacao: new Date().toISOString().slice(0, 10), atualizadoEm: '', proximaRevisao: '' },
  riscos: [],
  reavaliacao: { reavaliadoPor: '', verificadoPor: '', aprovadoPor: '', data: '', consulta: '', proxima: '', observacoes: '' },
  conclusoes: '', criadoEm: Date.now(), atualizadoEm: Date.now(),
});
