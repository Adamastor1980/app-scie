import { useState } from 'react';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useFPS } from '../store';
import { useStore } from '../../store';
import { go } from '../../router';
import type { Projeto } from '../../data/types';
import { H1, H2, P, Sheet, useDocumento } from '../../pages/doc';
import { TRABALHOS_ART2, comunicacaoPrevia, enquadramento, faltaFPS, textoArt7 } from '../regras';
import type { FPS, Interveniente } from '../tipos';
import { VERSAO_APP } from '../../versao';

const dPt = (iso?: string) => (iso ? new Date(iso + 'T00:00').toLocaleDateString('pt-PT') : '—');
const dLonga = (iso?: string) => (iso ? new Date(iso + 'T00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '');

export default function Documento({ id }: { id: string }) {
  const f = useFPS((s) => s.fichas.find((x) => x.id === id));
  if (!f) return <main className="mx-auto max-w-[720px] px-4 py-10"><p className="mb-4 font-display text-[20px] font-bold">Ficha não encontrada.</p><button className="btn" onClick={() => go('/fps')}>Voltar</button></main>;
  return <Doc f={f} />;
}

function Doc({ f }: { f: FPS }) {
  const empresa = useStore((s) => s.empresaPadrao);
  const autor = useStore((s) => s.autorPadrao);
  const pseudo = { empresa: { nome: empresa?.nome || f.executante.nome }, autor: { nome: f.tecnicoSST.nome || autor?.nome || '' }, referencia: f.codigo, nome: f.obra.designacao || 'FPS', versao: f.revisao || '00' } as unknown as Projeto;
  const { zoom, aGerar, imprimir } = useDocumento(pseudo, 'FPS', 'fps-folhas');
  const [comAss, setComAss] = useState(true);
  const faltas = faltaFPS(f);
  const enq = enquadramento(f);
  const cp = comunicacaoPrevia(f);
  const ass = autor?.assinatura && autor.nome && f.tecnicoSST.nome.trim() === autor.nome.trim() ? autor.assinatura : undefined;
  const T = (rot: string, v?: string | number) => <tr key={rot}><td className="w-[36%] font-semibold">{rot}</td><td>{v === undefined || v === '' ? '—' : v}</td></tr>;
  const I = (rot: string, p: Interveniente) => (p.nome ? <tr key={rot}><td className="w-[36%] font-semibold">{rot}</td><td>{p.nome}{p.funcao ? <span className="text-ink-3"> · {p.funcao}</span> : null}</td><td className="w-[28%]">{p.contacto || '—'}</td></tr> : null);
  const CAPS = ['Enquadramento legal', 'Identificação, caracterização e duração da obra', 'Intervenientes', 'Trabalhos, riscos e medidas de prevenção', 'Condicionantes do estaleiro e da área envolvente', 'Procedimentos em situações de emergência', 'Tomada de conhecimento dos trabalhadores'];

  return (
    <div id="fps-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button className="btn-ghost" onClick={() => go(`/fps/f/${f.id}`)}><ArrowLeft size={15} /> Editar</button>
          <div className="mr-auto">
            <p className="label">Documento</p>
            <p className="font-display text-[17px] font-bold">{f.titulo}</p>
            <p className={`text-[12px] ${faltas.length ? 'text-alerta' : 'text-ok'}`}>{faltas.length ? `Falta preencher: ${faltas.map((x) => x[0]).join(', ')}` : 'Dados completos'}</p>
          </div>
          {autor?.assinatura ? <label className="flex h-10 cursor-pointer items-center gap-2 border border-ink bg-white px-3 text-[13px] font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#14233A]" checked={comAss} onChange={(e) => setComAss(e.target.checked)} /> Com assinatura</label> : null}
          <button className="btn-fire h-11 px-5" disabled={!!aGerar} onClick={() => imprimir()}>{aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}</button>
        </div>
      </div>

      <Sheet className="flex flex-col">
        <div className="flex items-start justify-between">
          {empresa?.logo ? <img src={empresa.logo} className="h-[80px] w-[80px] object-contain" /> : <span className="font-display text-[20px] font-extrabold">{empresa?.nome || f.executante.nome}</span>}
          <span className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-wider text-ink-3">{f.codigo || 'S/ código'}<br />Revisão {f.revisao || '00'}<br />{dLonga(f.data)}</span>
        </div>
        <div className="mt-[48mm]">
          <div className="mb-6 h-[6px] w-24 bg-fire" />
          <p className="label mb-3">Artigo 14.º do Decreto-Lei n.º 273/2003, de 29 de outubro</p>
          <h1 className="h-display text-[42px]">{f.titulo}</h1>
          <p className="mt-4 font-display text-[22px] font-bold leading-tight text-ink-2">{f.obra.designacao || 'Obra por indicar'}</p>
          <p className="mt-2 text-[13px] text-ink-3">{f.obra.localizacao}</p>
        </div>
        <div className="mt-auto border-t-[3px] border-ink pt-5">
          <div className="grid grid-cols-3 gap-x-8 text-[11.5px]">
            <div><p className="label">Dono da obra</p><p className="font-semibold">{f.donoObra.nome || '—'}</p></div>
            <div><p className="label">Entidade executante</p><p className="font-semibold">{f.executante.nome || '—'}</p></div>
            <div><p className="label">Data</p><p className="font-semibold">{dLonga(f.data) || '—'}</p><p className="text-ink-3">Revisão {f.revisao || '00'}</p></div>
          </div>
        </div>
      </Sheet>

      <Sheet className="page-break">
        <H1 n="—">Controlo do documento</H1>
        <table className="tbl mb-4 text-[11px]"><thead><tr><th className="w-16">Revisão</th><th className="w-24">Data</th><th>Descrição</th></tr></thead>
          <tbody>{(f.revisoes.length ? f.revisoes : [{ revisao: f.revisao || '00', data: f.data, descricao: 'Emissão' }]).map((r, k) => <tr key={k}><td className="num">{r.revisao}</td><td>{dPt(r.data)}</td><td>{r.descricao || '—'}</td></tr>)}</tbody></table>
        <table className="tbl mb-8 text-[11px]"><thead><tr><th>Etapa</th><th>Nome</th><th className="w-24">Data</th><th className="w-36">Assinatura</th></tr></thead>
          <tbody>
            <tr><td className="font-semibold">Elaboração (entidade executante)</td><td>{f.tecnicoSST.nome || '—'}</td><td>{dPt(f.data)}</td><td className="h-10">{comAss && ass ? <img src={ass} alt="" className="max-h-9" /> : null}</td></tr>
            <tr><td className="font-semibold">Análise (coordenador de segurança em obra)</td><td>{f.analiseCSO.nome || f.coordenadorObra.nome || '—'}</td><td>{dPt(f.analiseCSO.data)}</td><td className="h-10" /></tr>
            <tr><td className="font-semibold">Conhecimento (dono da obra)</td><td>{f.donoObra.nome || '—'}</td><td /><td className="h-10" /></tr>
          </tbody></table>
        <H1 n="—">Índice</H1>
        <ol className="space-y-1.5 text-[12.5px]">{CAPS.map((t, i) => <li key={t} className="flex items-baseline gap-3 border-b border-dotted border-ink-4 pb-1"><span className="w-6 font-mono text-fire-ink">{i + 1}</span>{t}</li>)}</ol>
      </Sheet>

      <Sheet className="page-break">
        <H1 n="1">Enquadramento legal</H1>
        <P>{enq.texto}</P>
        <table className="tbl mb-3 text-[11px]"><tbody>
          {T('Tipo de trabalho (art. 2.º n.º 2)', f.tipoTrabalho.map((l) => `${l}) ${TRABALHOS_ART2.find((x) => x[0] === l)?.[1] ?? ''}`).join('; '))}
          {T('Obra sujeita a projeto', f.sujeitaProjeto === undefined ? '—' : f.sujeitaProjeto ? 'Sim' : 'Não')}
          {T('Comunicação prévia (art. 15.º)', cp === undefined ? '—' : cp ? 'Sim' : 'Não')}
          {T('Riscos especiais (art. 7.º)', f.riscosEspeciais?.length ? f.riscosEspeciais.map((l) => `${l})`).join(', ') : 'Nenhum')}
        </tbody></table>
        {!!f.riscosEspeciais?.length && <ul className="mb-3 text-[11px] text-ink-2">{f.riscosEspeciais.map((l) => <li key={l} className="mb-1">· <b>{l})</b> {textoArt7(l)}</li>)}</ul>}
        <P>A entidade executante elabora as fichas de procedimentos de segurança para os trabalhos que comportam riscos especiais e assegura que os trabalhadores intervenientes na obra tomam conhecimento delas (art. 14.º n.º 1). A implantação do estaleiro só pode iniciar-se com as fichas disponíveis (n.º 4), que ficam acessíveis no estaleiro a subempreiteiros, trabalhadores independentes e representantes dos trabalhadores (n.º 5). O coordenador de segurança em obra analisa a sua adequabilidade (n.º 3). Aplica-se ainda o regime geral de segurança e saúde no trabalho (Lei n.º 102/2009).</P>
        <p className="text-[10px] text-ink-3">Citações segundo o texto original do Decreto-Lei n.º 273/2003 (DR, I série-A, n.º 251, de 29-10-2003). As referências à Inspeção-Geral do Trabalho correspondem hoje à ACT.</p>

        <H1 n="2">Identificação, caracterização e duração da obra</H1>
        <table className="tbl mb-3 text-[11px]"><tbody>
          {T('Obra', f.obra.designacao)}{T('Localização', [f.obra.localizacao, f.obra.coordenadas].filter(Boolean).join(' · '))}
          {T('Início / fim previstos', `${dPt(f.obra.inicio)} – ${dPt(f.obra.fim)}`)}{T('Duração', f.duracaoDias !== undefined ? `${f.duracaoDias} dias` : '')}{T('Máximo de trabalhadores em simultâneo', f.maxSimultaneos)}
        </tbody></table>
        <P>{f.obra.caracterizacao || '—'}</P>
      </Sheet>

      <Sheet className="page-break">
        <H1 n="3">Intervenientes</H1>
        <table className="tbl mb-4 text-[11px]"><tbody>
          {I('Dono da obra', f.donoObra)}{I('Entidade executante', f.executante)}{I('Responsável pela direção técnica', f.diretorTecnico)}{I('Técnico de segurança', f.tecnicoSST)}{I('Coordenador de segurança em obra', f.coordenadorObra)}
        </tbody></table>
        {f.subempreiteiros.length > 0 && <><H2 n="3.1">Subempreiteiros</H2>
          <table className="tbl mb-4 text-[11px]"><thead><tr><th>Empresa</th><th>Atividade</th><th>Contacto</th></tr></thead><tbody>{f.subempreiteiros.map((s) => <tr key={s.id}><td>{s.nome || '—'}</td><td>{s.atividade || '—'}</td><td>{s.contacto || '—'}</td></tr>)}</tbody></table></>}

        <H1 n="4">Trabalhos, riscos e medidas de prevenção</H1>
        {f.trabalhos.map((t, k) => (
          <div key={t.id} className="avoid-break mb-4 border border-paper-3">
            <p className="border-b border-paper-3 bg-paper px-3 py-2 text-[12px] font-bold"><span className="mr-2 font-mono text-fire-ink">4.{k + 1}</span>{t.descricao || 'Trabalho por indicar'}{t.riscosEspeciais.length ? <span className="ml-2 font-normal text-ink-3">· art. 7.º {t.riscosEspeciais.map((l) => `${l})`).join(', ')}</span> : null}</p>
            <div className="px-3 py-2 text-[11px]">
              {t.riscos && <p className="mb-1.5"><span className="text-ink-3">Riscos:</span> {t.riscos}</p>}
              <p className="mb-1 text-ink-3">Medidas de prevenção:</p>
              <ul className="mb-1.5">{t.medidas.filter((m) => m.texto.trim()).map((m) => <li key={m.id}>– {m.texto}</li>)}</ul>
              {t.epi && <p><span className="text-ink-3">EPI:</span> {t.epi}</p>}
            </div>
          </div>
        ))}
      </Sheet>

      <Sheet className="page-break">
        <H1 n="5">Condicionantes do estaleiro e da área envolvente</H1>
        <table className="tbl mb-4 text-[11px]"><tbody>{T('Terreno', f.condicionantes.terreno)}{T('Redes técnicas aéreas ou subterrâneas', f.condicionantes.redes)}{T('Atividades que decorrem no local', f.condicionantes.atividades)}{T('Outras', f.condicionantes.outras)}</tbody></table>
        <H1 n="6">Procedimentos em situações de emergência</H1>
        <table className="tbl mb-3 text-[11.5px]"><thead><tr><th>Contacto</th><th className="w-40">Telefone</th></tr></thead><tbody>{f.emergencia.contactos.filter((c) => c.telefone.trim()).map((c) => <tr key={c.id}><td>{c.nome || '—'}</td><td className="font-mono font-bold">{c.telefone}</td></tr>)}</tbody></table>
        {f.emergencia.pontoEncontro && <P><b>Ponto de encontro:</b> {f.emergencia.pontoEncontro}</P>}
        <div className="whitespace-pre-line text-[11.5px] leading-[1.65] text-ink-2">{f.emergencia.procedimentos}</div>
        {f.analiseCSO.observacoes && <><H2 n="6.1">Análise do coordenador de segurança em obra</H2><P>{f.analiseCSO.observacoes}</P></>}
      </Sheet>

      <Sheet className="page-break">
        <H1 n="7">Tomada de conhecimento dos trabalhadores</H1>
        <P>Os trabalhadores abaixo declaram ter tomado conhecimento desta ficha de procedimentos de segurança e das medidas de prevenção nela previstas (art. 14.º n.º 1).</P>
        <table className="tbl text-[11px]"><thead><tr><th className="w-8">N.º</th><th>Nome</th><th>Empresa</th><th className="w-24">Data</th><th className="w-36">Assinatura</th></tr></thead>
          <tbody>{Array.from({ length: 14 }, (_, k) => <tr key={k}><td className="num h-9">{k + 1}</td><td /><td /><td /><td /></tr>)}</tbody></table>
        <p className="mt-6 text-[10px] text-ink-3">Elaborado com Cautela — FPS, versão de {VERSAO_APP}. As medidas sugeridas pela app foram verificadas e validadas pelo técnico que assina.</p>
      </Sheet>
    </div>
  );
}
