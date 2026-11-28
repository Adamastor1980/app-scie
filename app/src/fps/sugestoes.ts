/**
 * Medidas de prevenção SUGERIDAS por risco especial do art. 7.º (boas práticas — não são texto legal).
 * A legislação específica de cada risco (ex.: trabalhos em altura, equipamentos, eletricidade) deve ser confirmada pelo técnico, que valida e assina.
 */
export const MEDIDAS_ART7: Record<string, string[]> = {
  a: ['Proteção coletiva contra quedas (guarda-corpos, redes, cobertura de aberturas e de superfícies frágeis)', 'Meios de acesso adequados e verificados (plataforma elevatória, andaime, escada fixada)', 'Linha de vida e arnês de segurança quando a proteção coletiva não for possível', 'Escoramento ou entivação de valas e taludes; afastamento de cargas do bordo', 'Delimitação e sinalização da zona inferior de trabalho', 'Formação em trabalhos em altura e plano de resgate'],
  b: ['Fichas de dados de segurança dos produtos disponíveis no estaleiro', 'Ventilação ou aspiração; substituição por produtos menos perigosos', 'Proteção respiratória, luvas e óculos adequados ao produto', 'Higiene: lavagem antes de comer e no fim do trabalho'],
  c: ['Delimitação das zonas controladas ou vigiadas e dosimetria, conforme a legislação de proteção radiológica'],
  d: ['Pedido de desligação ou proteção da linha ao operador da rede', 'Distâncias de segurança às linhas e limitação do alcance dos equipamentos', 'Vigia durante a movimentação de equipamentos junto das linhas'],
  e: ['Sinalização temporária e balizamento da via', 'Coletes de alta visibilidade', 'Sinaleiro e coordenação com a entidade gestora da via'],
  f: ['Coletes salva-vidas e boia com cabo junto do posto', 'Nunca trabalhar sozinho junto de água', 'Mergulho apenas por pessoal habilitado e com plano de mergulho'],
  g: ['Medição da atmosfera antes e durante o trabalho', 'Ventilação forçada', 'Vigia no exterior e plano de resgate'],
  h: ['Explosivos manuseados só por operador habilitado', 'Equipamentos adequados a atmosferas explosivas; proibição de chamas e de fumar', 'Autorização de trabalho a quente'],
  i: ['Plano de montagem e de movimentação das cargas', 'Equipamentos de elevação verificados e operador habilitado', 'Proibir a permanência sob cargas suspensas; cabos-guia'],
  j: ['Procedimento específico definido pelo técnico para o risco grave identificado'],
};
export const EPI_BASE = 'Capacete, calçado de proteção, colete de alta visibilidade e luvas de proteção mecânica.';
