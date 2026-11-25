import type { Projeto } from '../data/types';
import { contexto, gerarMedidas } from './medidas';
import { faltaCaracterizacao, faltaEdificio, faltaParaMedidas } from './calc';
import { progresso } from './verificacao';

/**
 * Percurso de elaboração das medidas de autoproteção — sequência de trabalho do técnico.
 * A ordem segue a lei: as medidas exigíveis (quadro XXXIX) dependem só da UT, da categoria e dos
 * locais D/E, por isso vêm antes da verificação no local; esta alimenta as medidas compensatórias.
 */
export interface Passo {
  n: number;
  titulo: string;
  oQue: string;
  base: string;
  /** destino na app, relativo ao projeto ('' = painel) */
  ir?: string;
}

export const PASSOS: Passo[] = [
  { n: 1, titulo: 'Recolha de informação e documentação', ir: '/dados',
    oQue: 'Identificação do edifício, do cliente e da entidade exploradora; plantas; projeto de SCIE aprovado e medidas de autoproteção anteriores, se existirem (sem mudança de categoria ou de UT, as alterações são aprovadas pelo RS e registadas, sem nova submissão).',
    base: 'RJ-SCIE, arts. 6.º e 22.º n.os 2 e 3' },
  { n: 2, titulo: 'Identificação das utilizações-tipo', ir: '',
    oQue: 'Uma UT por cada uso; espaços integrados só dentro dos limites do art. 8.º n.º 3; o mesmo uso no mesmo edifício é uma só UT.',
    base: 'RJ-SCIE, art. 8.º' },
  { n: 3, titulo: 'Identificação e classificação dos locais de risco',
    oQue: 'Cada espaço com o seu local de risco (A a F), pelo efetivo, pelo efetivo de público e pela atividade.',
    base: 'RJ-SCIE, arts. 10.º e 11.º' },
  { n: 4, titulo: 'Efetivo e categoria de risco',
    oQue: 'Efetivo por espaço e por UT; fatores de risco completos; categoria de cada UT pelo anexo III.',
    base: 'RT-SCIE, art. 51.º; RJ-SCIE, arts. 12.º e 13.º, anexo III' },
  { n: 5, titulo: 'Medidas de autoproteção exigíveis', ir: '/autoprotecao',
    oQue: 'Resultam diretamente da UT, da categoria e dos locais D ou E: registos, procedimentos ou plano de prevenção, procedimentos de emergência ou PEI, formação e simulacros.',
    base: 'RT-SCIE, art. 198.º, quadro XXXIX; RJ-SCIE, art. 22.º n.º 1' },
  { n: 6, titulo: 'Levantamento e verificação no local',
    oQue: 'Lista dos requisitos aplicáveis a cada UT: Cumpre, Não cumpre, N.A. ou Por verificar, com observações e evidências. As não conformidades passam ao relatório e às MAP como insuficiências a compensar.',
    base: 'RJ-SCIE, anexo IV; RT-SCIE, art. 193.º n.os 3 e 4' },
  { n: 7, titulo: 'Elaboração dos documentos das MAP', ir: '/map',
    oQue: 'Organização da segurança (RS, delegado, equipa), registos, procedimentos ou plano de prevenção, procedimentos ou plano de emergência, instruções, formação, simulacros e medidas compensatórias.',
    base: 'RT-SCIE, arts. 193.º a 207.º' },
  { n: 8, titulo: 'Relatório técnico final', ir: '/relatorio',
    oQue: 'Caracterização, classificação, efetivo, carga de incêndio, condições exigíveis, análise regulamentar e plano de medidas corretivas.',
    base: 'RJ-SCIE, anexo IV' },
  { n: 9, titulo: 'Validação e entrega do dossier ao cliente',
    oQue: 'Rever com o RS; entregar o que tem de pôr em prática: delegado e equipa, formação no prazo de 60 dias, simulacros, registos e plantas de emergência. O parecer fica condicionado à implementação efetiva.',
    base: 'RT-SCIE, arts. 194.º, 196.º, 200.º, 206.º e 207.º' },
  { n: 10, titulo: 'Submissão à entidade competente',
    oQue: 'Por via eletrónica, à ANEPC (ou ao município na 1.ª categoria): até 30 dias antes da entrada em funcionamento em obra nova, alteração, ampliação ou mudança de uso; nos edifícios existentes, de imediato (o prazo de um ano já terminou). Nova submissão se mudar a categoria ou a UT. Excluídas as UT I das 1.ª e 2.ª categorias.',
    base: 'RJ-SCIE, arts. 21.º n.os 2 e 3, 22.º n.os 1 e 2 e 34.º n.º 2' },
];

export type EstadoPasso = 'feito' | 'falta' | 'na';
export interface EstadoP { estado: EstadoPasso; nota: string; ir?: string }

/** Estado de cada passo, calculado a partir dos dados do projeto (os passos 9 e 10 são marcados pelo técnico). */
export function estadoPercurso(p: Projeto): Record<number, EstadoP> {
  const linhas = p.edificios.flatMap((ed) => ed.uts.map((ut) => ({ ed, ut, ctx: contexto(ed, ut) })));
  const temUT = linhas.length > 0;
  const primeira = linhas[0];
  const rotaUT = (l: (typeof linhas)[number] | undefined, passo: string) => (l ? `/e/${l.ed.id}/u/${l.ut.id}/${passo}` : '');
  const out: Record<number, EstadoP> = {};

  const caracterizado = p.edificios.length > 0 && p.edificios.every((e) => !faltaCaracterizacao(e).length);
  const ident = !!(p.nome && p.cliente && p.morada);
  out[1] = { estado: ident && caracterizado ? 'feito' : 'falta', nota: !ident ? 'Faltam dados do projeto (nome, cliente, morada)' : !caracterizado ? 'Falta caracterizar o edifício (altura, pisos)' : 'Projeto e edifícios caracterizados',
    ir: !ident ? '/dados' : !caracterizado ? `/e/${p.edificios.find((e) => faltaCaracterizacao(e).length)?.id}` : '/dados' };

  const repetida = p.edificios.some((e) => new Set(e.uts.map((u) => u.tipo)).size !== e.uts.length);
  out[2] = { estado: temUT && !repetida ? 'feito' : 'falta', nota: !temUT ? 'Nenhuma UT' : repetida ? 'UT do mesmo tipo repetida no mesmo edifício' : `${linhas.length} ${linhas.length === 1 ? 'UT' : 'UT'}`, ir: '' };

  const semEspacos = linhas.filter((l) => l.ut.tipo >= 3 && l.ut.tipo <= 11 && l.ut.espacos.length === 0);
  out[3] = { estado: !temUT ? 'falta' : semEspacos.length ? 'falta' : 'feito', nota: !temUT ? 'Sem UT' : semEspacos.length ? `${semEspacos.length} UT sem espaços registados` : `${linhas.reduce((s, l) => s + l.ut.espacos.length, 0)} espaços classificados`, ir: rotaUT(semEspacos[0] ?? primeira, 'efetivo') };

  const semCat = linhas.filter((l) => l.ctx.cls.falta.length);
  out[4] = { estado: temUT && !semCat.length ? 'feito' : 'falta', nota: !temUT ? 'Sem UT' : semCat.length ? `${semCat.length} UT com categoria por atribuir` : 'Categoria atribuída em todas as UT', ir: rotaUT(semCat[0] ?? primeira, 'fatores') };

  out[5] = { estado: out[4].estado, nota: out[4].estado === 'feito' ? 'Definidas pelo quadro XXXIX' : 'Dependem da categoria (passo 4)', ir: '/autoprotecao' };

  let total = 0, marcadas = 0, pv = 0;
  let pendente: (typeof linhas)[number] | undefined;
  for (const l of linhas) {
    if (l.ctx.cls.falta.length || faltaParaMedidas(l.ut).length || faltaEdificio(l.ed).length) { pendente ??= l; continue; }
    const g = progresso(l.ut, gerarMedidas(l.ctx));
    total += g.total; marcadas += g.marcadas; pv += g.porVerificar;
    if (!pendente && (g.marcadas < g.total)) pendente = l;
  }
  out[6] = { estado: total > 0 && marcadas === total && pv === 0 && out[4].estado === 'feito' ? 'feito' : 'falta',
    nota: total ? `${marcadas} de ${total} verificadas${pv ? ` · ${pv} por verificar` : ''}` : 'Sem medidas (falta a categoria)', ir: rotaUT(pendente ?? primeira, 'medidas') };

  const ap = p.autoprotecao;
  const org = !!(ap?.rs.nome && ap?.delegado.nome);
  out[7] = { estado: org ? 'feito' : 'falta', nota: org ? 'RS e delegado indicados' : 'Faltam o responsável e o delegado de segurança', ir: org ? '/map' : '/autoprotecao' };

  const base = [1, 2, 3, 4, 6].every((n) => out[n].estado === 'feito');
  out[8] = { estado: base ? 'feito' : 'falta', nota: base ? 'Dados completos para o relatório' : 'Conclua os passos anteriores', ir: '/relatorio' };

  out[9] = { estado: p.percurso?.entregue ? 'feito' : 'falta', nota: p.percurso?.entregue ? `Entregue em ${dataPt(p.percurso.entregue)}` : 'Marcar quando entregue' };

  const isento = temUT && linhas.every((l) => l.ut.tipo === 1 && l.ctx.cls.cat <= 2);
  out[10] = isento ? { estado: 'na', nota: 'UT I das 1.ª e 2.ª categorias: não exigível (RJ-SCIE, art. 22.º n.º 1)' }
    : { estado: p.percurso?.submetido ? 'feito' : 'falta', nota: p.percurso?.submetido ? `Submetido em ${dataPt(p.percurso.submetido)}${p.percurso.refSubmissao ? ` · ${p.percurso.refSubmissao}` : ''}` : 'Marcar quando submetido' };
  return out;
}

const dataPt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('pt-PT');
