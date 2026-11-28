/**
 * Grupos de trabalhadores particularmente sensíveis (lista das aulas de Avaliação e Controlo de Riscos, Prof. Alberto Silveira).
 * Base: Lei n.º 102/2009 (texto original) — art. 18.º n.º 1 a) (grupos sujeitos a riscos especiais); arts. 50.º a 60.º (grávida, puérpera, lactante);
 * arts. 61.º a 72.º (menor); art. 19.º n.º 2 a) e n.º 6 (recém-admitidos e contratados a termo).
 */
export const GRUPOS_SENSIVEIS: { id: string; nome: string; nota?: string }[] = [
  { id: 'menores', nome: 'Menores (menos de 18 anos)', nota: 'Há atividades, agentes e processos proibidos ou condicionados a menores (Lei n.º 102/2009, arts. 61.º a 72.º). Confirme cada risco.' },
  { id: 'gravidas', nome: 'Grávidas', nota: 'Há atividades e agentes proibidos ou condicionados à trabalhadora grávida (arts. 50.º a 60.º). Confirme cada risco.' },
  { id: 'lactantes', nome: 'Puérperas ou lactantes', nota: 'Há agentes proibidos ou condicionados à trabalhadora puérpera ou lactante (arts. 50.º a 60.º). Confirme cada risco.' },
  { id: 'jovens-idosos', nome: 'Jovens ou idosos' },
  { id: 'novos', nome: 'Recém-admitidos, estagiários ou aprendizes', nota: 'Informação obrigatória na admissão (art. 19.º n.º 2 a)) e formação adequada (art. 20.º).' },
  { id: 'temporarios', nome: 'Temporários ou contratados a termo', nota: 'A admissão é comunicada ao serviço de SST (art. 19.º n.º 6).' },
  { id: 'isolados', nome: 'Trabalhadores isolados' },
  { id: 'deficiencia', nome: 'Com deficiência, doença ou reservas de aptidão' },
];
