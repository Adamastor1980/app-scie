import { Fragment, useState } from 'react';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useRiscos } from '../store';
import { useStore } from '../../store';
import { go } from '../../router';
import type { Projeto } from '../../data/types';
import { H1, H2, P, Sheet, useDocumento } from '../../pages/doc';
import { EFICACIA, ESTADO_MEDIDA, LIMITE_ACEITAVEL, NC, ND, NE, NIVEIS, TIPO_MEDIDA, calcular, faltaLinha, painel } from '../motor';
import type { AvaliacaoRiscos } from '../tipos';
import { ChipNivel, dataLonga, dataPt, faltaIdent, refR, textoNP } from './comum';
import { VERSAO_APP } from '../../versao';

/** Artigos da Lei n.º 102/2009 em que assenta a avaliação (texto original, DR 1.ª série n.º 176, 10-09-2009) */
const LEGISLACAO: [string, string][] = [
  ['Art. 5.º', 'Princípios gerais: a prevenção dos riscos profissionais assenta numa correta e permanente avaliação de riscos'],
  ['Art. 15.º n.º 2', 'Obrigações gerais do empregador — princípios gerais de prevenção: evitar os riscos, planificar a prevenção integrando a avaliação dos riscos, combater os riscos na origem, adaptar o trabalho ao homem, substituir o que é perigoso, dar prioridade à proteção coletiva sobre a individual, dar instruções adequadas'],
  ['Art. 15.º n.º 3', 'As medidas de prevenção devem corresponder ao resultado da avaliação dos riscos, para obter níveis eficazes de proteção'],
  ['Art. 18.º', 'Consulta escrita dos representantes dos trabalhadores (ou dos trabalhadores) sobre a avaliação dos riscos e as medidas, com registo em livro próprio'],
  ['Art. 19.º', 'Informação dos trabalhadores sobre os riscos e as medidas de proteção e prevenção'],
  ['Art. 20.º', 'Formação adequada dos trabalhadores, tendo em atenção o posto de trabalho e as atividades de risco elevado'],
  ['Art. 98.º', 'O serviço de SST procede à avaliação dos riscos e elabora os relatórios (n.º 1 b)), mantém atualizados os resultados (n.º 2 a)) e a documentação fica à disposição da inspeção durante cinco anos (n.º 5)'],
  ['Art. 100.º', 'As atividades técnicas de segurança no trabalho são exercidas por técnicos superiores ou técnicos de SHT certificados'],
];
const ABREV: [string, string][] = [
  ['SST', 'Segurança e saúde no trabalho'], ['SSARA', 'Sistema simplificado de avaliação de riscos de acidente'], ['NTP', 'Nota técnica de prevenção (INSST, Espanha)'],
  ['ND', 'Nível de deficiência'], ['NE', 'Nível de exposição'], ['NP', 'Nível de probabilidade (ND × NE)'], ['NC', 'Nível de consequência'],
  ['NR', 'Nível de risco (NP × NC)'], ["NR'", 'Nível de risco residual, após as medidas'], ['EPI', 'Equipamento de proteção individual'],
];

export default function Relatorio({ id }: { id: string }) {
  const a = useRiscos((s) => s.avaliacoes.find((x) => x.id === id));
  if (!a) return <main className="mx-auto max-w-[720px] px-4 py-10"><p className="mb-4 font-display text-[20px] font-bold">Avaliação não encontrada.</p><button className="btn" onClick={() => go('/riscos')}>Voltar às avaliações</button></main>;
  return <Documento a={a} />;
}

function Documento({ a }: { a: AvaliacaoRiscos }) {
  const empresa = useStore((s) => s.empresaPadrao);
  const autor = useStore((s) => s.autorPadrao);
  const c = a.versao === 'completa';
  const DOC = a.titulo || 'Avaliação de riscos profissionais';
  const nomeDoc = [a.entidade.designacao, a.trabalho.local].filter(Boolean).join(' — ') || 'Avaliação de riscos';
  // o cabeçalho, o rodapé e o PDF são os mesmos dos outros documentos (aspeto visual comum)
  const pseudo = { empresa: { nome: empresa?.nome || a.executante.designacao }, autor: { nome: a.equipa.elaborado.nome || autor?.nome || '' }, referencia: a.codigo, nome: nomeDoc, versao: a.revisao || '00' } as unknown as Projeto;
  const { zoom, aGerar, imprimir } = useDocumento(pseudo, 'Avaliação de riscos', 'ar-folhas');
  const [comAss, setComAss] = useState(true);
  const pn = painel(a);
  const linhas = a.riscos.map((l, i) => ({ l, i, r: calcular(l) }));
  const faltas = [...faltaIdent(a).map((f) => f[0]), ...linhas.flatMap(({ l, i }) => faltaLinha(l, a.versao).map((f) => `${refR(i)}: ${f[0]}`))];
  const assinaturaAutor = autor?.assinatura && autor.nome && a.equipa.elaborado.nome.trim() === autor.nome.trim() ? autor.assinatura : undefined;
  const medidas = linhas.filter((x) => x.l.medidas.some((m) => m.descricao.trim())).sort((x, y) => (y.r.nr ?? 0) - (x.r.nr ?? 0));
  const custoTotal = a.riscos.flatMap((l) => l.medidas).reduce((s, m) => s + (m.custo ?? 0), 0);
  const CAPS = ['Apresentação da empresa', 'Introdução e enquadramento legal', 'Identificação', 'Metodologia', 'Resultados da avaliação', 'Fichas de risco', 'Plano de ação', ...(c ? ['Reavaliação e eficácia das medidas'] : []), 'Conclusões', 'Termo de responsabilidade', 'Anexos'];
  let n = 0; const S = () => String(++n);
  const linhaT = (rot: string, v?: string | number) => <tr key={rot}><td className="w-[38%] font-semibold">{rot}</td><td>{v === undefined || v === '' ? '—' : v}</td></tr>;

  return (
    <div id="ar-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button className="btn-ghost" onClick={() => go(`/riscos/a/${a.id}`)}><ArrowLeft size={15} /> Editar</button>
          <div className="mr-auto">
            <p className="label">Documento</p>
            <p className="font-display text-[17px] font-bold">{DOC}</p>
            <p className={`text-[12px] ${faltas.length ? 'text-alerta' : 'text-ok'}`}>{faltas.length ? `Falta preencher: ${faltas.length} ${faltas.length === 1 ? 'dado' : 'dados'} (ver anexo)` : 'Dados completos'}</p>
          </div>
          {autor?.assinatura ? (
            <label className="flex h-10 cursor-pointer items-center gap-2 border border-ink bg-white px-3 text-[13px] font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#14233A]" checked={comAss} onChange={(e) => setComAss(e.target.checked)} /> Com assinatura</label>
          ) : <a href="#/empresa" className="text-[12px] font-semibold text-ink-3 hover:text-fire-ink hover:underline">Sem assinatura guardada — assinar em «A minha empresa»</a>}
          <button className="btn-fire h-11 px-5" disabled={!!aGerar} onClick={() => imprimir()}>{aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}</button>
        </div>
      </div>

      {/* Capa */}
      <Sheet className="flex flex-col">
        <div className="flex items-start justify-between">
          {empresa?.logo ? <img src={empresa.logo} className="h-[80px] w-[80px] object-contain" /> : <span className="font-display text-[20px] font-extrabold">{empresa?.nome || a.executante.designacao || 'Empresa'}</span>}
          <span className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-wider text-ink-3">{a.codigo || 'S/ código'}<br />Revisão {a.revisao || '00'}<br />{dataLonga(a.metodo.dataAvaliacao)}</span>
        </div>
        <div className="mt-[52mm]">
          <div className="mb-6 h-[6px] w-24 bg-fire" />
          <p className="label mb-3">Segurança e saúde no trabalho · Lei n.º 102/2009 · Método SSARA ({c ? 'versão completa' : 'versão light'})</p>
          <h1 className="h-display text-[44px]">{DOC}</h1>
          <p className="mt-4 font-display text-[22px] font-bold leading-tight text-ink-2">{a.entidade.designacao || 'Entidade por indicar'}</p>
          <p className="mt-2 text-[13px] text-ink-3">{[a.trabalho.local, a.trabalho.atividade].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="mt-auto border-t-[3px] border-ink pt-5">
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-[11.5px]">
            <div><p className="label">Entidade</p><p className="font-semibold">{a.entidade.designacao || '—'}</p><p className="text-ink-3">{a.entidade.morada}</p></div>
            <div><p className="label">Elaborado por</p><p className="font-semibold">{a.equipa.elaborado.nome || '—'}</p><p className="text-ink-3">{a.equipa.elaborado.funcao}</p>{(empresa?.nome || a.executante.designacao) && <p className="text-ink-3">{empresa?.nome || a.executante.designacao}</p>}</div>
            <div><p className="label">Data</p><p className="font-semibold">{dataLonga(a.metodo.dataAvaliacao) || '—'}</p><p className="text-ink-3">Revisão {a.revisao || '00'}{a.classificacao && c ? ` · ${a.classificacao}` : ''}</p></div>
          </div>
        </div>
      </Sheet>

      <Sheet className="page-break">
        <H1 n="—">Ficha técnica</H1>
        <table className="tbl mb-10"><tbody>
          {linhaT('Documento', DOC)}
          {linhaT('Código / revisão', `${a.codigo || '—'} · rev. ${a.revisao || '00'}`)}
          {linhaT('Entidade avaliada', [a.entidade.designacao, a.entidade.nipc && `NIPC ${a.entidade.nipc}`].filter(Boolean).join(' · '))}
          {linhaT('Local avaliado', a.trabalho.local)}
          {linhaT('Atividade', a.trabalho.atividade)}
          {linhaT('Elaborado por', [a.equipa.elaborado.nome, a.equipa.elaborado.funcao].filter(Boolean).join(', '))}
          {linhaT('Entidade executante', [empresa?.nome || a.executante.designacao, (empresa?.nif || a.executante.nipc) && `NIF ${empresa?.nif || a.executante.nipc}`].filter(Boolean).join(' · '))}
          {linhaT('Data da avaliação', dataLonga(a.metodo.dataAvaliacao))}
          {linhaT('Próxima revisão', a.metodo.proximaRevisao ? dataLonga(a.metodo.proximaRevisao) : 'Sempre que se alterem as condições de trabalho')}
          {linhaT('Método', 'SSARA — NTP 330 do INSST (NR = ND × NE × NC)')}
          {linhaT('Base legal', 'Lei n.º 102/2009, de 10 de setembro (regime jurídico da promoção da segurança e saúde no trabalho) — citações segundo o texto original publicado')}
          {linhaT('Ferramenta', `Cautela — Avaliação de riscos, versão de ${VERSAO_APP}`)}
        </tbody></table>
        <H1 n="—">Índice</H1>
        <ol className="space-y-1.5 text-[12.5px]">{CAPS.map((t, i) => <li key={t} className="flex items-baseline gap-3 border-b border-dotted border-ink-4 pb-1"><span className="w-6 font-mono text-fire-ink">{i + 1}</span>{t}</li>)}</ol>
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Apresentação da empresa</H1>
        <div className="mb-6 grid grid-cols-[1fr_190px] gap-6">
          <div className="whitespace-pre-line text-[12px] leading-[1.65] text-ink-2">{empresa?.apresentacao || 'Texto de apresentação da empresa por preencher em «A minha empresa».'}</div>
          <div className="border-l-[3px] border-fire pl-4 text-[11px] leading-relaxed">
            {empresa?.logo && <img src={empresa.logo} className="mb-3 h-[64px] w-[64px] object-contain" />}
            <p className="font-semibold">{empresa?.nome || a.executante.designacao}</p>
            <p className="text-ink-3">{empresa?.morada || a.executante.morada}</p>
            {empresa?.nif && <p>NIF {empresa.nif}</p>}
            {empresa?.telefone && <p>{empresa.telefone}</p>}
            {empresa?.email && <p>{empresa.email}</p>}
            {empresa?.website && <p>{empresa.website}</p>}
          </div>
        </div>

        <H1 n={S()}>Introdução e enquadramento legal</H1>
        <H2 n={`${n}.1`}>Objetivo</H2>
        <P>O presente relatório apresenta a avaliação dos riscos profissionais de {a.trabalho.local ? <b>{a.trabalho.local}</b> : 'o local indicado'}{a.entidade.designacao ? <>, de {a.entidade.designacao}</> : null}{a.trabalho.atividade ? <>, na atividade «{a.trabalho.atividade}»</> : null}: identifica os perigos, estima e valora os riscos, propõe as medidas de prevenção e proteção pela ordem dos princípios gerais de prevenção e define o plano de ação para as implementar.</P>
        {c && a.trabalho.razao && <><H2 n={`${n}.2`}>Razão da avaliação</H2><P>{a.trabalho.razao}{a.trabalho.tipoIntervencao ? ` (${a.trabalho.tipoIntervencao})` : ''}.</P></>}
        <H2 n={`${n}.${c && a.trabalho.razao ? 3 : 2}`}>Enquadramento legal</H2>
        <P>O empregador deve assegurar aos trabalhadores condições de segurança e saúde em todos os aspetos do seu trabalho, planificando a prevenção a partir da avaliação dos riscos (Lei n.º 102/2009, art. 15.º). A avaliação assenta nas disposições seguintes:</P>
        <table className="tbl mb-3"><thead><tr><th className="w-28">Disposição</th><th>Conteúdo</th></tr></thead><tbody>{LEGISLACAO.map(([k, t]) => <tr key={k}><td className="font-semibold">{k}</td><td>{t}</td></tr>)}</tbody></table>
        <p className="mb-2 text-[10.5px] leading-snug text-ink-3">Nota: as citações seguem o texto original da Lei n.º 102/2009 (Diário da República, 1.ª série, n.º 176, de 10-09-2009). A lei foi alterada posteriormente; a numeração e a redação devem ser confirmadas na versão consolidada em vigor. A legislação específica de cada risco (máquinas, ruído, vibrações, movimentação de cargas, agentes químicos, EPI, sinalização) aplica-se cumulativamente e é confirmada pelo técnico.</p>
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Identificação</H1>
        <H2 n={`${n}.1`}>Entidade avaliada</H2>
        <table className="tbl mb-4"><tbody>
          {linhaT('Designação', a.entidade.designacao)}{linhaT('Morada', a.entidade.morada)}
          {c && <>{linhaT('NIPC', a.entidade.nipc)}{linhaT('CAE', a.entidade.cae)}{linhaT('Responsável', a.entidade.responsavel)}{linhaT('Contacto', a.entidade.contacto)}{linhaT('Técnico de SST', a.entidade.tecnicoSST)}</>}
        </tbody></table>
        {c && <><H2 n={`${n}.2`}>Entidade executante</H2>
          <table className="tbl mb-4"><tbody>
            {linhaT('Designação', a.executante.designacao)}{linhaT('NIPC', a.executante.nipc)}{linhaT('Morada', a.executante.morada)}{linhaT('Responsável técnico', a.executante.responsavelTecnico)}{linhaT('Habilitações', a.executante.habilitacoes)}{linhaT('Modalidade do serviço de SST', a.executante.servicoSST)}{linhaT('Contacto', a.executante.contacto)}
          </tbody></table></>}
        <H2 n={`${n}.${c ? 3 : 2}`}>Trabalho avaliado</H2>
        <table className="tbl mb-4"><tbody>
          {linhaT('Local', a.trabalho.local)}{linhaT('Atividade / processo', a.trabalho.atividade)}
          {c && <>{linhaT('Tipo de intervenção', a.trabalho.tipoIntervencao)}{linhaT('Equipamentos', a.trabalho.equipamentos)}{linhaT('Período de trabalho', a.trabalho.periodo)}</>}
          {linhaT('Data da avaliação', dataPt(a.metodo.dataAvaliacao))}
        </tbody></table>
        <H2 n={`${n}.${c ? 4 : 3}`}>Equipa</H2>
        <table className="tbl mb-4"><thead><tr><th>Papel</th><th>Nome</th><th>Função</th><th className="w-24">Data</th></tr></thead><tbody>
          {([['Elaborado', a.equipa.elaborado], ...(c ? [['Revisto', a.equipa.revisto], ['Aprovado', a.equipa.aprovado]] : []), ['Consulta dos trabalhadores', a.equipa.consulta]] as [string, AvaliacaoRiscos['equipa']['elaborado']][]).map(([k, p]) => <tr key={k}><td className="font-semibold">{k}</td><td>{p.nome || '—'}</td><td>{p.funcao || '—'}</td><td>{dataPt(p.data)}</td></tr>)}
        </tbody></table>
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Metodologia</H1>
        <P>Foi usado o método SSARA, descrito na Nota Técnica de Prevenção n.º 330 do INSST. Para cada perigo identificado estima-se a probabilidade de o risco se materializar e a gravidade das consequências:</P>
        <p className="my-3 bg-paper px-4 py-3 text-center font-mono text-[13px] font-bold">NP = ND × NE &nbsp;·&nbsp; NR = NP × NC</p>
        <H2 n={`${n}.1`}>Nível de deficiência (ND)</H2>
        <table className="tbl mb-2"><thead><tr><th className="w-12">ND</th><th className="w-40">Nível</th><th>Significado</th></tr></thead><tbody>{ND.map((x) => <tr key={x.v}><td className="num font-bold">{x.v}</td><td>{x.nome}</td><td className="text-[11px]">{x.sig}</td></tr>)}</tbody></table>
        <p className="mb-3 text-[10.5px] text-ink-3">Apoio ao ND (como na matriz): não cumpre o requisito legal e sem informação → 10; não cumpre o requisito legal → 6; cumpre, mas falta informação ou formação → 2; cumpre, com informação e formação → 1.</p>
        <H2 n={`${n}.2`}>Nível de exposição (NE)</H2>
        <table className="tbl mb-3"><thead><tr><th className="w-12">NE</th><th className="w-40">Nível</th><th>Significado</th></tr></thead><tbody>{NE.map((x) => <tr key={x.v}><td className="num font-bold">{x.v}</td><td>{x.nome}</td><td className="text-[11px]">{x.sig}</td></tr>)}</tbody></table>
        <H2 n={`${n}.3`}>Nível de probabilidade (NP)</H2>
        <table className="tbl mb-3"><thead><tr><th className="w-28">NP</th><th>Nível</th></tr></thead><tbody>{[['24 – 40', 'Muito alta (MA)'], ['10 – 20', 'Alta (A)'], ['6 – 8', 'Média (M)'], ['2 – 4', 'Baixa (B)']].map(([k, t]) => <tr key={k}><td className="num">{k}</td><td>{t}</td></tr>)}</tbody></table>
        <H2 n={`${n}.4`}>Nível de consequência (NC)</H2>
        <table className="tbl mb-3"><thead><tr><th className="w-12">NC</th><th className="w-40">Nível</th><th>Danos pessoais</th><th>Danos materiais</th></tr></thead><tbody>{NC.map((x) => <tr key={x.v}><td className="num font-bold">{x.v}</td><td>{x.nome}</td><td className="text-[11px]">{x.pessoais}</td><td className="text-[11px]">{x.materiais}</td></tr>)}</tbody></table>
        <H2 n={`${n}.5`}>Nível de intervenção</H2>
        <table className="tbl mb-3"><thead><tr><th className="w-14">Nível</th><th className="w-28">NR</th><th>Significado</th></tr></thead><tbody>{NIVEIS.map((x) => <tr key={x.n}><td><span className="inline-block w-8 text-center font-mono font-bold text-white" style={{ background: x.cor }}>{x.n}</span></td><td className="num">{x.intervalo}</td><td className="text-[11px]">{x.sig}</td></tr>)}</tbody></table>
        <H2 n={`${n}.6`}>Medidas e risco residual</H2>
        <P>As medidas são propostas pela ordem dos princípios gerais de prevenção (art. 15.º n.º 2): eliminar o perigo; substituir o que é perigoso; proteção coletiva e engenharia; medidas organizativas, sinalização, informação e formação; e equipamento de proteção individual em último recurso, dando prioridade à proteção coletiva. Após as medidas, o risco é reavaliado (NR'); considera-se aceitável o risco residual de nível III ou IV (NR' &lt; {LIMITE_ACEITAVEL}), critério da matriz da entidade executante.</P>
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Resultados da avaliação</H1>
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[['Riscos avaliados', pn.avaliados], ['Nível I e II', pn.criticos], ['NR médio', pn.nrMedio !== undefined ? Math.round(pn.nrMedio) : '—'], ['Medidas propostas', pn.medidas]].map(([k, v]) => <div key={k} className="border border-paper-3 p-3"><p className="label">{k}</p><p className="mt-1 font-display text-[24px] font-extrabold leading-none">{v}</p></div>)}
        </div>
        <H2 n={`${n}.1`}>Distribuição por nível de intervenção</H2>
        <table className="tbl mb-5"><thead><tr><th>Nível</th><th className="text-right">Avaliação inicial</th>{pn.reavaliados > 0 && <th className="text-right">Após as medidas</th>}<th>Ação</th></tr></thead><tbody>
          {NIVEIS.map((x, k) => <tr key={x.n}><td><span className="inline-block w-8 text-center font-mono font-bold text-white" style={{ background: x.cor }}>{x.n}</span></td><td className="num">{pn.distInicial[k]}</td>{pn.reavaliados > 0 && <td className="num">{pn.distResidual[k]}</td>}<td className="text-[11px]">{x.sig}</td></tr>)}
        </tbody></table>
        <H2 n={`${n}.2`}>Quadro de avaliação</H2>
        <table className="tbl text-[10.5px]"><thead><tr><th>Ref.</th>{c && <th>Área</th>}<th>Perigo</th><th>Risco</th>{c && <th className="text-right">Exp.</th>}<th className="text-right">ND</th><th className="text-right">NE</th><th className="text-right">NP</th><th className="text-right">NC</th><th className="text-right">NR</th><th>Nível</th></tr></thead>
          <tbody>{linhas.map(({ l, i, r }) => {
            const nd = r.np && l.ne ? r.np / l.ne : undefined;
            return <tr key={l.id} className="avoid-break"><td className="font-mono font-bold">{refR(i)}</td>{c && <td>{l.area || '—'}</td>}<td>{l.perigo || '—'}</td><td>{l.risco || '—'}</td>{c && <td className="num">{l.expostos ?? '—'}</td>}<td className="num">{nd ?? '—'}</td><td className="num">{l.ne ?? '—'}</td><td className="num">{r.np ?? '—'}</td><td className="num">{l.nc ?? '—'}</td><td className="num font-bold">{r.nr ?? '—'}</td><td><ChipNivel nr={r.nr} pequeno /></td></tr>;
          })}</tbody></table>
        {!linhas.length && <P>Sem riscos registados.</P>}
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Fichas de risco</H1>
        <P>Para cada risco: avaliação{c ? ', medidas existentes' : ''}, medidas propostas pela ordem da lei e risco residual.</P>
        {linhas.map(({ l, i, r }) => (
          <div key={l.id} className="avoid-break mb-5 border border-paper-3">
            <div className="flex items-center justify-between gap-3 border-b border-paper-3 bg-paper px-3 py-2">
              <p className="text-[12px] font-bold"><span className="mr-2 font-mono text-fire-ink">{refR(i)}</span>{l.perigo || 'Perigo por indicar'}</p>
              <span className="flex items-center gap-1"><ChipNivel nr={r.nr} pequeno />{r.nr2 !== undefined && <><span className="text-ink-4">→</span><ChipNivel nr={r.nr2} pequeno /></>}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 px-3 py-2 text-[11px]">
              <p><span className="text-ink-3">Risco:</span> {l.risco || '—'}</p>
              <p><span className="text-ink-3">Atividade:</span> {l.atividade || '—'}{c && l.area ? ` · ${l.area}` : ''}{c && l.expostos ? ` · ${l.expostos} expostos` : ''}</p>
              <p><span className="text-ink-3">Avaliação:</span> NP {textoNP(r.np)} × NC {l.nc ?? '—'} = <b>NR {r.nr ?? '—'}</b>{r.nivel ? ` — ${r.nivel.sig}` : ''}</p>
              {r.nr2 !== undefined && <p><span className="text-ink-3">Residual:</span> NR' {r.nr2}{r.reducao !== undefined ? ` (−${Math.round(r.reducao * 100)} %)` : ''} — {r.aceitavelCalc ? 'aceitável' : 'não aceitável'}</p>}
              {c && l.existentes && <p className="col-span-2"><span className="text-ink-3">Medidas existentes:</span> {l.existentes}</p>}
            </div>
            {l.medidas.some((m) => m.descricao.trim()) && (
              <table className="tbl text-[10.5px]"><thead><tr><th>Medida proposta</th><th className="w-44">Tipo</th>{c && <th className="w-28">Responsável</th>}{c && <th className="w-20">Prazo</th>}</tr></thead>
                <tbody>{[...l.medidas].filter((m) => m.descricao.trim()).sort((x, y) => (x.tipo ?? 9) - (y.tipo ?? 9)).map((m) => <tr key={m.id}><td>{m.descricao}</td><td>{m.tipo ? TIPO_MEDIDA[m.tipo] : '—'}</td>{c && <td>{m.responsavel || '—'}</td>}{c && <td>{dataPt(m.prazo)}</td>}</tr>)}</tbody></table>
            )}
          </div>
        ))}
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Plano de ação</H1>
        <P>Medidas ordenadas pela prioridade (nível de risco mais elevado primeiro). As medidas que dependem de outros responsáveis da empresa são-lhes comunicadas (Lei n.º 102/2009, art. 98.º n.º 3).{c && custoTotal ? ` Custo total estimado: ${custoTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}.` : ''}</P>
        <table className="tbl text-[10.5px]"><thead><tr><th>Ref.</th><th>Nível</th><th>Medida</th><th>Tipo</th>{c && <><th>Responsável</th><th>Prazo</th><th className="text-right">Custo</th><th>Estado</th></>}</tr></thead>
          <tbody>{medidas.map(({ l, i, r }) => [...l.medidas].filter((m) => m.descricao.trim()).sort((x, y) => (x.tipo ?? 9) - (y.tipo ?? 9)).map((m, k) => (
            <tr key={m.id} className="avoid-break">{k === 0 ? <><td className="font-mono font-bold">{refR(i)}</td><td><ChipNivel nr={r.nr} pequeno /></td></> : <><td /><td /></>}<td>{m.descricao}</td><td>{m.tipo ? TIPO_MEDIDA[m.tipo].split(' — ')[1] : '—'}</td>
              {c && <><td>{m.responsavel || '—'}</td><td>{dataPt(m.prazo)}</td><td className="num">{m.custo ? m.custo.toLocaleString('pt-PT') + ' €' : '—'}</td><td>{ESTADO_MEDIDA[m.estado]}</td></>}</tr>
          )))}</tbody></table>
        {!medidas.length && <P>Sem medidas propostas.</P>}
      </Sheet>

      {c && (
        <Sheet className="page-break">
          <H1 n={S()}>Reavaliação e eficácia das medidas</H1>
          <P>Risco residual após a implementação das medidas e verificação da sua eficácia (art. 15.º n.º 3 — níveis eficazes de proteção).</P>
          <table className="tbl text-[10.5px]"><thead><tr><th>Ref.</th><th>Medidas implementadas</th><th className="text-right">NR</th><th className="text-right">NR'</th><th className="text-right">Redução</th><th>Aceitável</th><th>Eficácia</th><th>Verificado</th></tr></thead>
            <tbody>{linhas.map(({ l, i, r }) => <tr key={l.id} className="avoid-break"><td className="font-mono font-bold">{refR(i)}</td><td>{l.implementadas || '—'}{l.acoesAdicionais && <span className="block text-alerta">Ações adicionais: {l.acoesAdicionais}</span>}</td><td className="num">{r.nr ?? '—'}</td><td className="num font-bold">{r.nr2 ?? '—'}</td><td className="num">{r.reducao !== undefined ? `${Math.round(r.reducao * 100)} %` : '—'}</td><td>{r.aceitavelCalc === undefined ? '—' : r.aceitavelCalc ? 'Sim' : 'Não'}</td><td>{l.eficacia ? EFICACIA[l.eficacia] : '—'}</td><td>{[l.verificadoPor, l.dataReav && dataPt(l.dataReav)].filter(Boolean).join(' · ') || '—'}</td></tr>)}</tbody></table>
          {(a.reavaliacao.reavaliadoPor || a.reavaliacao.data || a.reavaliacao.observacoes) && (
            <table className="tbl mt-4"><tbody>{linhaT('Reavaliado por', a.reavaliacao.reavaliadoPor)}{linhaT('Verificado por', a.reavaliacao.verificadoPor)}{linhaT('Aprovado por', a.reavaliacao.aprovadoPor)}{linhaT('Data', dataPt(a.reavaliacao.data))}{linhaT('Consulta dos trabalhadores', a.reavaliacao.consulta)}{linhaT('Próxima reavaliação', dataPt(a.reavaliacao.proxima))}{linhaT('Observações', a.reavaliacao.observacoes)}</tbody></table>
          )}
        </Sheet>
      )}

      <Sheet className="page-break">
        <H1 n={S()}>Conclusões</H1>
        <div className="mb-6 whitespace-pre-line text-[12px] leading-[1.65] text-ink-2">{a.conclusoes || 'Conclusões por preencher (separador «Painel e conclusões»).'}</div>
        <P>Os resultados desta avaliação devem ser dados a conhecer aos trabalhadores e aos seus representantes para a SST (arts. 18.º e 19.º), mantidos atualizados e conservados à disposição das autoridades inspetivas (art. 98.º n.os 2 e 5). A avaliação é revista sempre que se alterem os equipamentos, os processos ou a organização do trabalho, ou após um acidente ou incidente.</P>

        <div className="avoid-break mt-[22mm]">
          <H1 n={S()}>Termo de responsabilidade</H1>
          <P>{a.equipa.elaborado.nome || '[Nome do técnico]'}{a.equipa.elaborado.funcao ? `, ${a.equipa.elaborado.funcao}` : ''}{autor?.ordem && a.equipa.elaborado.nome.trim() === autor.nome?.trim() ? `, inscrito na ${autor.ordem} com o n.º ${autor.numero || '—'}` : ''}, declara que a presente avaliação de riscos foi elaborada com base na Lei n.º 102/2009, de 10 de setembro, pelo método SSARA (NTP 330), e que as sugestões da ferramenta de apoio foram por si verificadas e validadas.</P>
          <div className={`mt-12 grid gap-10 text-[11.5px] ${c ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {[['Elaborado', a.equipa.elaborado, assinaturaAutor], ...(c ? [['Aprovado', a.equipa.aprovado, undefined]] : []), ['Tomei conhecimento (entidade)', { nome: a.entidade.responsavel, funcao: a.entidade.designacao, data: '' }, undefined]].map(([k, p, img]) => {
              const pp = p as AvaliacaoRiscos['equipa']['elaborado'];
              return (
                <div key={k as string} className="text-center">
                  <p className="label mb-1 text-left">{k as string}</p>
                  <div className="relative mb-1 h-[56px] border-b border-ink">{comAss && img && <img src={img as string} alt="" className="absolute bottom-0 left-1/2 max-h-[64px] max-w-[85%] -translate-x-1/2 object-contain" />}</div>
                  <p className="font-semibold">{pp.nome || ' '}</p><p className="text-ink-3">{pp.funcao}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-[11.5px]">{dataLonga(a.metodo.dataAvaliacao)}</p>
        </div>
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Anexos</H1>
        <H2 n="A">Abreviaturas</H2>
        <table className="tbl mb-6"><tbody>{ABREV.map(([k, d]) => <tr key={k}><td className="w-20 font-mono font-semibold">{k}</td><td className="text-[11.5px]">{d}</td></tr>)}</tbody></table>
        {faltas.length > 0 && (
          <div className="no-print">
            <H2 n="B">Dados por preencher</H2>
            <ul className="text-[12px] text-alerta">{faltas.map((f, k) => <Fragment key={k}><li>· {f}</li></Fragment>)}</ul>
          </div>
        )}
      </Sheet>
    </div>
  );
}
