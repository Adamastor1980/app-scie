import { ABREVIATURAS, Abreviaturas, BotaoAssinatura, Capa, EmpresaBloco, FichaTecnica, Indice, RevisoesDistribuicao, TabelaLegislacao, TermoAutor } from './docComum';
import { MapaExtintores, QuadroExtintores, TotaisExtintores } from './ExtintoresQuadro';
import { dimensionarExtintores } from '../engine/extintores';
import { baseLegalDoc, notaVersao } from '../versao';
import { codigosEspacos, justificacaoLocal, nomeUT, tituloUT } from '../nome';
import { GLOSSARIO } from '../data/glossario';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FileDown, Loader2, Printer } from 'lucide-react';
import { gerarPdfDireto, usarPdfDireto } from '../pdfDireto';
import { useP } from './ProjetoShell';
import { ROMANO, utInfo } from '../data/rjscie';
import { classeAltura } from '../data/rtscie';
import { CAT_NOME, CAT_RISCO, catAtribuida, cargaCompartimento, cargaUT, efetivoEspaco, fmt, justificacaoCategoria, faltaCaracterizacao, faltaEdificio, faltaParaMedidas, alturaEdificio, pisosUT } from '../engine/calc';
import { contexto, gerarMedidas, GRUPOS, SECOES, secRotulo, type Medida } from '../engine/medidas';
import { desconformidades, estadoSeccao, evidenciasConformidade, opcoesPrazo, porVerificar, progresso } from '../engine/verificacao';
import QuadroAnexo from './ut/QuadroAnexo';
import { CAT_COR, Toggle } from '../ui/primitives';
import type { Cat } from '../data/types';

const TIPO_PLANTA: Record<string, string> = {
  localizacao: 'Planta de localização', implantacao: 'Planta de implantação', cortes: 'Cortes e alçados', piso: 'Planta de piso', outra: 'Peça desenhada',
};

function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`report-page mx-auto mb-8 w-[210mm] min-h-[297mm] bg-white px-[16mm] py-[16mm] shadow-[0_1px_0_#14233A,8px_8px_0_rgba(20,35,58,0.12)] ${className}`}>{children}</section>;
}

function H1({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h2 className="avoid-break mb-5 mt-2 flex items-baseline gap-3 border-b-[3px] border-ink pb-2">
      <span className="font-mono text-[13px] font-semibold text-fire-ink">{n}</span>
      <span className="font-display text-[24px] font-extrabold tracking-tight">{children}</span>
    </h2>
  );
}
function H2({ n, children }: { n: string; children: ReactNode }) {
  return <h3 className="avoid-break mb-2 mt-6 flex items-baseline gap-2 font-display text-[15.5px] font-bold"><span className="font-mono text-[11.5px] text-ink-3">{n}</span>{children}</h3>;
}
const P = ({ children }: { children: ReactNode }) => <p className="mb-2.5 text-[12px] leading-[1.6] text-ink-2">{children}</p>;

/** Sem todos os critérios preenchidos não há categoria atribuída (RJ-SCIE, art. 13.º). */
const nomeCat = (c: { falta: string[]; cat: Cat }) => (c.falta.length ? 'Categoria por atribuir' : CAT_NOME[c.cat]);

export default function Relatorio() {
  const { p } = useP();
  const [incluirNao, setIncluirNao] = useState(false);
  const [incluirEvid, setIncluirEvid] = useState(false);
  const [comAss, setComAss] = useState(true);
  const [incluirVerif, setIncluirVerif] = useState(false);
  // no telemóvel/tablet a folha A4 (210 mm ≈ 794 px) é reduzida para caber no ecrã; na impressão volta a 100 %
  const escala = () => Math.min(1, (window.innerWidth - 16) / 800);
  const [zoom, setZoom] = useState(escala);
  useEffect(() => {
    const f = () => setZoom(escala());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const dados = useMemo(() => p.edificios.map((ed) => ({
    ed,
    uts: ed.uts.map((ut) => {
      const ctx = contexto(ed, ut);
      return { ...ctx, carga: cargaUT(ut), medidas: ctx.cls.falta.length || faltaParaMedidas(ut).length || faltaEdificio(ed).length ? [] : gerarMedidas(ctx) }; // sem categoria não há medidas
    }),
  })), [p]);
  const todas = dados.flatMap((d) => d.uts);
  const semCat = todas.filter((u) => u.cls.falta.length);
  const maxCat = todas.length && !semCat.length ? (Math.max(...todas.map((u) => u.cls.cat)) as Cat) : null;
  const dataPt = p.data ? new Date(p.data + 'T00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  useEffect(() => {
    const st = document.createElement('style');
    const esc = (s: string) => s.replace(/["\\]/g, '');
    st.textContent = `@page { @top-left { content: "${esc(p.empresa.nome || 'SCIE')}"; font: 8pt Inter, sans-serif; color: #5A6478; }
      @top-right { content: "${esc(p.referencia || p.nome)} · v${esc(p.versao)}"; font: 8pt 'JetBrains Mono', monospace; color: #5A6478; }
      @bottom-left { content: "Realizado por: ${esc(p.autor.nome || p.empresa.nome || '')} · ${esc(p.nome)}"; font: 7.5pt Inter, sans-serif; color: #8B92A0; }
      @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 8pt 'JetBrains Mono', monospace; color: #14233A; } }
      @page :first { @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }`;
    document.head.appendChild(st);
    return () => { st.remove(); };
  }, [p.empresa.nome, p.autor.nome, p.referencia, p.nome, p.versao]);

  // Telemóvel/tablet: gera o ficheiro PDF diretamente (o diálogo de impressão não funciona na app instalada no iPhone).
  // Computador: impressão do browser («Guardar como PDF»), com texto vetorial.
  const [aGerar, setAGerar] = useState('');
  const nomeFich = `${(p.referencia || p.nome).replace(/[^\w\-À-ú ]+/g, '_')} — Relatório SCIE v${p.versao}`;
  const imprimir = async () => {
    if (usarPdfDireto()) {
      const raiz = document.getElementById('relatorio-folhas');
      if (!raiz || aGerar) return;
      setAGerar('A preparar…');
      setZoom(1);
      try {
        await new Promise((r) => setTimeout(r, 150));
        await gerarPdfDireto(raiz, nomeFich + '.pdf', `Realizado por: ${p.autor.nome || p.empresa.nome || ''} · ${p.nome}`, setAGerar);
      } catch (e) {
        alert('Não foi possível gerar o PDF: ' + (e as Error).message);
      } finally {
        setAGerar('');
        setZoom(escala());
      }
      return;
    }
    const t = document.title;
    document.title = nomeFich;
    window.print();
    setTimeout(() => { document.title = t; }, 500);
  };

  const filtraMed = (m: Medida[]) => m.filter((x) => x.estado === 'aplica' || (incluirVerif && x.estado === 'verificar') || (incluirNao && x.estado === 'nao'));

  const cod = codigosEspacos(p);
  const locaisLista = todas.flatMap((u) => u.ut.espacos.map((e) => ({ u, e, c: efetivoEspaco(e) })));
  let sec = 0;
  const S = () => String(++sec);

  return (
    <div id="relatorio-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <div className="mr-auto">
            <p className="label">Relatório técnico</p>
            <p className="font-display text-[17px] font-bold">{p.nome}</p>
          </div>
          <div className="w-full sm:w-[230px]"><Toggle checked={incluirVerif} onChange={setIncluirVerif} label="Incluir medidas por decidir" /></div>
          <div className="w-full sm:w-[230px]"><Toggle checked={incluirNao} onChange={setIncluirNao} label="Incluir não aplicáveis" /></div>
          <div className="w-full sm:w-[230px]"><Toggle checked={incluirEvid} onChange={setIncluirEvid} label="Incluir evidências de conformidade" /></div>
          <BotaoAssinatura p={p} com={comAss} set={setComAss} />
          <button className="btn h-11 w-full justify-center px-4 sm:w-auto" disabled={!!aGerar} onClick={async () => {
            const raiz = document.getElementById('relatorio-folhas');
            if (!raiz) return;
            setAGerar('A gerar Word…'); setZoom(1);
            try { await new Promise((r) => setTimeout(r, 150)); const { exportarDocx } = await import('../exportarDocx'); await exportarDocx(p, raiz, 'Relatorio SCIE'); }
            catch (e) { alert('Não foi possível gerar o Word: ' + (e as Error).message); }
            finally { setAGerar(''); setZoom(escala()); }
          }}><FileDown size={16} /> Word</button>
          <button className="btn-fire h-11 w-full justify-center px-5 sm:w-auto" onClick={imprimir} disabled={!!aGerar}>{aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}</button>
        </div>
        {(() => { const eds = p.edificios.filter((e) => faltaCaracterizacao(e).length); return eds.length > 0 ? <p className="mx-auto max-w-[1100px] px-4 pb-1 text-[12px] font-semibold text-alerta sm:px-6">Falta preencher a caracterização de {eds.map((e) => `«${e.nome}» (${faltaCaracterizacao(e).map(([k]) => k.toLowerCase()).join(', ')})`).join('; ')}.</p> : null; })()}
        {semCat.length > 0 && <p className="mx-auto max-w-[1100px] px-4 pb-1 text-[12px] font-semibold text-alerta sm:px-6">{semCat.length} UT sem categoria atribuída (faltam critérios nos fatores de risco): {semCat.map((u) => tituloUT(u.ut)).join('; ')}. O relatório não é válido enquanto não estiverem completas.</p>}
        {(() => {
          const n = todas.reduce((s2, u) => s2 + u.medidas.filter((m) => m.estado === 'verificar').length, 0);
          return n > 0 ? <p className="mx-auto max-w-[1100px] px-4 pb-1 text-[12px] font-semibold text-alerta sm:px-6">{n} medida(s) por decidir: responda às «Características do local» no passo Medidas de cada UT. Só as medidas aplicáveis entram no relatório.</p> : null;
        })()}
        <p className="mx-auto max-w-[1100px] px-4 pb-2 text-[11.5px] sm:px-6 text-ink-3">{usarPdfDireto() ? 'No telemóvel/tablet o PDF é gerado diretamente; no iPhone escolha «Guardar em Ficheiros». Para a versão final (texto pesquisável, máxima qualidade) gere-o no computador.' : <>No diálogo de impressão escolha «Guardar como PDF», papel A4, margens «Predefinição» e ative «Gráficos de fundo». Resultado em texto vetorial, pesquisável.</>}</p>
      </div>

      {/* ------------------------------ CAPA ------------------------------ */}
      <Capa p={p} rotulo={p.tipoIntervencao} titulo="Segurança contra incêndio em edifícios" />

      {/* -------------------- FICHA TÉCNICA E ÍNDICE ---------------------- */}
      <Sheet className="page-break">
        <H1 n="—">Ficha técnica</H1>
        <FichaTecnica p={p} documento={`Relatório de segurança contra incêndio em edifícios — ${p.tipoIntervencao}`} />
        <H1 n="—">Índice</H1>
        <Indice antes="Síntese para o cliente" itens={['Apresentação da empresa', 'Introdução e enquadramento legal', 'Caracterização dos edifícios e das utilizações-tipo', 'Classificação e identificação do risco', 'Cálculo do efetivo', 'Densidade de carga de incêndio modificada', 'Dimensionamento de extintores', 'Condições de segurança exigíveis (anexo IV, II a VII)', 'Análise regulamentar e medidas corretivas', 'Medidas de autoproteção', 'Peças desenhadas', 'Conclusões', 'Termo do autor', 'Anexos']} />
      </Sheet>

      {/* ----------------------- SÍNTESE PARA O CLIENTE ------------------- */}
      {(() => {
        const ordemPrazo = opcoesPrazo();
        const posPrazo = (p?: string) => (p ? (ordemPrazo.indexOf(p) >= 0 ? ordemPrazo.indexOf(p) : 900) : 999);
        const porUT = todas.map((x) => ({ ...x, pg: progresso(x.ut, x.medidas), ds: desconformidades(x.ut, x.medidas) }));
        const ncs = porUT.flatMap((x) => x.ds.map((d) => ({ x, d }))).sort((a, b) => posPrazo(a.d.ver.prazo) - posPrazo(b.d.ver.prazo));
        const verificadas = porUT.reduce((s2, x) => s2 + x.pg.marcadas, 0);
        return (
          <Sheet className="page-break">
            <H1 n="—">Síntese para o cliente</H1>
            <P>Resumo do estado de conformidade dos edifícios com o regime de segurança contra incêndio (RJ-SCIE e RT-SCIE). O detalhe de cada verificação, com a base legal, consta do capítulo «Análise regulamentar e medidas corretivas».</P>
            <table className="tbl mb-6">
              <thead><tr><th>Utilização-tipo</th><th>Categoria</th><th className="text-right">Verificadas</th><th className="text-right">Cumpre</th><th className="text-right">Não cumpre</th></tr></thead>
              <tbody>{porUT.map((x) => (
                <tr key={x.ut.id}><td>{tituloUT(x.ut)}<br /><span className="ref">{x.ed.nome}</span></td><td className="whitespace-nowrap">{nomeCat(x.cls)}</td><td className="num text-right">{x.pg.marcadas}/{x.pg.total}</td><td className="num text-right text-ok">{x.pg.cumpre}</td><td className={`num text-right font-bold ${x.pg.naoCumpre ? 'text-fire-ink' : ''}`}>{x.pg.naoCumpre}</td></tr>
              ))}</tbody>
            </table>
            {verificadas === 0 ? (
              <div className="border-l-[4px] border-ink-4 bg-paper px-4 py-3 text-[12.5px]">A verificação no local das exigências ainda não foi registada; a síntese de conformidade será apresentada quando estiver concluída.</div>
            ) : ncs.length === 0 ? (
              <div className="border-l-[4px] border-ok bg-ok-soft px-4 py-3 text-[13px] font-semibold">Não foram identificadas não conformidades nas exigências verificadas.</div>
            ) : (
              <div className="avoid-break border-2 border-ink">
                <div className="flex items-baseline justify-between bg-ink px-4 py-2.5 text-white">
                  <span className="font-display text-[16px] font-extrabold">O que é preciso corrigir</span>
                  <span className="font-mono text-[12px]">{ncs.length} não conformidade{ncs.length === 1 ? '' : 's'}</span>
                </div>
                <table className="tbl">
                  <thead><tr><th className="w-[16%]">Ref.</th><th>Não conformidade e base legal</th><th className="w-[30%]">Medida corretiva</th><th className="w-[13%]">Prazo</th></tr></thead>
                  <tbody>{ncs.map(({ x, d }) => (
                    <tr key={x.ut.id + d.medida.key}>
                      <td className="font-mono text-[10.5px]">UT {ROMANO[x.ut.tipo]} · {d.letra})</td>
                      <td className="text-[11.5px]"><b>{d.medida.titulo}</b>{d.ver.obs ? ` — ${d.ver.obs}` : ''}<span className="block text-[10px] text-ink-3">{d.medida.base}</span></td>
                      <td className="text-[11.5px]">{d.ver.corretiva || <span className="italic text-ink-3">A definir</span>}</td>
                      <td className={`text-[11.5px] ${d.ver.prazo === 'Imediato' ? 'font-bold text-alerta' : ''}`}>{d.ver.prazo || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Sheet>
        );
      })()}

      {/* ------------------------ CORPO DO RELATÓRIO ---------------------- */}
      <Sheet className="page-break">
        <H1 n={S()}>Apresentação da empresa</H1>
        <EmpresaBloco p={p} />

        <H1 n={S()}>Introdução e enquadramento legal</H1>
        <H2 n={`${sec}.1`}>Objetivo</H2>
        <P>{p.objetivo || `O presente documento caracteriza as utilizações-tipo de ${p.nome}, determina o efetivo, a densidade de carga de incêndio modificada (quando aplicável) e a categoria de risco de cada utilização-tipo, e identifica as condições de segurança contra incêndio exigíveis, nos termos do regime jurídico e do regulamento técnico de segurança contra incêndio em edifícios.`}</P>
        <H2 n={`${sec}.2`}>Localização</H2>
        <P>{[p.morada, p.concelho, p.distrito].filter(Boolean).join(', ') || '—'}{p.coordenadas ? ` (coordenadas ${p.coordenadas})` : ''}.</P>
        <H2 n={`${sec}.3`}>Legislação aplicada</H2>
        <TabelaLegislacao />
        <P>{baseLegalDoc(dataPt)} {notaVersao()}</P>
        <P>A estrutura deste relatório segue o conteúdo da memória descritiva e justificativa definido no anexo IV do RJ-SCIE. Todas as exigências indicadas citam o artigo e o quadro de onde resultam.</P>

        <H1 n={S()}>Caracterização dos edifícios e das utilizações-tipo</H1>
        {dados.map(({ ed, uts }, i) => (
          <div key={ed.id} className="avoid-break mb-5">
            <H2 n={`${sec}.${i + 1}`}>{ed.nome}</H2>
            <table className="tbl mb-2"><tbody>
              <tr><td className="w-[42%] font-semibold">Altura do edifício (RT-SCIE, anexo I)</td><td className="num">{fmt(alturaEdificio(ed), 2)} m — {classeAltura(alturaEdificio(ed)).toLowerCase()} altura</td></tr>
              <tr><td className="font-semibold">Pisos acima / abaixo do plano de referência</td><td className="num">{ed.pisosAcima} / {ed.pisosAbaixo}</td></tr>
              <tr><td className="font-semibold">Utilização</td><td>{uts.length > 1 ? `Mista (${uts.map((u) => 'UT ' + ROMANO[u.ut.tipo]).join(', ')})${ed.comunicacoesComuns ? ', com comunicações interiores comuns' : ', sem comunicações interiores comuns'}` : uts.length ? `Exclusiva (UT ${ROMANO[uts[0].ut.tipo]})` : '—'}</td></tr>
              <tr><td className="font-semibold">Edifício independente (art. 2.º j))</td><td>{ed.independente ? 'Sim' : 'Não'}</td></tr>
            </tbody></table>
            {ed.descricao && <P>{ed.descricao}</P>}
            {(() => { const comP = uts.map(({ ut }) => ({ ut, ps: pisosUT(ut) })).filter((x) => x.ps.some((p) => p.area > 0)); return comP.length > 0 && (
              <table className="tbl mb-3"><thead><tr><th>Utilização-tipo</th><th>Piso</th><th className="text-right">Cota (m)</th><th className="text-right">Área (m²)</th><th className="text-right">Área por UT (m²)</th></tr></thead>
                <tbody>
                  {comP.map(({ ut, ps }) => ps.map((pi, k) => (
                    <tr key={ut.id + pi.n}>
                      {k === 0 && <td rowSpan={ps.length} className="text-[11px]"><b>UT {ROMANO[ut.tipo]}</b> «{utInfo(ut.tipo).nome}»<br />{nomeUT(ut).nome}</td>}
                      <td>{pi.nome}{pi.tecnico ? ' (técnico)' : ''}</td><td className="num text-right">{pi.cota === undefined ? '—' : fmt(pi.cota, 2)}</td><td className="num text-right">{pi.area > 0 ? fmt(pi.area, 2) : '—'}</td>
                      {k === 0 && <td rowSpan={ps.length} className="num text-right font-semibold">{fmt(ps.reduce((a, x) => a + x.area, 0), 2)}</td>}
                    </tr>
                  )))}
                  <tr><td colSpan={4} className="text-right font-bold">Total do edifício</td><td className="num text-right font-bold">{fmt(comP.reduce((a, { ps }) => a + ps.reduce((x, y) => x + y.area, 0), 0), 2)}</td></tr>
                </tbody></table>
            ); })()}
            {uts.map(({ ut }) => (
              <div key={ut.id} className="mb-3 border-l-[3px] border-ink pl-3">
                <p className="text-[12.5px] font-bold">{tituloUT(ut)}</p>
                <p className="text-[11.5px] text-ink-3">{utInfo(ut.tipo).definicao} (RJ-SCIE, art. 8.º n.º 1 {utInfo(ut.tipo).alinea})</p>
                {ut.descricao && <p className="mt-1 text-[12px]">{ut.descricao}</p>}
              </div>
            ))}
          </div>
        ))}

        <H1 n={S()}>Classificação e identificação do risco</H1>
        <H2 n={`${sec}.1`}>Locais de risco (RJ-SCIE, art. 10.º)</H2>
        {locaisLista.length ? (
          <table className="tbl mb-3"><thead><tr><th>Código</th><th>UT</th><th>Espaço</th><th>Piso</th><th>Local</th><th className="text-right">Efetivo</th><th>Justificação</th></tr></thead>
            <tbody>{locaisLista.map(({ u, e, c }) => (
              <tr key={e.id}><td className="whitespace-nowrap font-mono text-[10.5px]">{cod.get(e.id)}</td><td><span className="num font-semibold">{ROMANO[u.ut.tipo]}</span> <span className="text-[10.5px] text-ink-3">{utInfo(u.ut.tipo).nome}</span></td><td>{e.nome || nomeUT(u.ut).nome}</td><td>{e.piso}</td><td className="font-semibold">{e.local === 'Cag' ? 'C agrav.' : e.local}</td><td className="num text-right">{c.valor}</td>
                <td className="text-[11px] text-ink-3">{justificacaoLocal(e, c.valor)}{e.local === 'A' && (c.valor > 100 || (e.efetivoPublico ?? 0) > 50) && <span className="block font-semibold text-alerta">Efetivo &gt; 100 ou público &gt; 50: corresponde a local de risco B (art. 10.º n.º 1 b)).</span>}</td></tr>
            ))}</tbody></table>
        ) : <P>Sem espaços registados.</P>}
        <H2 n={`${sec}.2`}>Fatores e categorias de risco (RJ-SCIE, arts. 12.º e 13.º e anexo III)</H2>
        {todas.map(({ ut, cls, ed }) => (
          <div key={ut.id} className="avoid-break mb-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12.5px] font-bold">{ed.nome} · {tituloUT(ut)}</p>
              <span className={`${cls.falta.length ? 'border border-dashed border-ink-4 text-ink-3' : `${CAT_COR[cls.cat]} text-white`} px-2 py-0.5 font-mono text-[11px] font-semibold`}>{nomeCat(cls)}</span>
            </div>
            <QuadroAnexo c={cls} titulo={`${cls.quadro} do anexo III`} />
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
              {cls.falta.length ? `Categoria por atribuir: falta preencher ${cls.falta.join(', ').toLowerCase()}.` : <>{justificacaoCategoria(cls)} {cls.notas.join(' ')} {CAT_RISCO[cls.cat]}.</>}
            </p>
          </div>
        ))}
        <table className="tbl"><thead><tr><th>Edifício</th><th>UT</th><th>Designação</th><th>Categoria</th></tr></thead>
          <tbody>{todas.map(({ ut, ed, cls }) => <tr key={ut.id}><td>{ed.nome}</td><td><span className="num font-semibold">{ROMANO[ut.tipo]}</span> <span className="text-[10.5px] text-ink-3">{utInfo(ut.tipo).nome}</span></td><td>{nomeUT(ut).nome}</td><td className="font-semibold">{nomeCat(cls)}</td></tr>)}</tbody></table>

        <H1 n={S()}>Cálculo do efetivo</H1>
        <P>O efetivo é o somatório dos efetivos de todos os espaços suscetíveis de ocupação (RT-SCIE, art. 51.º n.º 1), arredondados ao inteiro superior. A correção pelo fator 1,3 (art. 51.º n.º 5) aplica-se apenas ao dimensionamento das vias de evacuação e saídas.</P>
        {todas.filter((u) => u.ut.espacos.length).map(({ ut, ef }) => (
          <div key={ut.id} className="avoid-break mb-5">
            <p className="mb-1 text-[12.5px] font-bold">{tituloUT(ut)}</p>
            <table className="tbl"><thead><tr><th>Espaço</th><th>Cálculo</th><th>Base legal</th><th className="text-right">Efetivo</th></tr></thead>
              <tbody>
                {[...new Set(ut.espacos.map((e) => e.piso || '—'))].map((piso) => {
                  const doPiso = ut.espacos.filter((e) => (e.piso || '—') === piso);
                  const sub = doPiso.filter((e) => !e.naoSimultaneo).reduce((a, e) => a + efetivoEspaco(e).valor, 0);
                  return (
                    <Fragment key={piso}>
                      <tr><td colSpan={4} className="bg-paper font-display text-[11.5px] font-bold">{piso}</td></tr>
                      {doPiso.map((e) => { const c = efetivoEspaco(e); return (
                  <tr key={e.id} className={e.naoSimultaneo ? 'text-ink-4' : ''}><td><span className="font-mono text-[10px] text-ink-3">{cod.get(e.id)}</span> {e.nome || nomeUT(ut).nome}<br /><span className="ref">{e.piso} · local {e.local === 'Cag' ? 'C agrav.' : e.local}</span></td><td className="font-mono text-[11px]">{c.formula}{e.mobilidadeReduzida ? ` (para saídas e vias de evacuação: ×1,3 = ${c.evacuacao}, art. 51.º n.º 5)` : ''}</td><td className="text-[10.5px] text-ink-3">{c.base}{e.naoSimultaneo ? ' · não somado (n.º 9)' : ''}{e.justificacao ? ` · ${e.justificacao}` : ''}</td><td className="num text-right font-semibold">{c.valor}</td></tr>
                ); })}
                      <tr><td colSpan={3} className="text-right text-[11px] font-semibold">Efetivo do piso</td><td className="num text-right font-semibold">{sub}</td></tr>
                    </Fragment>
                  );
                })}
                <tr><td colSpan={3} className="font-bold">Efetivo da UT{ef.origem === 'manual' ? ' (valor introduzido manualmente)' : ''}</td><td className="num text-right text-[14px] font-bold">{ef.total}</td></tr>
                {(ef.emD > 0 || ef.emE > 0) && <tr><td colSpan={3}>Efetivo em locais de risco D / E</td><td className="num text-right">{ef.emD} / {ef.emE}</td></tr>}
              </tbody></table>
          </div>
        ))}

        <H1 n={S()}>Densidade de carga de incêndio modificada</H1>
        <P>Determinada segundo o Despacho n.º 2074/2009, na redação do Despacho n.º 8954/2020 (n.os 3.º e 4.º): método determinístico Qs = Σ Mi·Hi·Ci·Rai; método probabilístico Qs = Σ qsi·Si·Ci·Rai (atividades) e Qs = Σ qvi·hi·Si·Ci·Rai (armazenamento); qs = Qs/S. Para a UT: q = Σ qsk·Sk / Σ Sk (n.º 4.º).</P>
        {todas.filter((u) => u.ut.compartimentos.length && (u.ut.tipo === 11 || u.ut.tipo === 12)).length === 0 && <P>Não foram calculadas cargas de incêndio (fator de risco apenas nas UT XI e XII).</P>}
        {todas.filter((u) => u.ut.compartimentos.length && (u.ut.tipo === 11 || u.ut.tipo === 12)).map(({ ut, carga, cls }) => (
          <div key={ut.id} className="mb-6">
            <p className="mb-1 text-[12.5px] font-bold">{tituloUT(ut)}</p>
            {ut.compartimentos.map((c) => { const r = cargaCompartimento(c); return (
              <div key={c.id} className="avoid-break mb-3">
                <table className="tbl"><thead><tr><th colSpan={2}>{c.nome} · S = {fmt(c.area, 2)} m² · método {c.metodo === 'deterministico' ? 'determinístico' : 'probabilístico'}</th><th className="w-28 whitespace-nowrap text-right">MJ</th></tr></thead>
                  <tbody>
                    {r.linhas.map((l, i) => <tr key={i}><td>{l.desc}</td><td className="font-mono text-[11px]">{l.formula}</td><td className="num text-right">{fmt(l.parcela)}</td></tr>)}
                    {r.raiNota && <tr><td colSpan={3} className="text-[11px] text-ink-3">Rai do compartimento: {r.raiNota}</td></tr>}
                    <tr><td colSpan={2} className="font-semibold">Qs — carga de incêndio modificada do compartimento = Σ das parcelas{r.linhas.length > 1 ? ` = ${r.linhas.map((l) => fmt(l.parcela)).join(' + ')}` : ''}</td><td className="num whitespace-nowrap text-right font-bold">{fmt(r.Qs)} MJ</td></tr>
                    <tr><td colSpan={2} className="font-semibold">qs — densidade modificada = Qs / S = {fmt(r.Qs)} MJ / {fmt(c.area, 2)} m²</td><td className="num whitespace-nowrap text-right font-bold">{fmt(r.qs, 1)} MJ/m²</td></tr>
                  </tbody></table>
              </div>
            ); })}
            <div className="avoid-break">
              <table className="tbl"><thead><tr><th>Resumo da UT — compartimento corta-fogo k</th><th className="text-right">Qsk (MJ)</th><th className="text-right">Sk (m²)</th><th className="text-right">qsk (MJ/m²)</th></tr></thead>
                <tbody>
                  {ut.compartimentos.filter((c) => c.area > 0).map((c) => { const r = cargaCompartimento(c); return <tr key={c.id}><td>{c.nome}</td><td className="num text-right">{fmt(r.Qs)}</td><td className="num text-right">{fmt(c.area, 2)}</td><td className="num text-right">{fmt(r.qs, 1)}</td></tr>; })}
                  <tr className="border-t-2 border-ink"><td className="font-bold">Total da UT (Σ Qsk · Σ Sk · q)</td><td className="num whitespace-nowrap text-right font-bold">{fmt(carga.Q)}</td><td className="num whitespace-nowrap text-right font-bold">{fmt(carga.S, 2)}</td><td className="num text-right font-bold whitespace-nowrap text-fire-ink">{fmt(carga.q, 1)}</td></tr>
                </tbody></table>
              <p className="mt-2 border-l-[3px] border-fire bg-fire-soft px-3 py-2 text-[12.5px] font-semibold">Densidade de carga de incêndio modificada da UT (Despacho n.º 8954/2020, n.º 4.º, 2): q = Σ (qsk × Sk) / Σ Sk = Σ Qsk / Σ Sk = {fmt(carga.Q)} MJ / {fmt(carga.S, 2)} m² = <span className="text-[14px] text-fire-ink">{fmt(carga.q, 1)} MJ/m²</span></p>
  {(() => { const fc = cls.fatores.find((x) => x.id === 'carga'); if (!fc) return null; const cat = catAtribuida(cls); return (
    <div className="mt-2">
      <table className="tbl"><thead><tr><th>Categoria — RJ-SCIE, anexo III, {cls.quadro.replace('Quadro', 'quadro')} ({fc.rotulo.toLowerCase()})</th>{['1.ª', '2.ª', '3.ª', '4.ª'].map((c) => <th key={c} className="text-center">{c}</th>)}</tr></thead>
        <tbody><tr><td>Valores máximos do quadro</td>{fc.limites.map((l, i) => <td key={i} className={`num whitespace-nowrap text-center ${fc.cat === i + 1 ? 'bg-fire-soft font-bold text-fire-ink' : ''}`}>{l}</td>)}</tr></tbody></table>
      <p className="mt-2 border-l-[3px] border-ink bg-paper px-3 py-2 text-[12.5px]">Por este critério: q = {fmt(carga.q, 1)} MJ/m² {fc.limites[fc.cat - 1]} → <b className="text-[14px] text-fire-ink">{fc.cat}.ª categoria</b>. A categoria da UT é a mais baixa que satisfaz integralmente todos os critérios do quadro (RJ-SCIE, art. 13.º, n.os 1 e 2): {cat ? <b>{cat}.ª categoria{cls.determinantes.length ? ` (determinada por: ${cls.determinantes.join('; ').toLowerCase()})` : ''}</b> : <b className="text-alerta">por atribuir — falta {cls.falta.join('; ').toLowerCase()}</b>}.</p>
    </div>); })()}
            </div>
          </div>
        ))}

        <H1 n={S()}>Dimensionamento de extintores</H1>
        <P>Por piso, aplicam-se os dois critérios do RT-SCIE, art. 163.º n.º 2, e prevalece o mais exigente: a) 18 L de agente extintor padrão — água (anexo I, art. 8.º n.º 2) — por 500 m² ou fração; b) um extintor por 200 m² ou fração, com o mínimo de dois. Acrescem os extintores dos locais e situações específicas (n.os 4 a 7 e condições específicas da UT). Distância máxima a percorrer de qualquer saída de local de risco até ao extintor: 15 m; manípulo a ≤ 1,2 m (n.os 1 e 3).</P>
        {todas.map(({ ut, ed, cls }, i) => (
          <div key={ut.id} className="avoid-break">
            <H2 n={`${sec}.${i + 1}`}>{ed.nome} · {tituloUT(ut)}</H2>
            <QuadroExtintores ut={ut} cat={cls.cat} />
          </div>
        ))}
        {(() => { const linhas = todas.flatMap(({ ut, ed, cls }) => dimensionarExtintores(ut, cls.cat).mapa.map((l) => ({ ut: `${ed.nome} · ${tituloUT(ut)}`, l }))); return linhas.length > 0 && (<>
          <H2 n={`${sec}.${todas.length + 1}`}>Mapa de extintores — o quê, onde e quantos</H2>
          <MapaExtintores linhas={linhas} />
          <H2 n={`${sec}.${todas.length + 2}`}>Totais de extintores e outros meios</H2>
          <TotaisExtintores linhas={linhas.map((x) => x.l)} />
        </>); })()}

        <H1 n={S()}>Condições de segurança exigíveis</H1>
        <P>Organizadas segundo os capítulos II a VII da memória descritiva do anexo IV do RJ-SCIE (art. 2.º), com a mesma numeração. Para cada utilização-tipo, as exigências são concretizadas em função da categoria de risco, da altura do edifício e dos locais de risco. «Verificar» identifica exigências cujo cumprimento depende de elementos de projeto não introduzidos; «n/a» indica a razão legal da não aplicação.</P>
        {todas.map(({ ut, ed, medidas, cls }, ui) => (
          <div key={ut.id} className="mb-8">
            <p className="avoid-break mb-3 border-b-2 border-ink pb-1 text-[14px] font-bold">{sec}.{ui + 1} {ed.nome} · {tituloUT(ut)} · {nomeCat(cls)}</p>
            {medidas.length === 0 && <P>Medidas não determinadas: {cls.falta.length ? 'a categoria de risco ainda não está atribuída' : `falta indicar ${[...faltaParaMedidas(ut), ...faltaEdificio(ed)].map(([k]) => k.toLowerCase()).join(', ')}`}.</P>}
            {GRUPOS.filter((g) => g !== 'Medidas de autoproteção').map((g) => {
              const secs = SECOES.filter((x) => x.g === g);
              const temAlgo = secs.some((x) => medidas.some((m) => m.tema === x.c));
              if (!temAlgo) return null;
              return (
                <div key={g} className="mb-4">
                  <p className="keep-next avoid-break mb-1.5 mt-3 font-display text-[13.5px] font-bold">{g}</p>
                  {secs.map((x) => {
                    const todasSec = medidas.filter((m) => m.tema === x.c);
                    if (!todasSec.length) return null;
                    const m = filtraMed(todasSec);
                    return (
                      <div key={x.c} className="mb-2.5">
                        {x.c !== '0' && x.c !== 'ESP' && <p className="keep-next avoid-break mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-fire-ink">{secRotulo(x.c)}</p>}
                        {m.length ? (
                          <table className="tbl"><tbody>{m.map((y) => (
                            <tr key={y.id}><td className="w-[27%] font-semibold">{y.titulo}{y.estado !== 'aplica' && <span className={`ml-1 font-mono text-[9.5px] ${y.estado === 'verificar' ? 'text-warn' : 'text-ink-4'}`}>[{y.estado === 'verificar' ? 'verificar' : 'n/a'}]</span>}</td><td className="text-[11.5px] leading-relaxed">{y.exigencia}{y.motivo && <span className="block italic text-ink-3">{y.motivo}</span>}</td><td className="w-[20%] text-[10px] text-ink-3">{y.base}</td></tr>
                          ))}</tbody></table>
                        ) : (
                          <p className="border-b border-paper-3 py-1.5 text-[11px] italic text-ink-3">Não aplicável a esta utilização-tipo — {todasSec.map((y) => y.motivo).filter(Boolean).join(' ')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}

        <H1 n={S()}>Análise regulamentar e medidas corretivas</H1>
        {(() => {
          const t = todas.map((x) => progresso(x.ut, x.medidas)).reduce((a, b) => ({ m: a.m + b.marcadas, n: a.n + b.naoCumpre, c: a.c + b.cumpre }), { m: 0, n: 0, c: 0 });
          return t.m > 0 ? (
            <div className={`avoid-break mb-5 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-l-[4px] px-4 py-3 ${t.n ? 'border-alerta bg-alerta-soft' : 'border-ok bg-ok-soft'}`}>
              <span className="font-display text-[15px] font-extrabold">{t.n ? `${t.n} não conformidade${t.n === 1 ? '' : 's'} a corrigir` : 'Sem não conformidades'}</span>
              <span className="text-[12px]">{t.m} exigências verificadas · {t.c} cumprem · {t.n} não cumprem</span>
              {t.n > 0 && <span className="text-[12px]">Plano de correção: ver «Síntese para o cliente» e o quadro de medidas corretivas de cada UT.</span>}
            </div>
          ) : null;
        })()}
        {todas.every(({ ut, medidas }) => { const g = progresso(ut, medidas); return g.marcadas === 0 && g.porVerificar === 0; }) ? (
          <P>Não foi registada verificação no local das exigências identificadas no capítulo anterior. A análise de conformidade (cumpre / não cumpre / não aplicável) é feita no passo «Medidas» de cada utilização-tipo.</P>
        ) : (
          <>
            <P>Verificação no local das exigências do capítulo anterior, organizada pelos capítulos II a VII do anexo IV do RJ-SCIE. «Sim» indica pelo menos uma desconformidade na secção; «Não», todas as exigências verificadas cumprem; «N.A.», a secção não se aplica; «—», verificação incompleta. Cada desconformidade remete para o artigo do RJ-SCIE ou do RT-SCIE que não é cumprido.</P>
            {todas.map(({ ut, ed, medidas }, ui) => {
              const pg = progresso(ut, medidas);
              const ds = desconformidades(ut, medidas);
              const secs = SECOES.filter((x) => /^(II|III|IV|V|VI|VII)\./.test(x.c) && medidas.some((m) => m.tema === x.c));
              return (
                <div key={ut.id} className="mb-8">
                  <p className="keep-next avoid-break mb-2 border-b-2 border-ink pb-1 text-[13.5px] font-bold">{sec}.{ui + 1} {ed.nome} · {tituloUT(ut)}</p>
                  <p className="mb-2 text-[11.5px] text-ink-3">{pg.marcadas} de {pg.total} exigências verificadas · cumpre {pg.cumpre} · não cumpre {pg.naoCumpre} · não aplicável {pg.na}{pg.porVerificar ? ` · por verificar ${pg.porVerificar}` : ''}</p>
                  <table className="tbl mb-4">
                    <thead><tr><th>Exigência regulamentar (anexo IV) — há desconformidades?</th><th className="w-14 text-center">Sim</th><th className="w-14 text-center">Não</th><th className="w-14 text-center">N.A.</th><th className="w-24">Notas</th></tr></thead>
                    <tbody>
                      {GRUPOS.filter((g) => secs.some((x) => x.g === g)).map((g) => (
                        <Fragment key={g}>
                          <tr><td colSpan={5} className="bg-paper font-display text-[11.5px] font-bold">{g}</td></tr>
                          {secs.filter((x) => x.g === g).map((x) => {
                            const e = estadoSeccao(ut, medidas, x.c);
                            const notas = ds.filter((d) => d.sec === x.c).map((d) => d.letra + ')').join(' ');
                            return (
                              <tr key={x.c}>
                                <td className="text-[11px]">{secRotulo(x.c)}</td>
                                <td className="text-center font-bold text-alerta">{e === 'sim' ? '■' : ''}</td>
                                <td className="text-center font-bold text-ok">{e === 'nao' ? '■' : ''}</td>
                                <td className="text-center font-bold text-ink">{e === 'na' ? '■' : ''}</td>
                                <td className="font-mono text-[11px]">{e === 'pendente' ? '—' : notas}</td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                  {ds.length > 0 && (
                    <>
                      <p className="keep-next mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-fire-ink">Desconformidades registadas</p>
                      <table className="tbl mb-4"><tbody>{ds.map((d) => (
                        <tr key={d.medida.key}><td className="w-8 font-mono font-bold">{d.letra})</td><td className="text-[11.5px]"><b>{d.medida.titulo}</b>{d.ver.obs ? ` — ${d.ver.obs}` : ''}<span className="block text-ink-3">Exigência: {d.medida.exigencia}</span>
                          {(d.ver.fotos?.length ?? 0) > 0 && <span className="mt-1.5 flex flex-wrap gap-1.5">{d.ver.fotos!.map((id) => ut.levantamento?.find((a) => a.id === id)).filter((a) => a?.imagem).map((a) => <img key={a!.id} src={a!.imagem} alt="" className="h-[30mm] w-auto max-w-[45mm] border border-paper-3 object-contain" />)}</span>}
                        </td><td className="w-[22%] text-[10px] text-ink-3">{d.medida.base}{d.ver.ponto ? <span className="block text-alerta">Assinalada em planta</span> : null}</td></tr>
                      ))}</tbody></table>
                      {p.plantas.filter((pl) => ds.some((d) => d.ver.ponto?.plantaId === pl.id)).map((pl) => (
                        <figure key={pl.id} className="avoid-break mb-4 text-center">
                          <div className="relative inline-block border border-paper-3 align-top">
                            <img src={pl.imagem} alt="" className="block max-h-[170mm] max-w-full" />
                            {ds.filter((d) => d.ver.ponto?.plantaId === pl.id).map((d) => (
                              <span key={d.medida.key} className="absolute grid h-[6mm] w-[6mm] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-alerta font-mono text-[9px] font-bold text-white" style={{ left: `${d.ver.ponto!.x * 100}%`, top: `${d.ver.ponto!.y * 100}%` }}>{d.letra}</span>
                            ))}
                          </div>
                          <figcaption className="mt-1 text-left text-[10.5px] text-ink-3">Localização das desconformidades — {pl.titulo}{pl.escala ? ` (${pl.escala})` : ''}</figcaption>
                        </figure>
                      ))}
                      <p className="keep-next mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-fire-ink">Medidas corretivas / compensatórias</p>
                      <table className="tbl"><thead><tr><th className="w-8">Ref.</th><th>Medida</th><th className="w-28">Prazo</th></tr></thead><tbody>{ds.map((d) => (
                        <tr key={d.medida.key}><td className="font-mono font-bold">{d.letra})</td><td className="text-[11.5px]">{d.ver.corretiva || <span className="italic text-ink-3">Por definir</span>}</td><td className="text-[11.5px]">{d.ver.prazo || '—'}</td></tr>
                      ))}</tbody></table>
                    </>
                  )}
                  {(() => {
                    const pv = porVerificar(ut, medidas);
                    return pv.length > 0 && (
                      <>
                        <p className="keep-next mb-1 mt-3 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-warn">Exigências por verificar</p>
                        <table className="tbl mb-4"><tbody>{pv.map(({ medida, ver }) => (
                          <tr key={medida.key}><td className="text-[11.5px]"><b>{medida.titulo}</b><span className="block text-ink-3">Falta: {ver.falta || 'elementos para concluir a verificação'}</span></td><td className="w-[22%] text-[10px] text-ink-3">{medida.base}</td></tr>
                        ))}</tbody></table>
                      </>
                    );
                  })()}
                  {incluirEvid && (() => {
                    const ev = evidenciasConformidade(ut, medidas);
                    return ev.length > 0 && (
                      <>
                        <p className="keep-next mb-1 mt-3 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-ok">Evidências de conformidade</p>
                        <table className="tbl mb-4"><tbody>{ev.map(({ medida, ver }) => (
                          <tr key={medida.key} className="avoid-break"><td className="text-[11.5px]"><b>{medida.titulo}</b>
                            <span className="mt-1.5 flex flex-wrap gap-1.5">{ver.fotos!.map((id) => ut.levantamento?.find((a) => a.id === id)).filter((a) => a?.imagem).map((a) => <img key={a!.id} src={a!.imagem} alt="" className="h-[30mm] w-auto max-w-[45mm] border border-paper-3 object-contain" />)}</span>
                          </td><td className="w-[22%] text-[10px] text-ink-3">{medida.base}</td></tr>
                        ))}</tbody></table>
                      </>
                    );
                  })()}
                </div>
              );
            })}
            {(() => {
              const linhas = todas.flatMap(({ ut, medidas }) => desconformidades(ut, medidas).filter((d) => d.ver.corretiva).map((d) => ({ ut, d })));
              if (!linhas.length) return null;
              const prazos = opcoesPrazo().filter((p) => linhas.some((l) => l.d.ver.prazo === p));
              return (
                <div className="avoid-break mt-6">
                  <p className="keep-next mb-1 font-display text-[13.5px] font-bold">Planificação das medidas corretivas / compensatórias</p>
                  <table className="tbl"><thead><tr><th>Intervenção / medida a implementar</th><th className="w-24">UT</th>{prazos.map((p) => <th key={p} className="w-16 text-center text-[9px]">{p}</th>)}</tr></thead>
                    <tbody>{linhas.map(({ ut, d }) => (
                      <tr key={ut.id + d.medida.key}><td className="text-[11px]">{d.ver.corretiva}</td><td className="text-[10.5px]">{ROMANO[ut.tipo]} — {nomeUT(ut).nome}</td>{prazos.map((p) => <td key={p} className={`text-center ${d.ver.prazo === p ? 'bg-ink text-white' : ''}`}>{d.ver.prazo === p ? '■' : ''}</td>)}</tr>
                    ))}</tbody></table>
                </div>
              );
            })()}
          </>
        )}

        <H1 n={S()}>Medidas de autoproteção</H1>
        <P>RJ-SCIE, arts. 20.º a 22.º; RT-SCIE, título VII (arts. 193.º a 207.º). As medidas de autoproteção constituem documento autónomo, sujeito a parecer da entidade competente.</P>
        {todas.map(({ ut, ed, medidas }) => {
          const m = filtraMed(medidas.filter((x) => x.tema === 'MAP'));
          return (
            <div key={ut.id} className="avoid-break mb-4">
              <p className="mb-1 text-[12.5px] font-bold">{ed.nome} · {tituloUT(ut)}</p>
              <table className="tbl"><tbody>{m.map((x) => <tr key={x.id}><td className="w-[27%] font-semibold">{x.titulo}</td><td className="text-[11.5px]">{x.exigencia}{x.motivo && <span className="block italic text-ink-3">{x.motivo}</span>}</td><td className="w-[20%] text-[10px] text-ink-3">{x.base}</td></tr>)}</tbody></table>
            </div>
          );
        })}
      </Sheet>

      {/* -------------------------- PEÇAS DESENHADAS ---------------------- */}
      {p.plantas.length > 0 && p.plantas.map((pl, i) => (
        <Sheet key={pl.id} className="page-break flex flex-col">
          {i === 0 && <H1 n={String(sec + 1)}>Peças desenhadas</H1>}
          <div className="flex flex-1 items-center justify-center border border-ink p-2"><img src={pl.imagem} className="max-h-[220mm] w-full object-contain" /></div>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-4 border-t-[3px] border-ink pt-2 text-[11px]">
            <div><p className="font-bold">{String(i + 1).padStart(2, '0')} — {pl.titulo}</p><p className="text-ink-3">{TIPO_PLANTA[pl.tipo]}{pl.legenda ? ` · ${pl.legenda}` : ''}</p></div>
            <p className="font-mono">{pl.escala ? `Escala ${pl.escala}` : ''}</p>
          </div>
        </Sheet>
      ))}
      {(() => { if (p.plantas.length) sec++; else sec++; return null; })()}

      {/* --------------------------- CONCLUSÕES --------------------------- */}
      <Sheet className="page-break">
        <H1 n={String(sec + 1)}>Conclusões</H1>
        {p.plantas.length === 0 && <P>Não foram anexadas peças desenhadas. O anexo IV do RJ-SCIE (art. 3.º) exige planta de localização, cortes e alçados, planta de implantação e plantas de todos os pisos.</P>}
        <table className="tbl mb-4"><thead><tr><th>Edifício</th><th>UT</th><th className="text-right">Efetivo</th><th className="text-right">q (MJ/m²)</th><th>Categoria</th><th>Medidas aplicáveis</th></tr></thead>
          <tbody>{todas.map(({ ut, ed, ef, carga, cls, medidas }) => (
            <tr key={ut.id}><td>{ed.nome}</td><td><span className="num font-semibold">{ROMANO[ut.tipo]}</span> <span className="text-[10.5px] text-ink-3">{utInfo(ut.tipo).nome}</span></td><td className="num text-right">{ef.total}</td><td className="num text-right">{carga.S ? fmt(carga.q, 1) : '—'}</td><td className="font-semibold">{nomeCat(cls)}</td><td className="num">{medidas.filter((m) => m.estado === 'aplica').length} (+{medidas.filter((m) => m.estado === 'verificar').length} a verificar)</td></tr>
          ))}</tbody></table>
        {todas.map(({ ut, cls }) => (
          <P key={ut.id}>A UT {ROMANO[ut.tipo]} ({nomeUT(ut).nome}) {cls.falta.length ? <>ainda <b>não tem categoria atribuída</b></> : <>classifica-se na <b>{nomeCat(cls)}</b> de risco</>}{cls.determinantes.length ? `, determinada por ${cls.determinantes.join(' e ').toLowerCase()}` : ''}{cls.falta.length ? ` — dados em falta: ${cls.falta.join(', ')}` : ''}.</P>
        ))}
        {maxCat && <P>Entidade competente para a categoria mais gravosa: {maxCat === 1 ? 'câmara municipal' : 'ANEPC'} (RJ-SCIE, art. 5.º).</P>}
        {p.conclusoes && <div className="mt-4 whitespace-pre-line text-[12px] leading-[1.65]">{p.conclusoes}</div>}

        <TermoAutor p={p} com={comAss} documento="o presente documento" titulo={<H1 n={String(sec + 2)}>Termo do autor</H1>} />
      </Sheet>

      {/* ------------------------------ ANEXOS ----------------------------- */}
      <Sheet className="page-break">
        <H1 n={String(sec + 3)}>Anexos</H1>
        <RevisoesDistribuicao p={p} />
        <H2 n="C">Glossário — definições do RJ-SCIE (art. 2.º)</H2>
        <table className="tbl mb-6"><tbody>{GLOSSARIO.map((g) => (
          <tr key={g.al} className="avoid-break"><td className="w-[30%] font-semibold">{g.termo}<span className="block font-mono text-[9.5px] font-normal text-ink-3">art. 2.º {g.al})</span></td><td className="text-[11px] leading-relaxed">{g.def.charAt(0).toUpperCase() + g.def.slice(1)}.</td></tr>
        ))}</tbody></table>
        <H2 n="D">Lista de abreviaturas</H2>
        <Abreviaturas lista={ABREVIATURAS} />
      </Sheet>
    </div>
  );
}

