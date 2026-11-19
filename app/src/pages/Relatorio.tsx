import { nomeUT, tituloUT } from '../nome';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { useP } from './ProjetoShell';
import { DIPLOMAS, LOCAIS, ROMANO, SUBTIPOS_C, utInfo } from '../data/rjscie';
import { classeAltura } from '../data/rtscie';
import { CAT_NOME, CAT_RISCO, cargaCompartimento, cargaUT, efetivoEspaco, fmt } from '../engine/calc';
import { contexto, gerarMedidas, TEMAS, type Medida } from '../engine/medidas';
import QuadroAnexo from './ut/QuadroAnexo';
import { CAT_COR, Toggle } from '../ui/primitives';
import type { Cat, LocalRisco } from '../data/types';

const TIPO_PLANTA: Record<string, string> = {
  localizacao: 'Planta de localização', implantacao: 'Planta de implantação', cortes: 'Cortes e alçados', piso: 'Planta de piso', outra: 'Peça desenhada',
};

function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`report-page mx-auto mb-8 w-[210mm] min-h-[297mm] bg-white px-[16mm] py-[16mm] shadow-[0_1px_0_#0F0F0E,8px_8px_0_rgba(15,15,14,0.12)] ${className}`}>{children}</section>;
}

function H1({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h2 className="avoid-break mb-5 mt-2 flex items-baseline gap-3 border-b-[3px] border-ink pb-2">
      <span className="font-mono text-[13px] font-semibold text-fire">{n}</span>
      <span className="font-display text-[24px] font-extrabold tracking-tight">{children}</span>
    </h2>
  );
}
function H2({ n, children }: { n: string; children: ReactNode }) {
  return <h3 className="avoid-break mb-2 mt-6 flex items-baseline gap-2 font-display text-[15.5px] font-bold"><span className="font-mono text-[11.5px] text-ink-3">{n}</span>{children}</h3>;
}
const P = ({ children }: { children: ReactNode }) => <p className="mb-2.5 text-[12px] leading-[1.6] text-ink-2">{children}</p>;

export default function Relatorio() {
  const { p } = useP();
  const [incluirNao, setIncluirNao] = useState(false);
  const [incluirVerif, setIncluirVerif] = useState(true);

  const dados = useMemo(() => p.edificios.map((ed) => ({
    ed,
    uts: ed.uts.map((ut) => {
      const ctx = contexto(ed, ut);
      return { ...ctx, carga: cargaUT(ut), medidas: gerarMedidas(ctx) };
    }),
  })), [p]);
  const todas = dados.flatMap((d) => d.uts);
  const maxCat = todas.length ? (Math.max(...todas.map((u) => u.cls.cat)) as Cat) : null;
  const dataPt = p.data ? new Date(p.data + 'T00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  useEffect(() => {
    const st = document.createElement('style');
    const esc = (s: string) => s.replace(/["\\]/g, '');
    st.textContent = `@page { @top-left { content: "${esc(p.empresa.nome || 'SCIE')}"; font: 8pt Inter, sans-serif; color: #5C5B55; }
      @top-right { content: "${esc(p.referencia || p.nome)} · v${esc(p.versao)}"; font: 8pt 'JetBrains Mono', monospace; color: #5C5B55; }
      @bottom-left { content: "Segurança contra incêndio em edifícios — ${esc(p.nome)}"; font: 7.5pt Inter, sans-serif; color: #8E8D86; }
      @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 8pt 'JetBrains Mono', monospace; color: #0F0F0E; } }
      @page :first { @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }`;
    document.head.appendChild(st);
    return () => { st.remove(); };
  }, [p.empresa.nome, p.referencia, p.nome, p.versao]);

  const imprimir = () => {
    const t = document.title;
    document.title = `${(p.referencia || p.nome).replace(/[^\w\-À-ú ]+/g, '_')} — Relatório SCIE v${p.versao}`;
    window.print();
    setTimeout(() => { document.title = t; }, 500);
  };

  const filtraMed = (m: Medida[]) => m.filter((x) => x.estado === 'aplica' || (incluirVerif && x.estado === 'verificar') || (incluirNao && x.estado === 'nao'));

  const locaisLista = todas.flatMap((u) => u.ut.espacos.map((e) => ({ u, e, c: efetivoEspaco(e) })));
  let sec = 0;
  const S = () => String(++sec);

  return (
    <div className="bg-paper-3/60 pb-16">
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-4 px-6 py-3">
          <div className="mr-auto">
            <p className="label">Relatório técnico</p>
            <p className="font-display text-[17px] font-bold">{p.nome}</p>
          </div>
          <div className="w-[230px]"><Toggle checked={incluirVerif} onChange={setIncluirVerif} label="Incluir medidas «a verificar»" /></div>
          <div className="w-[230px]"><Toggle checked={incluirNao} onChange={setIncluirNao} label="Incluir não aplicáveis" /></div>
          <button className="btn-fire h-11 px-5" onClick={imprimir}><Printer size={16} /> Descarregar PDF</button>
        </div>
        <p className="mx-auto max-w-[1100px] px-6 pb-2 text-[11.5px] text-ink-3">No diálogo de impressão escolha «Guardar como PDF», papel A4, margens «Predefinição» e ative «Gráficos de fundo». Resultado em texto vetorial, pesquisável.</p>
      </div>

      {/* ------------------------------ CAPA ------------------------------ */}
      <Sheet className="flex flex-col">
        <div className="flex items-start justify-between">
          {p.empresa.logo ? <img src={p.empresa.logo} className="max-h-[70px] max-w-[220px] object-contain" /> : <span className="font-display text-[20px] font-extrabold">{p.empresa.nome || 'Empresa'}</span>}
          <span className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-wider text-ink-3">{p.referencia || 'S/ ref.'}<br />Versão {p.versao}<br />{dataPt}</span>
        </div>
        <div className="mt-[52mm]">
          <div className="mb-6 h-[6px] w-24 bg-fire" />
          <p className="label mb-3">{p.tipoIntervencao}</p>
          <h1 className="h-display text-[44px]">Segurança contra incêndio em edifícios</h1>
          <p className="mt-4 font-display text-[22px] font-bold leading-tight text-ink-2">{p.nome}</p>
          <p className="mt-2 text-[13px] text-ink-3">{[p.morada, p.concelho, p.distrito].filter(Boolean).join(', ')}</p>
        </div>
        <div className="mt-auto grid grid-cols-[1fr_auto] items-end gap-6 border-t-[3px] border-ink pt-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[11.5px]">
            <div><p className="label">Cliente</p><p className="font-semibold">{p.cliente || '—'}</p></div>
            <div><p className="label">Autor</p><p className="font-semibold">{p.autor.nome || '—'}</p><p className="text-ink-3">{[p.autor.qualificacao, p.autor.ordem && `${p.autor.ordem} n.º ${p.autor.numero}`].filter(Boolean).join(' · ')}</p></div>
            <div><p className="label">Utilizações-tipo</p><p className="font-mono font-semibold">{todas.map((u) => ROMANO[u.ut.tipo]).join(' · ') || '—'}</p></div>
            <div><p className="label">Edifícios</p><p className="font-semibold">{p.edificios.length}</p></div>
          </div>
          {maxCat && (
            <div className={`${CAT_COR[maxCat]} px-6 py-4 text-center text-white`}>
              <p className="font-mono text-[9px] uppercase tracking-wider">Categoria mais gravosa</p>
              <p className="h-display text-[56px]">{maxCat}.ª</p>
            </div>
          )}
        </div>
      </Sheet>

      {/* -------------------- FICHA TÉCNICA E ÍNDICE ---------------------- */}
      <Sheet className="page-break">
        <H1 n="—">Ficha técnica</H1>
        <table className="tbl mb-10">
          <tbody>
            {[
              ['Documento', `Relatório de segurança contra incêndio em edifícios — ${p.tipoIntervencao}`],
              ['Projeto', p.nome], ['Referência', p.referencia || '—'], ['Cliente / entidade responsável', p.cliente || '—'],
              ['Localização', [p.morada, p.concelho, p.distrito].filter(Boolean).join(', ') || '—'], ['Coordenadas', p.coordenadas || '—'],
              ['Autor', [p.autor.nome, p.autor.qualificacao].filter(Boolean).join(', ') || '—'],
              ['Associação profissional', p.autor.ordem ? `${p.autor.ordem}, n.º ${p.autor.numero || '—'}` : '—'], ['Registo ANEPC do autor', p.autor.registoAnepc || '—'],
              ['Empresa', [p.empresa.nome, p.empresa.nif && `NIF ${p.empresa.nif}`].filter(Boolean).join(' · ') || '—'],
              ['Data / versão', `${dataPt} · v${p.versao}`],
            ].map(([a, b]) => <tr key={a}><td className="w-[42%] font-semibold">{a}</td><td>{b}</td></tr>)}
          </tbody>
        </table>
        <H1 n="—">Índice</H1>
        <ol className="space-y-1.5 text-[12.5px]">
          {['Apresentação da empresa', 'Introdução e enquadramento legal', 'Caracterização dos edifícios e das utilizações-tipo', 'Classificação e identificação do risco', 'Cálculo do efetivo', 'Densidade de carga de incêndio modificada', 'Condições de segurança exigíveis', 'Medidas de autoproteção', 'Peças desenhadas', 'Conclusões', 'Termo do autor'].map((t, i) => (
            <li key={t} className="flex items-baseline gap-3 border-b border-dotted border-ink-4 pb-1"><span className="w-6 font-mono text-fire">{i + 1}</span>{t}</li>
          ))}
        </ol>
      </Sheet>

      {/* ------------------------ CORPO DO RELATÓRIO ---------------------- */}
      <Sheet className="page-break">
        <H1 n={S()}>Apresentação da empresa</H1>
        <div className="mb-6 grid grid-cols-[1fr_190px] gap-6">
          <div className="whitespace-pre-line text-[12px] leading-[1.65] text-ink-2">{p.empresa.apresentacao || 'Texto de apresentação da empresa por preencher em «Dados, empresa e autor».'}</div>
          <div className="border-l-[3px] border-fire pl-4 text-[11px] leading-relaxed">
            {p.empresa.logo && <img src={p.empresa.logo} className="mb-3 max-h-[50px] object-contain" />}
            <p className="font-semibold">{p.empresa.nome}</p>
            <p className="text-ink-3">{p.empresa.morada}</p>
            {p.empresa.nif && <p>NIF {p.empresa.nif}</p>}
            {p.empresa.telefone && <p>{p.empresa.telefone}</p>}
            {p.empresa.email && <p>{p.empresa.email}</p>}
            {p.empresa.website && <p>{p.empresa.website}</p>}
            {p.empresa.alvara && <p className="mt-1">Registo ANEPC: {p.empresa.alvara}</p>}
          </div>
        </div>

        <H1 n={S()}>Introdução e enquadramento legal</H1>
        <H2 n={`${sec}.1`}>Objetivo</H2>
        <P>{p.objetivo || `O presente documento caracteriza as utilizações-tipo de ${p.nome}, determina o efetivo, a densidade de carga de incêndio modificada (quando aplicável) e a categoria de risco de cada utilização-tipo, e identifica as condições de segurança contra incêndio exigíveis, nos termos do regime jurídico e do regulamento técnico de segurança contra incêndio em edifícios.`}</P>
        <H2 n={`${sec}.2`}>Localização</H2>
        <P>{[p.morada, p.concelho, p.distrito].filter(Boolean).join(', ') || '—'}{p.coordenadas ? ` (coordenadas ${p.coordenadas})` : ''}.</P>
        <H2 n={`${sec}.3`}>Legislação aplicada</H2>
        <table className="tbl mb-2"><thead><tr><th>Sigla</th><th>Diploma</th><th>Objeto</th></tr></thead>
          <tbody>{DIPLOMAS.map((d) => <tr key={d.sigla}><td className="font-semibold">{d.sigla}</td><td>{d.titulo}</td><td>{d.objeto}</td></tr>)}</tbody></table>
        <P>A estrutura deste relatório segue o conteúdo da memória descritiva e justificativa definido no anexo IV do RJ-SCIE. Todas as exigências indicadas citam o artigo e o quadro de onde resultam.</P>

        <H1 n={S()}>Caracterização dos edifícios e das utilizações-tipo</H1>
        {dados.map(({ ed, uts }, i) => (
          <div key={ed.id} className="avoid-break mb-5">
            <H2 n={`${sec}.${i + 1}`}>{ed.nome}</H2>
            <table className="tbl mb-2"><tbody>
              <tr><td className="w-[42%] font-semibold">Altura do edifício (RT-SCIE, anexo I)</td><td className="num">{fmt(ed.altura, 2)} m — {classeAltura(ed.altura).toLowerCase()} altura</td></tr>
              <tr><td className="font-semibold">Pisos acima / abaixo do plano de referência</td><td className="num">{ed.pisosAcima} / {ed.pisosAbaixo}</td></tr>
              <tr><td className="font-semibold">Utilização</td><td>{uts.length > 1 ? `Mista (${uts.map((u) => 'UT ' + ROMANO[u.ut.tipo]).join(', ')})${ed.comunicacoesComuns ? ', com comunicações interiores comuns' : ', sem comunicações interiores comuns'}` : uts.length ? `Exclusiva (UT ${ROMANO[uts[0].ut.tipo]})` : '—'}</td></tr>
              <tr><td className="font-semibold">Edifício independente (art. 2.º j))</td><td>{ed.independente ? 'Sim' : 'Não'}</td></tr>
            </tbody></table>
            {ed.descricao && <P>{ed.descricao}</P>}
            {uts.map(({ ut }) => (
              <div key={ut.id} className="mb-3 border-l-[3px] border-ink pl-3">
                <p className="text-[12.5px] font-bold">{tituloUT(ut)}</p>
                <p className="text-[11.5px] text-ink-3">{utInfo(ut.tipo).definicao} (RJ-SCIE, art. 8.º n.º 1 {utInfo(ut.tipo).alinea})</p>
                {ut.descricao && <p className="mt-1 text-[12px]">{ut.descricao}</p>}
                {ut.pisos.length > 0 && (
                  <table className="tbl mt-2"><thead><tr><th>Piso</th><th className="text-right">Cota (m)</th><th className="text-right">Área (m²)</th><th>Observação</th></tr></thead>
                    <tbody>{ut.pisos.map((pi) => <tr key={pi.id}><td>{pi.nome}</td><td className="num text-right">{fmt(pi.cota, 2)}</td><td className="num text-right">{fmt(pi.area, 1)}</td><td>{pi.tecnico ? 'Só instalações técnicas' : ''}</td></tr>)}</tbody></table>
                )}
              </div>
            ))}
          </div>
        ))}

        <H1 n={S()}>Classificação e identificação do risco</H1>
        <H2 n={`${sec}.1`}>Locais de risco (RJ-SCIE, art. 10.º)</H2>
        {locaisLista.length ? (
          <table className="tbl mb-3"><thead><tr><th>UT</th><th>Espaço</th><th>Piso</th><th>Local</th><th className="text-right">Efetivo</th><th>Enquadramento</th></tr></thead>
            <tbody>{locaisLista.map(({ u, e, c }) => (
              <tr key={e.id}><td className="num">{ROMANO[u.ut.tipo]}</td><td>{e.nome || nomeUT(u.ut).nome}</td><td>{e.piso}</td><td className="font-semibold">{e.local === 'Cag' ? 'C agrav.' : e.local}</td><td className="num text-right">{c.valor}</td>
                <td className="text-[11px] text-ink-3">{e.subtipoC ? SUBTIPOS_C.find((s) => s.id === e.subtipoC)?.txt : LOCAIS[e.local as LocalRisco].nome}{e.local === 'A' && (c.valor > 100 || (e.efetivoPublico ?? 0) > 50) && <span className="block font-semibold text-fire">Efetivo &gt; 100 ou público &gt; 50: corresponde a local de risco B (art. 10.º n.º 1 b)).</span>}</td></tr>
            ))}</tbody></table>
        ) : <P>Sem espaços registados.</P>}
        <H2 n={`${sec}.2`}>Fatores e categorias de risco (RJ-SCIE, arts. 12.º e 13.º e anexo III)</H2>
        {todas.map(({ ut, cls, ed }) => (
          <div key={ut.id} className="avoid-break mb-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12.5px] font-bold">{ed.nome} · {tituloUT(ut)}</p>
              <span className={`${CAT_COR[cls.cat]} px-2 py-0.5 font-mono text-[11px] font-semibold text-white`}>{CAT_NOME[cls.cat]}</span>
            </div>
            <QuadroAnexo c={cls} titulo={`${cls.quadro} do anexo III`} />
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
              {cls.cat === 1 ? 'Todos os fatores cumprem os limites da 1.ª categoria.' : `Fator(es) determinante(s): ${cls.determinantes.join('; ')}. Categoria atribuída nos termos do art. 13.º n.º 2.`} {cls.notas.join(' ')} {CAT_RISCO[cls.cat]}.
            </p>
          </div>
        ))}
        <table className="tbl"><thead><tr><th>Edifício</th><th>UT</th><th>Designação</th><th>Categoria</th></tr></thead>
          <tbody>{todas.map(({ ut, ed, cls }) => <tr key={ut.id}><td>{ed.nome}</td><td className="num">{ROMANO[ut.tipo]}</td><td>{nomeUT(ut).nome}</td><td className="font-semibold">{CAT_NOME[cls.cat]}</td></tr>)}</tbody></table>

        <H1 n={S()}>Cálculo do efetivo</H1>
        <P>O efetivo é o somatório dos efetivos de todos os espaços suscetíveis de ocupação (RT-SCIE, art. 51.º n.º 1), arredondados ao inteiro superior. A correção pelo fator 1,3 (art. 51.º n.º 5) aplica-se apenas ao dimensionamento das vias de evacuação e saídas.</P>
        {todas.filter((u) => u.ut.espacos.length).map(({ ut, ef }) => (
          <div key={ut.id} className="avoid-break mb-5">
            <p className="mb-1 text-[12.5px] font-bold">{tituloUT(ut)}</p>
            <table className="tbl"><thead><tr><th>Espaço</th><th>Cálculo</th><th>Base legal</th><th className="text-right">Efetivo</th></tr></thead>
              <tbody>
                {ut.espacos.map((e) => { const c = efetivoEspaco(e); return (
                  <tr key={e.id} className={e.naoSimultaneo ? 'text-ink-4' : ''}><td>{e.nome || nomeUT(ut).nome}<br /><span className="ref">{e.piso} · local {e.local === 'Cag' ? 'C agrav.' : e.local}</span></td><td className="font-mono text-[11px]">{c.formula}{e.mobilidadeReduzida ? ` (evac.: ×1,3 = ${c.evacuacao})` : ''}</td><td className="text-[10.5px] text-ink-3">{c.base}{e.naoSimultaneo ? ' · não somado (n.º 9)' : ''}{e.justificacao ? ` · ${e.justificacao}` : ''}</td><td className="num text-right font-semibold">{c.valor}</td></tr>
                ); })}
                <tr><td colSpan={3} className="font-bold">Efetivo da UT{ef.origem === 'manual' ? ' (valor introduzido manualmente)' : ''}</td><td className="num text-right text-[14px] font-bold">{ef.total}</td></tr>
                {(ef.emD > 0 || ef.emE > 0) && <tr><td colSpan={3}>Efetivo em locais de risco D / E</td><td className="num text-right">{ef.emD} / {ef.emE}</td></tr>}
              </tbody></table>
          </div>
        ))}

        <H1 n={S()}>Densidade de carga de incêndio modificada</H1>
        <P>Determinada segundo o Despacho n.º 2074/2009, na redação do Despacho n.º 8954/2020: método determinístico Qs = Σ Mi·Hi·Ci·Rai; método probabilístico Qs = Σ qsi·Si·Ci·Rai (atividades) e Qs = Σ qvi·hi·Si·Ci·Rai (armazenamento); qs = Qs/S. Para a UT: q = Σ qsk·Sk / Σ Sk (n.º 4.º).</P>
        {todas.filter((u) => u.ut.compartimentos.length && (u.ut.tipo === 11 || u.ut.tipo === 12)).length === 0 && <P>Não foram calculadas cargas de incêndio (fator de risco apenas nas UT XI e XII).</P>}
        {todas.filter((u) => u.ut.compartimentos.length && (u.ut.tipo === 11 || u.ut.tipo === 12)).map(({ ut, carga }) => (
          <div key={ut.id} className="mb-6">
            <p className="mb-1 text-[12.5px] font-bold">{tituloUT(ut)}</p>
            {ut.compartimentos.map((c) => { const r = cargaCompartimento(c); return (
              <div key={c.id} className="avoid-break mb-3">
                <table className="tbl"><thead><tr><th colSpan={2}>{c.nome} · S = {fmt(c.area, 2)} m² · método {c.metodo === 'deterministico' ? 'determinístico' : 'probabilístico'}</th><th className="text-right">MJ</th></tr></thead>
                  <tbody>
                    {r.linhas.map((l, i) => <tr key={i}><td>{l.desc}</td><td className="font-mono text-[11px]">{l.formula}</td><td className="num text-right">{fmt(l.parcela)}</td></tr>)}
                    {r.raiNota && <tr><td colSpan={3} className="text-[11px] text-ink-3">Rai do compartimento: {r.raiNota}</td></tr>}
                    <tr><td colSpan={2} className="font-semibold">Qs (carga modificada) / qs (densidade modificada)</td><td className="num text-right font-bold">{fmt(r.Qs)} MJ · {fmt(r.qs, 1)} MJ/m²</td></tr>
                  </tbody></table>
              </div>
            ); })}
            <p className="text-[12px] font-semibold">Densidade de carga de incêndio modificada da UT: q = {fmt(carga.Q)} / {fmt(carga.S, 2)} = <span className="text-fire">{fmt(carga.q, 1)} MJ/m²</span></p>
          </div>
        ))}

        <H1 n={S()}>Condições de segurança exigíveis</H1>
        <P>Exigências concretizadas para cada utilização-tipo em função da categoria de risco, da altura do edifício e dos locais de risco. «A verificar» identifica exigências cujo cumprimento depende de elementos de projeto não introduzidos.</P>
        {todas.map(({ ut, ed, medidas, cls }) => (
          <div key={ut.id} className="mb-8">
            <p className="avoid-break mb-2 border-b border-ink pb-1 text-[13.5px] font-bold">{ed.nome} · {tituloUT(ut)} · {CAT_NOME[cls.cat]}</p>
            {TEMAS.filter((t) => t !== 'Autoproteção').map((t) => {
              const m = filtraMed(medidas.filter((x) => x.tema === t));
              if (!m.length) return null;
              return (
                <div key={t} className="mb-3">
                  <p className="avoid-break mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-fire">{t}</p>
                  <table className="tbl"><tbody>{m.map((x) => (
                    <tr key={x.id}><td className="w-[27%] font-semibold">{x.titulo}{x.estado !== 'aplica' && <span className={`ml-1 font-mono text-[9.5px] ${x.estado === 'verificar' ? 'text-warn' : 'text-ink-4'}`}>[{x.estado === 'verificar' ? 'verificar' : 'n/a'}]</span>}</td><td className="text-[11.5px] leading-relaxed">{x.exigencia}{x.motivo && <span className="block italic text-ink-3">{x.motivo}</span>}</td><td className="w-[20%] text-[10px] text-ink-3">{x.base}</td></tr>
                  ))}</tbody></table>
                </div>
              );
            })}
          </div>
        ))}

        <H1 n={S()}>Medidas de autoproteção</H1>
        {todas.map(({ ut, ed, medidas }) => {
          const m = filtraMed(medidas.filter((x) => x.tema === 'Autoproteção'));
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
            <tr key={ut.id}><td>{ed.nome}</td><td className="num">{ROMANO[ut.tipo]}</td><td className="num text-right">{ef.total}</td><td className="num text-right">{carga.S ? fmt(carga.q, 1) : '—'}</td><td className="font-semibold">{CAT_NOME[cls.cat]}</td><td className="num">{medidas.filter((m) => m.estado === 'aplica').length} (+{medidas.filter((m) => m.estado === 'verificar').length} a verificar)</td></tr>
          ))}</tbody></table>
        {todas.map(({ ut, cls }) => (
          <P key={ut.id}>A UT {ROMANO[ut.tipo]} ({nomeUT(ut).nome}) classifica-se na <b>{CAT_NOME[cls.cat]}</b> de risco{cls.determinantes.length ? `, determinada por ${cls.determinantes.join(' e ').toLowerCase()}` : ''}{cls.falta.length ? ` — dados em falta: ${cls.falta.join(', ')}` : ''}.</P>
        ))}
        {maxCat && <P>Entidade competente para a categoria mais gravosa: {maxCat === 1 ? 'câmara municipal' : 'ANEPC'} (RJ-SCIE, art. 5.º).</P>}
        {p.conclusoes && <div className="mt-4 whitespace-pre-line text-[12px] leading-[1.65]">{p.conclusoes}</div>}

        <div className="avoid-break mt-[30mm]">
          <H1 n={String(sec + 2)}>Termo do autor</H1>
          <P>{p.autor.nome || '[Nome do autor]'}{p.autor.qualificacao ? `, ${p.autor.qualificacao}` : ''}{p.autor.ordem ? `, inscrito na ${p.autor.ordem} com o n.º ${p.autor.numero || '—'}` : ''}{p.autor.registoAnepc ? ` e registado na ANEPC com o n.º ${p.autor.registoAnepc}` : ''}, declara que o presente documento foi elaborado com base no Decreto-Lei n.º 220/2008, na redação da Lei n.º 123/2019, na Portaria n.º 1532/2008, na redação da Portaria n.º 135/2020, e no Despacho n.º 2074/2009, na redação do Despacho n.º 8954/2020.</P>
          <div className="mt-14 grid grid-cols-2 gap-10 text-[11.5px]">
            <div><p>{p.concelho || '__________'}, {dataPt}</p></div>
            <div className="text-center"><div className="mb-1 border-b border-ink pb-12" /><p className="font-semibold">{p.autor.nome || 'O autor'}</p><p className="text-ink-3">{p.autor.qualificacao}</p></div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
