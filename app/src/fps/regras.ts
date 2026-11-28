import type { FPS } from './tipos';

/** Art. 2.º n.º 2 — trabalhos abrangidos (texto original) */
export const TRABALHOS_ART2: [string, string][] = [
  ['a', 'Escavação'], ['b', 'Terraplenagem'],
  ['c', 'Construção, ampliação, alteração, reparação, restauro, conservação e limpeza de edifícios'],
  ['d', 'Montagem e desmontagem de elementos prefabricados, andaimes, gruas e outros aparelhos elevatórios'],
  ['e', 'Demolição'],
  ['f', 'Construção, manutenção, conservação e alteração de vias de comunicação e suas infraestruturas, obras fluviais ou marítimas, túneis, obras de arte, barragens, silos e chaminés industriais'],
  ['g', 'Trabalhos especializados no domínio da água (irrigação, drenagem, abastecimento, águas residuais, saneamento)'],
  ['h', 'Intervenções nas infraestruturas de transporte e distribuição de eletricidade, gás e telecomunicações'],
  ['i', 'Montagem e desmontagem de instalações técnicas e de equipamentos diversos'],
  ['j', 'Isolamentos e impermeabilizações'],
];

/** Art. 7.º — riscos especiais (texto original) */
export const RISCOS_ART7: [string, string][] = [
  ['a', 'Risco de soterramento, de afundamento ou de queda em altura, particularmente agravados pela natureza da atividade ou dos meios utilizados, ou do meio envolvente do posto, ou da situação de trabalho, ou do estaleiro'],
  ['b', 'Riscos químicos ou biológicos suscetíveis de causar doenças profissionais'],
  ['c', 'Radiações ionizantes, quando for obrigatória a designação de zonas controladas ou vigiadas'],
  ['d', 'Trabalhos na proximidade de linhas elétricas de média e alta tensão'],
  ['e', 'Trabalhos em vias ferroviárias ou rodoviárias em utilização, ou na sua proximidade'],
  ['f', 'Mergulho com aparelhagem ou trabalhos que impliquem risco de afogamento'],
  ['g', 'Trabalhos em poços, túneis, galerias ou caixões de ar comprimido'],
  ['h', 'Utilização de explosivos, ou trabalhos suscetíveis de originar riscos derivados de atmosferas explosivas'],
  ['i', 'Montagem e desmontagem de elementos prefabricados ou outros, cuja forma, dimensão ou peso exponham os trabalhadores a risco grave'],
  ['j', 'Trabalhos que o dono da obra, o autor do projeto ou um coordenador de segurança fundamentadamente considere suscetíveis de constituir risco grave'],
];
export const textoArt7 = (l: string) => RISCOS_ART7.find((x) => x[0] === l)?.[1] ?? '';

/** Art. 15.º n.º 1 — comunicação prévia: > 30 dias e > 20 trabalhadores em simultâneo, ou > 500 dias de trabalho (soma) */
export function comunicacaoPrevia(f: Pick<FPS, 'duracaoDias' | 'maxSimultaneos' | 'diasTrabalho'>): boolean | undefined {
  const { duracaoDias: d, maxSimultaneos: m } = f;
  const soma = f.diasTrabalho ?? (d !== undefined && m !== undefined ? d * m : undefined);
  if (d === undefined || m === undefined) return soma !== undefined && soma > 500 ? true : undefined;
  return (d > 30 && m > 20) || (soma ?? 0) > 500;
}

export type Enquadramento = { estado: 'por_responder' | 'fora' | 'pss' | 'fps' | 'nenhum'; texto: string };

/** Art. 2.º, 5.º n.º 4 e 14.º n.º 1: o que a obra exige */
export function enquadramento(f: FPS): Enquadramento {
  if (!f.tipoTrabalho.length) return { estado: 'por_responder', texto: 'Indique o tipo de trabalho (art. 2.º n.º 2).' };
  if (f.tipoTrabalho.includes('nenhum')) return { estado: 'fora', texto: 'Os trabalhos não são de construção de edifícios nem de engenharia civil: o DL 273/2003 não se aplica (art. 2.º). Aplica-se o regime geral (Lei n.º 102/2009) — use a Avaliação de riscos.' };
  if (f.riscosEspeciais === undefined || f.sujeitaProjeto === undefined) return { estado: 'por_responder', texto: 'Responda se a obra está sujeita a projeto e se há riscos especiais (art. 7.º).' };
  const cp = comunicacaoPrevia(f);
  const re = f.riscosEspeciais.length > 0;
  if (f.sujeitaProjeto && (re || cp)) return { estado: 'pss', texto: `Obra sujeita a projeto${re ? ' com riscos especiais (art. 7.º)' : ''}${cp ? `${re ? ' e' : ''} com comunicação prévia (art. 15.º)` : ''}: é obrigatório o plano de segurança e saúde (art. 5.º n.º 4), não a FPS.` };
  if (re) return { estado: 'fps', texto: `O plano de segurança e saúde não é obrigatório (art. 5.º n.º 4)${f.sujeitaProjeto ? '' : ' porque a obra não está sujeita a projeto'}, mas há trabalhos com riscos especiais (art. 7.º ${f.riscosEspeciais.map((x) => `${x})`).join(', ')}): a entidade executante elabora fichas de procedimentos de segurança (art. 14.º n.º 1).` };
  if (cp === undefined && !f.sujeitaProjeto) return { estado: 'nenhum', texto: 'Sem riscos especiais e sem projeto: nem PSS nem FPS são obrigatórios. Mantém-se a avaliação de riscos do regime geral.' };
  return { estado: 'nenhum', texto: 'Sem riscos especiais: a FPS não é obrigatória (art. 14.º n.º 1)' + (cp ? '. Atenção: a obra exige comunicação prévia à ACT (art. 15.º).' : '.') };
}

/** Campos obrigatórios por preencher (art. 14.º n.º 2) */
export function faltaFPS(f: FPS): [string, string][] {
  const r: [string, string][] = [];
  if (!f.obra.designacao.trim()) r.push(['Identificação da obra', 'art. 14.º n.º 2 a)']);
  if (!f.obra.localizacao.trim()) r.push(['Localização', 'art. 14.º n.º 2 a)']);
  if (!f.obra.caracterizacao.trim()) r.push(['Caracterização da obra', 'art. 14.º n.º 2 a)']);
  if (!f.obra.inicio && f.duracaoDias === undefined) r.push(['Duração da obra', 'datas ou n.º de dias — art. 14.º n.º 2 a)']);
  if (!f.donoObra.nome.trim()) r.push(['Dono da obra', 'interveniente relevante — art. 14.º n.º 2 b)']);
  if (!f.executante.nome.trim()) r.push(['Entidade executante', 'quem elabora a FPS — art. 14.º n.º 1 e n.º 2 b)']);
  if (f.subempreiteiros.length && !f.coordenadorObra.nome.trim()) r.push(['Coordenador de segurança em obra', 'obrigatório com duas ou mais empresas (art. 9.º n.º 2)']);
  if (!f.trabalhos.length) r.push(['Trabalhos e medidas de prevenção', 'art. 14.º n.º 2 c)']);
  f.trabalhos.forEach((t, i) => {
    if (!t.descricao.trim()) r.push([`Trabalho ${i + 1}: descrição`, 'art. 14.º n.º 2 c)']);
    if (!t.medidas.some((m) => m.texto.trim())) r.push([`Trabalho ${i + 1}: medidas de prevenção`, 'art. 14.º n.º 2 c)']);
  });
  if (!Object.values(f.condicionantes).some((v) => v.trim())) r.push(['Condicionantes do estaleiro', 'terreno, redes técnicas, atividades no local — art. 14.º n.º 2 d)']);
  if (!f.emergencia.procedimentos.trim()) r.push(['Procedimentos de emergência', 'art. 14.º n.º 2 e)']);
  if (!f.emergencia.contactos.some((c) => c.telefone.trim())) r.push(['Contactos de emergência', 'art. 14.º n.º 2 e)']);
  return r;
}
