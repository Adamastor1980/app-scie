import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Grid3x3, ChevronDown, ChevronUp, Copy, FileText, Lightbulb, Plus, Search, Trash2, X } from 'lucide-react';
import { useRiscos } from '../store';
import { useStore } from '../../store';
import { go } from '../../router';
import { Area, Faltas, Field, Text } from '../../ui/primitives';
import { BIBLIOTECA, GRUPOS, LOCAIS_TIPO, type EntradaBiblioteca } from '../biblioteca';
import { EFICACIA, ESTADO_MEDIDA, LIMITE_ACEITAVEL, NC, ND, NE, NIVEIS, TIPO_MEDIDA, calcular, faltaLinha, ndDoQuadro2, painel } from '../motor';
import { novaLinha, novaMedida, rid } from '../dados';
import type { AvaliacaoRiscos, Eficacia, EstadoMedida, LinhaRisco, MedidaPlano, Pessoa, TipoMedida } from '../tipos';
import Quadros from './Matrizes';
import { BadgeVersao, Caixa, ChipNivel, dataPt, faltaIdent, refR, textoNP } from './comum';

type Up = (fn: (a: AvaliacaoRiscos) => void) => void;
const SECS = [
  { id: 'identificacao', t: 'Identificação' },
  { id: 'riscos', t: 'Riscos' },
  { id: 'plano', t: 'Plano de ação', so: 'completa' },
  { id: 'reavaliacao', t: 'Reavaliação', so: 'completa' },
  { id: 'painel', t: 'Painel e conclusões' },
] as const;

export default function Editor({ id, sec }: { id: string; sec: string }) {
  const a = useRiscos((s) => s.avaliacoes.find((x) => x.id === id));
  const atualizar = useRiscos((s) => s.atualizar);
  const [matrizes, setMatrizes] = useState(false);
  if (!a) return (
    <main className="mx-auto max-w-[720px] px-4 py-10">
      <p className="mb-4 font-display text-[20px] font-bold">Avaliação não encontrada.</p>
      <button className="btn" onClick={() => go('/riscos')}>Voltar às avaliações</button>
    </main>
  );
  const up: Up = (fn) => atualizar(id, fn);
  const secs = SECS.filter((s) => !('so' in s) || s.so === a.versao);
  const atual = secs.some((s) => s.id === sec) ? sec : 'identificacao';
  const fi = faltaIdent(a);
  const nFaltaRiscos = a.riscos.filter((l) => faltaLinha(l, a.versao).length).length;

  return (
    <div className="pb-24">
      <div className="border-b border-ink bg-white">
        <div className="mx-auto max-w-[1100px] px-4 pt-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-ghost" onClick={() => go('/riscos')}><ArrowLeft size={15} /> Avaliações</button>
            <div className="mr-auto min-w-0">
              <p className="flex items-center gap-2"><BadgeVersao v={a.versao} /><span className="truncate font-display text-[19px] font-bold">{a.entidade.designacao || 'Entidade por indicar'}</span></p>
              <p className="truncate text-[12.5px] text-ink-3">{[a.trabalho.local, a.trabalho.atividade].filter(Boolean).join(' · ') || 'Local e atividade por indicar'}</p>
            </div>
            <label className="flex items-center gap-2 text-[12.5px] text-ink-3">Versão
              <select className="input h-9 w-auto" value={a.versao} onChange={(e) => up((x) => { x.versao = e.target.value as AvaliacaoRiscos['versao']; })}>
                <option value="light">Light</option><option value="completa">Completa</option>
              </select>
            </label>
            <button className="btn h-10 px-3" onClick={() => setMatrizes(true)}><Grid3x3 size={16} /> Matrizes</button>
            <button className="btn-fire h-10 px-4" onClick={() => go(`/riscos/a/${id}/relatorio`)}><FileText size={16} /> Relatório</button>
          </div>
          <nav className="-mb-px mt-3 flex gap-1 overflow-x-auto">
            {secs.map((s) => {
              const aviso = (s.id === 'identificacao' && fi.length) || (s.id === 'riscos' && nFaltaRiscos);
              return (
                <a key={s.id} href={`#/riscos/a/${id}/${s.id}`} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold ${atual === s.id ? 'border-fire text-ink' : 'border-transparent text-ink-3 hover:text-ink'}`}>
                  {s.t}{s.id === 'riscos' && <span className="font-mono text-[11px] text-ink-3">{a.riscos.length}</span>}{aviso ? <span className="h-2 w-2 rounded-full bg-alerta" /> : null}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-[1100px] px-4 pt-6 sm:px-6">
        {atual === 'identificacao' && <Identificacao a={a} up={up} />}
        {atual === 'riscos' && <Riscos a={a} up={up} />}
        {atual === 'plano' && <Plano a={a} up={up} />}
        {atual === 'reavaliacao' && <Reavaliacao a={a} up={up} />}
        {atual === 'painel' && <Painel a={a} up={up} />}
      </main>
      {matrizes && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={() => setMatrizes(false)}>
          <div className="flex max-h-[94dvh] w-full max-w-[900px] flex-col bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink px-4 py-3">
              <div><p className="font-display text-[17px] font-bold">Matrizes do método SSARA</p><p className="text-[12px] text-ink-3">Quadros 1 a 8 (NTP 330, como na matriz V5.0). Também vão para o relatório, no capítulo «Metodologia».</p></div>
              <button className="btn-ghost" onClick={() => setMatrizes(false)}><X size={18} /></button>
            </div>
            <div className="overflow-y-auto px-4 py-4"><Quadros /></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Identificação ───────────────────────── */

/* Componentes de campo fora do ecrã: se fossem criados dentro dele, cada letra recriava a caixa e o cursor saía do campo */
function CampoT({ l, v, set, cls = '', ph, hint }: { l: string; v: string; set: (s: string) => void; cls?: string; ph?: string; hint?: string }) {
  return <Field label={l} className={cls} hint={hint}><Text value={v} onChange={set} placeholder={ph} /></Field>;
}
function CampoD({ l, v, set, cls = '' }: { l: string; v: string; set: (s: string) => void; cls?: string }) {
  return <Field label={l} className={cls}><input type="date" className="input" value={v} onChange={(e) => set(e.target.value)} /></Field>;
}
function CampoPessoa({ a, up, l, k, hint, cls = '' }: { a: AvaliacaoRiscos; up: Up; l: string; k: keyof AvaliacaoRiscos['equipa']; hint?: string; cls?: string }) {
  const p = a.equipa[k];
  const set = (campo: keyof Pessoa) => (v: string) => up((x) => { x.equipa[k][campo] = v; });
  return (
    <div className={`grid gap-3 sm:grid-cols-[1.3fr_1fr_150px] ${cls}`}>
      <Field label={l} hint={hint}><Text value={p.nome} onChange={set('nome')} placeholder="Nome" /></Field>
      <Field label="Função"><Text value={p.funcao} onChange={set('funcao')} /></Field>
      <Field label="Data"><input type="date" className="input" value={p.data} onChange={(e) => set('data')(e.target.value)} /></Field>
    </div>
  );
}

function Identificacao({ a, up }: { a: AvaliacaoRiscos; up: Up }) {
  const c = a.versao === 'completa';
  const fi = faltaIdent(a);
  const f = (campo: string) => (fi.some((x) => x[0] === campo) ? 'falta' : '');
  const empresa = useStore((s) => s.empresaPadrao);
  const autor = useStore((s) => s.autorPadrao);
  const usarEmpresa = () => up((x) => {
    if (empresa) Object.assign(x.executante, { designacao: empresa.nome || '', nipc: empresa.nif || '', morada: empresa.morada || '', contacto: [empresa.telefone, empresa.email].filter(Boolean).join(' · ') });
    if (autor) { x.executante.responsavelTecnico = autor.nome || ''; x.executante.habilitacoes = [autor.qualificacao, autor.ordem && `${autor.ordem} n.º ${autor.numero || '—'}`].filter(Boolean).join(' · '); }
  });
  return (
    <>
      <Faltas itens={fi} titulo="Falta preencher" />
      <div className="h-4" />
      <Caixa titulo="Local e trabalho avaliados">
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoT l="Local avaliado" v={a.trabalho.local} set={(v) => up((x) => { x.trabalho.local = v; })} cls={f('Local avaliado')} ph="Ex.: Oficina de manutenção — piso 0" />
          <CampoT l="Atividade / processo" v={a.trabalho.atividade} set={(v) => up((x) => { x.trabalho.atividade = v; })} cls={f('Atividade')} ph="Ex.: Manutenção mecânica de equipamentos" />
          {c && <>
            <CampoT l="Tipo de intervenção" v={a.trabalho.tipoIntervencao} set={(v) => up((x) => { x.trabalho.tipoIntervencao = v; })} ph="Ex.: Inicial, periódica, após alteração, após acidente" />
            <CampoT l="Equipamentos utilizados" v={a.trabalho.equipamentos} set={(v) => up((x) => { x.trabalho.equipamentos = v; })} />
            <CampoT l="Período de trabalho" v={a.trabalho.periodo} set={(v) => up((x) => { x.trabalho.periodo = v; })} ph="Ex.: 2 turnos, 08h–24h" />
            <CampoT l="Razão da avaliação" v={a.trabalho.razao} set={(v) => up((x) => { x.trabalho.razao = v; })} ph="Ex.: Nova linha; revisão anual" />
          </>}
        </div>
      </Caixa>
      <Caixa titulo="Entidade avaliada">
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoT l="Designação" v={a.entidade.designacao} set={(v) => up((x) => { x.entidade.designacao = v; })} cls={f('Entidade avaliada')} />
          <CampoT l="Morada" v={a.entidade.morada} set={(v) => up((x) => { x.entidade.morada = v; })} />
          {c && <>
            <CampoT l="NIPC" v={a.entidade.nipc} set={(v) => up((x) => { x.entidade.nipc = v; })} />
            <CampoT l="CAE" v={a.entidade.cae} set={(v) => up((x) => { x.entidade.cae = v; })} />
            <CampoT l="Responsável da entidade" v={a.entidade.responsavel} set={(v) => up((x) => { x.entidade.responsavel = v; })} />
            <CampoT l="Contacto" v={a.entidade.contacto} set={(v) => up((x) => { x.entidade.contacto = v; })} />
            <CampoT l="Técnico de SST da entidade" v={a.entidade.tecnicoSST} set={(v) => up((x) => { x.entidade.tecnicoSST = v; })} />
          </>}
        </div>
      </Caixa>
      {c && (
        <Caixa titulo="Entidade executante" direita={<button className="text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={usarEmpresa}>Usar «A minha empresa»</button>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoT l="Designação" v={a.executante.designacao} set={(v) => up((x) => { x.executante.designacao = v; })} cls={f('Entidade executante')} />
            <CampoT l="NIPC" v={a.executante.nipc} set={(v) => up((x) => { x.executante.nipc = v; })} />
            <CampoT l="Morada" v={a.executante.morada} set={(v) => up((x) => { x.executante.morada = v; })} />
            <CampoT l="Contacto" v={a.executante.contacto} set={(v) => up((x) => { x.executante.contacto = v; })} />
            <CampoT l="Responsável técnico" v={a.executante.responsavelTecnico} set={(v) => up((x) => { x.executante.responsavelTecnico = v; })} />
            <CampoT l="Habilitações / título profissional" v={a.executante.habilitacoes} set={(v) => up((x) => { x.executante.habilitacoes = v; })} hint="Técnico superior ou técnico de SHT certificado (Lei n.º 102/2009, art. 100.º n.º 1)" />
            <CampoT l="Modalidade do serviço de SST" v={a.executante.servicoSST} set={(v) => up((x) => { x.executante.servicoSST = v; })} ph="Interno, comum ou externo (art. 74.º)" />
          </div>
        </Caixa>
      )}
      <Caixa titulo="Equipa e consulta">
        <div className="flex flex-col gap-4">
          <CampoPessoa a={a} up={up} l="Elaborado por" k="elaborado" cls={f('Elaborado por')} />
          {c && <CampoPessoa a={a} up={up} l="Revisto por" k="revisto" cls={''} />}
          {c && <CampoPessoa a={a} up={up} l="Aprovado por" k="aprovado" cls={''} />}
          <CampoPessoa a={a} up={up} l="Consulta dos trabalhadores" k="consulta" cls={''} hint="Representante dos trabalhadores para a SST ou, na falta, os trabalhadores. O empregador consulta-os por escrito sobre a avaliação de riscos (art. 18.º n.º 1 a)) e regista em livro próprio (n.º 6)." />
        </div>
      </Caixa>
      <Caixa titulo="Documento e datas">
        <div className="grid gap-3 sm:grid-cols-3">
          <CampoT l="Título" v={a.titulo} set={(v) => up((x) => { x.titulo = v; })} cls="sm:col-span-3" />
          <CampoT l="Código" v={a.codigo} set={(v) => up((x) => { x.codigo = v; })} ph="Ex.: AR-2026-01" />
          <CampoT l="Revisão" v={a.revisao} set={(v) => up((x) => { x.revisao = v; })} />
          <CampoD l="Data da avaliação" v={a.metodo.dataAvaliacao} set={(v) => up((x) => { x.metodo.dataAvaliacao = v; })} cls={f('Data da avaliação')} />
          {c && <CampoD l="Data de emissão" v={a.dataEmissao} set={(v) => up((x) => { x.dataEmissao = v; })} />}
          {c && <CampoD l="Atualizada em" v={a.metodo.atualizadoEm} set={(v) => up((x) => { x.metodo.atualizadoEm = v; })} />}
          <CampoD l="Próxima revisão" v={a.metodo.proximaRevisao} set={(v) => up((x) => { x.metodo.proximaRevisao = v; })} />
          {c && <CampoT l="Classificação" v={a.classificacao} set={(v) => up((x) => { x.classificacao = v; })} />}
        </div>
        {c && (
          <div className="mt-4">
            <p className="label mb-2">Registo de revisões</p>
            {(a.revisoes ?? []).map((r, k) => (
              <div key={k} className="mb-2 grid gap-2 sm:grid-cols-[80px_150px_1fr_32px]">
                <Text value={r.revisao} onChange={(v) => up((x) => { x.revisoes![k].revisao = v; })} placeholder="Rev." />
                <input type="date" className="input" value={r.data} onChange={(e) => up((x) => { x.revisoes![k].data = e.target.value; })} />
                <Text value={r.descricao} onChange={(v) => up((x) => { x.revisoes![k].descricao = v; })} placeholder="Descrição da alteração" />
                <button className="btn-ghost justify-center hover:!text-alerta" onClick={() => up((x) => { x.revisoes!.splice(k, 1); })}><X size={14} /></button>
              </div>
            ))}
            <button className="text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => up((x) => { (x.revisoes ??= []).push({ revisao: x.revisao, data: new Date().toISOString().slice(0, 10), descricao: '' }); })}>+ Adicionar revisão</button>
          </div>
        )}
        <p className="mt-3 text-[12px] text-ink-3">A avaliação é revista sempre que haja alterações (novos equipamentos, processos, acidentes) — Lei n.º 102/2009, art. 15.º n.º 2 a) e n.º 3. A lei não fixa uma periodicidade; a data de revisão é decisão técnica.</p>
      </Caixa>
    </>
  );
}

/* ───────────────────────── Riscos ───────────────────────── */

function SelNivel({ valor, set, op, rotulo, falta }: { valor?: number; set: (v?: number) => void; op: readonly { v: number; nome: string }[]; rotulo: string; falta?: boolean }) {
  return (
    <Field label={rotulo} className={falta ? 'falta' : ''}>
      <select className={`input ${valor ? 'preenchido' : ''}`} value={valor ?? ''} onChange={(e) => set(e.target.value ? Number(e.target.value) : undefined)}>
        <option value="">—</option>
        {op.map((o) => <option key={o.v} value={o.v}>{o.v} — {o.nome}</option>)}
      </select>
    </Field>
  );
}

function SimNao({ l, v, set }: { l: string; v?: boolean; set: (v?: boolean) => void }) {
  const B = ({ val, t }: { val: boolean; t: string }) => <button type="button" className={`h-8 min-w-[52px] border px-2 text-[12.5px] font-semibold ${v === val ? 'border-ink bg-ink text-white' : 'border-paper-3 bg-white hover:border-ink'}`} onClick={() => set(v === val ? undefined : val)}>{t}</button>;
  return <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-3 py-1.5 last:border-0"><span className="text-[12.5px]">{l}</span><span className="flex gap-1"><B val t="Sim" /><B val={false} t="Não" /></span></div>;
}

function adicionarDaBiblioteca(up: Up, es: EntradaBiblioteca[], area: string) {
  up((x) => {
    for (const e of es) {
      const l = novaLinha();
      Object.assign(l, { origem: e.id, area, atividade: x.trabalho.atividade, perigo: e.perigo, risco: e.risco, nc: e.nc, medidas: e.medidas.map(([t, tp]) => novaMedida(t, tp)) });
      x.riscos.push(l);
    }
  });
}

function Biblioteca({ fechar, escolher, jaUsadas }: { fechar: () => void; escolher: (es: EntradaBiblioteca[]) => void; jaUsadas: Set<string> }) {
  const [q, setQ] = useState('');
  const [g, setG] = useState<string>('');
  const [sel, setSel] = useState<string[]>([]);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lista = BIBLIOTECA.filter((e) => (!g || e.grupo === g) && (!q.trim() || norm(`${e.perigo} ${e.risco} ${e.grupo} ${e.medidas.map((m) => m[0]).join(' ')}`).includes(norm(q.trim()))));
  const alt = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={fechar}>
      <div className="flex max-h-[92dvh] w-full max-w-[760px] flex-col bg-paper" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink bg-white px-4 py-3">
          <div><p className="font-display text-[17px] font-bold">Biblioteca de perigos</p><p className="text-[12px] text-ink-3">Sugestões de perigo, risco, gravidade típica e medidas. O ND e o NE dependem do que observa no local.</p></div>
          <button className="btn-ghost" onClick={fechar}><X size={18} /></button>
        </div>
        <div className="border-b border-paper-3 bg-white px-4 py-3">
          <label className="relative block"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="input h-10 pl-9" autoFocus placeholder="Procurar (ex.: esmeril, quadro elétrico, cargas)" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <div className="mt-2 flex flex-wrap gap-1">
            {['', ...GRUPOS].map((x) => <button key={x} className={`border px-2 py-1 text-[11.5px] font-semibold ${g === x ? 'border-ink bg-ink text-white' : 'border-paper-3 bg-white'}`} onClick={() => setG(x)}>{x || 'Todos'}</button>)}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {lista.map((e) => (
            <label key={e.id} className={`mb-2 flex cursor-pointer gap-3 border bg-white p-3 ${sel.includes(e.id) ? 'border-ink' : 'border-paper-3'}`}>
              <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#14233A]" checked={sel.includes(e.id)} onChange={() => alt(e.id)} />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold">{e.perigo}</span>
                <span className="block text-[12.5px] text-ink-2">{e.risco} · NC típico {e.nc}{jaUsadas.has(e.id) && <span className="ml-1 font-semibold text-fire-ink">· já na avaliação</span>}</span>
                <span className="mt-1 block text-[11.5px] text-ink-3">{e.medidas.length} medidas sugeridas · {e.grupo}</span>
              </span>
            </label>
          ))}
          {!lista.length && <p className="py-6 text-center text-[13px] text-ink-3">Nada encontrado. Pode adicionar um risco em branco.</p>}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-ink bg-white px-4 py-3">
          <span className="text-[12.5px] text-ink-3">{sel.length} selecionado(s)</span>
          <button className="btn-fire h-11 px-5" disabled={!sel.length} onClick={() => escolher(BIBLIOTECA.filter((e) => sel.includes(e.id)))}><Plus size={16} /> Adicionar</button>
        </div>
      </div>
    </div>
  );
}

function Riscos({ a, up }: { a: AvaliacaoRiscos; up: Up }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [bib, setBib] = useState(false);
  const [tipoLocal, setTipoLocal] = useState('');
  const usadas = useMemo(() => new Set(a.riscos.map((l) => l.origem).filter(Boolean) as string[]), [a.riscos]);
  const sugestoes = LOCAIS_TIPO.find((t) => t.nome === tipoLocal)?.ids.filter((i) => !usadas.has(i)).map((i) => BIBLIOTECA.find((e) => e.id === i)!).filter(Boolean) ?? [];
  const novo = () => { const l = novaLinha(); l.area = a.trabalho.local; l.atividade = a.trabalho.atividade; up((x) => { x.riscos.push(l); }); setAberto(l.id); };
  return (
    <>
      <Caixa titulo="Ajuda a preencher" direita={<button className="btn h-9 px-3" onClick={() => setBib(true)}><BookOpen size={15} /> Biblioteca</button>}>
        <p className="mb-2 text-[12.5px] text-ink-3">Indique o tipo de local avaliado{a.trabalho.local ? ` («${a.trabalho.local}»)` : ''}: a app sugere os perigos habituais, com o risco, a gravidade típica e as medidas pela hierarquia da lei. São sugestões: confirme cada uma no local e escolha o ND e o NE pelo que observa.</p>
        <select className="input max-w-[420px]" value={tipoLocal} onChange={(e) => setTipoLocal(e.target.value)}>
          <option value="">Tipo de local…</option>
          {LOCAIS_TIPO.map((t) => <option key={t.nome}>{t.nome}</option>)}
        </select>
        {tipoLocal && (
          <div className="mt-3">
            {sugestoes.length ? (
              <>
                <ul className="mb-3 flex flex-col gap-1">{sugestoes.map((e) => <li key={e.id} className="flex items-start gap-2 text-[12.5px]"><Lightbulb size={14} className="mt-0.5 shrink-0 text-fire-ink" /><span><b>{e.perigo}</b> — {e.risco}</span></li>)}</ul>
                <button className="btn-fire h-10 px-4" onClick={() => { adicionarDaBiblioteca(up, sugestoes, a.trabalho.local); setTipoLocal(''); }}><Plus size={15} /> Adicionar as {sugestoes.length} sugestões</button>
              </>
            ) : <p className="text-[12.5px] text-ink-3">Todas as sugestões deste tipo de local já estão na avaliação.</p>}
          </div>
        )}
      </Caixa>
      {bib && <Biblioteca jaUsadas={usadas} fechar={() => setBib(false)} escolher={(es) => { adicionarDaBiblioteca(up, es, a.trabalho.local); setBib(false); }} />}

      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-[18px] font-bold">Perigos e riscos <span className="font-mono text-[13px] text-ink-3">{a.riscos.length}</span></h2>
        <button className="btn h-10 px-3" onClick={novo}><Plus size={15} /> Risco em branco</button>
      </div>
      {!a.riscos.length && <p className="border border-dashed border-ink-4 p-6 text-center text-[13px] text-ink-3">Sem riscos. Use as sugestões acima, a biblioteca ou adicione um risco em branco.</p>}
      <div className="flex flex-col gap-2">
        {a.riscos.map((l, i) => <LinhaCartao key={l.id} a={a} l={l} i={i} up={up} aberto={aberto === l.id} alternar={() => setAberto(aberto === l.id ? null : l.id)} />)}
      </div>
    </>
  );
}

function LinhaCartao({ a, l, i, up, aberto, alternar }: { a: AvaliacaoRiscos; l: LinhaRisco; i: number; up: Up; aberto: boolean; alternar: () => void }) {
  const c = a.versao === 'completa';
  const r = calcular(l);
  const fl = faltaLinha(l, a.versao);
  const f = (k: string) => fl.some((x) => x[0] === k);
  const upL = (fn: (x: LinhaRisco) => void) => up((av) => { const z = av.riscos.find((k) => k.id === l.id); if (z) fn(z); });
  const ndQ2 = ndDoQuadro2(l.q2 ?? {});
  const [q2, setQ2] = useState(!!l.q2);
  return (
    <div id={`r-${l.id}`} className={`border bg-white ${aberto ? 'border-ink' : fl.length ? 'border-alerta/60' : 'border-paper-3'}`}>
      <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={alternar}>
        <span className="w-9 shrink-0 font-mono text-[12px] font-bold text-ink-3">{refR(i)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold">{l.perigo || <span className="text-alerta">Perigo por indicar</span>}</span>
          <span className="block truncate text-[12px] text-ink-3">{[c && l.area, l.risco].filter(Boolean).join(' · ') || '—'}{fl.length ? <span className="text-alerta"> · falta {fl.length}</span> : ''}</span>
        </span>
        <ChipNivel nr={r.nr} />
        {r.nr2 !== undefined && <span className="hidden items-center gap-1 sm:flex"><span className="text-ink-4">→</span><ChipNivel nr={r.nr2} /></span>}
        {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {aberto && (
        <div className="border-t border-paper-3 px-3 pb-4 pt-3 sm:px-4">
          {l.origem && <p className="mb-3 border-l-[3px] border-fire bg-paper px-3 py-2 text-[12px]">Sugestão da biblioteca: confirme no local o perigo, o risco, o NC e as medidas. O técnico valida e assina.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {c && <Field label="Área / setor" className={f('Área / setor') ? 'falta' : ''}><Text value={l.area} onChange={(v) => upL((x) => { x.area = v; })} /></Field>}
            {c && <Field label="N.º de trabalhadores expostos"><input className="input-num" inputMode="numeric" value={l.expostos ?? ''} placeholder="0" onChange={(e) => upL((x) => { const n = parseInt(e.target.value); x.expostos = Number.isFinite(n) ? n : undefined; })} /></Field>}
            <Field label="Atividade / tarefa" className={`sm:col-span-2 ${f('Atividade') ? 'falta' : ''}`}><Text value={l.atividade} onChange={(v) => upL((x) => { x.atividade = v; })} /></Field>
            <Field label="Perigo" className={f('Perigo') ? 'falta' : ''} hint="Fonte, situação ou ato com potencial de dano"><Area rows={2} value={l.perigo} onChange={(v) => upL((x) => { x.perigo = v; })} /></Field>
            <Field label="Risco" className={f('Risco') ? 'falta' : ''} hint="O dano que pode ocorrer"><Area rows={2} value={l.risco} onChange={(v) => upL((x) => { x.risco = v; })} /></Field>
            {c && <Field label="Medidas de controlo existentes" className="sm:col-span-2"><Area rows={2} value={l.existentes} onChange={(v) => upL((x) => { x.existentes = v; })} /></Field>}
          </div>

          <p className="label mb-2 mt-5">Avaliação inicial</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              {q2 ? (
                <Field label={`ND pelo Quadro 2${ndQ2 ? ` = ${ndQ2}` : ''}`} className={f('ND') ? 'falta' : ''}>
                  <div className="border border-paper-3 bg-white px-2">
                    <SimNao l="Cumpre o requisito legal?" v={l.q2?.legal} set={(v) => upL((x) => { x.q2 = { ...x.q2, legal: v }; x.nd = undefined; })} />
                    <SimNao l="Há informação aos trabalhadores?" v={l.q2?.informacao} set={(v) => upL((x) => { x.q2 = { ...x.q2, informacao: v }; x.nd = undefined; })} />
                    <SimNao l="Foi dada formação?" v={l.q2?.formacao} set={(v) => upL((x) => { x.q2 = { ...x.q2, formacao: v }; x.nd = undefined; })} />
                  </div>
                </Field>
              ) : <SelNivel rotulo="ND — deficiência" valor={l.nd} op={ND} falta={f('ND')} set={(v) => upL((x) => { x.nd = v; delete x.q2; })} />}
              <button className="mt-1 text-[11.5px] font-semibold text-fire-ink hover:underline" onClick={() => { if (q2) upL((x) => { delete x.q2; }); setQ2(!q2); }}>{q2 ? 'Escolher o ND diretamente' : 'Ajudar: três perguntas (Quadro 2)'}</button>
            </div>
            <SelNivel rotulo="NE — exposição" valor={l.ne} op={NE} falta={f('NE')} set={(v) => upL((x) => { x.ne = v; })} />
            <SelNivel rotulo="NC — consequência" valor={l.nc} op={NC} falta={f('NC')} set={(v) => upL((x) => { x.nc = v; })} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 bg-paper px-3 py-2 text-[12.5px]">
            <span>NP = {textoNP(r.np)}</span><span>NR = <b>{r.nr ?? '—'}</b></span><ChipNivel nr={r.nr} />
            {r.nivel && <span className="text-ink-2">{r.nivel.sig}</span>}
          </div>

          <p className="label mb-2 mt-5">Medidas preventivas a implementar</p>
          <Medidas l={l} upL={upL} falta={f('Medidas a implementar')} />

          {!c && <Residual l={l} upL={upL} />}
          {c && <p className="mt-4 text-[12px] text-ink-3">Responsáveis, prazos e custos: separador «Plano de ação». Risco residual e eficácia: «Reavaliação».</p>}
          <Faltas itens={fl} titulo="Falta preencher" />
          <div className="mt-4 flex justify-end gap-1">
            <button className="btn-ghost" onClick={() => up((x) => { const k = x.riscos.findIndex((z) => z.id === l.id); const cp = JSON.parse(JSON.stringify(l)) as LinhaRisco; cp.id = rid(); cp.medidas.forEach((m) => { m.id = rid(); }); x.riscos.splice(k + 1, 0, cp); })}><Copy size={14} /> Duplicar</button>
            <button className="btn-ghost hover:!text-alerta" onClick={() => { if (confirm(`Apagar ${refR(i)}?`)) up((x) => { x.riscos = x.riscos.filter((z) => z.id !== l.id); }); }}><Trash2 size={14} /> Apagar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Medidas({ l, upL, falta }: { l: LinhaRisco; upL: (fn: (x: LinhaRisco) => void) => void; falta: boolean }) {
  const upM = (id: string, fn: (m: MedidaPlano) => void) => upL((x) => { const m = x.medidas.find((k) => k.id === id); if (m) fn(m); });
  return (
    <div className={falta ? 'falta' : ''}>
      {[...l.medidas].sort((a, b) => (a.tipo ?? 9) - (b.tipo ?? 9)).map((m) => (
        <div key={m.id} className="mb-2 grid gap-2 sm:grid-cols-[1fr_230px_32px]">
          <Area rows={2} value={m.descricao} onChange={(v) => upM(m.id, (z) => { z.descricao = v; })} placeholder="Descrição da medida" />
          <select className="input" value={m.tipo ?? ''} onChange={(e) => upM(m.id, (z) => { z.tipo = e.target.value ? (Number(e.target.value) as TipoMedida) : undefined; })}>
            <option value="">Tipo (hierarquia)…</option>{Object.entries(TIPO_MEDIDA).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
          <button className="btn-ghost justify-center hover:!text-alerta" title="Retirar" onClick={() => upL((x) => { x.medidas = x.medidas.filter((z) => z.id !== m.id); })}><X size={14} /></button>
        </div>
      ))}
      {falta && !l.medidas.length && <div className="input falta mb-2 flex items-center text-[12.5px] text-alerta">Nenhuma medida indicada</div>}
      <button className="text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => upL((x) => { x.medidas.push(novaMedida()); })}>+ Adicionar medida</button>
      <p className="mt-1 text-[11.5px] text-ink-3">Ordem da lei (art. 15.º n.º 2): eliminar › substituir › proteção coletiva › organização e formação › EPI em último recurso (alínea l): proteção coletiva antes da individual).</p>
    </div>
  );
}

function Residual({ l, upL }: { l: LinhaRisco; upL: (fn: (x: LinhaRisco) => void) => void }) {
  const r = calcular(l);
  return (
    <>
      <p className="label mb-2 mt-5">Risco residual (após as medidas)</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelNivel rotulo="ND'" valor={l.nd2} op={ND} set={(v) => upL((x) => { x.nd2 = v; })} />
        <SelNivel rotulo="NE'" valor={l.ne2} op={NE} set={(v) => upL((x) => { x.ne2 = v; })} />
        <SelNivel rotulo="NC'" valor={l.nc2} op={NC} set={(v) => upL((x) => { x.nc2 = v; })} />
      </div>
      {r.nr2 !== undefined && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 bg-paper px-3 py-2 text-[12.5px]">
          <span>NR' = <b>{r.nr2}</b></span><ChipNivel nr={r.nr2} />
          {r.reducao !== undefined && <span>redução {Math.round(r.reducao * 100)} %</span>}
          <span className={r.aceitavelCalc ? 'font-semibold text-ok' : 'font-semibold text-alerta'}>{r.aceitavelCalc ? 'Aceitável (nível III ou IV)' : `Não aceitável (NR' ≥ ${LIMITE_ACEITAVEL}) — rever as medidas`}</span>
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Plano de ação (completa) ───────────────────────── */

function Plano({ a, up }: { a: AvaliacaoRiscos; up: Up }) {
  const linhas = a.riscos.map((l, i) => ({ l, i, r: calcular(l) })).filter((x) => x.l.medidas.length).sort((x, y) => (y.r.nr ?? 0) - (x.r.nr ?? 0));
  const upM = (lid: string, mid: string, fn: (m: MedidaPlano) => void) => up((x) => { const m = x.riscos.find((k) => k.id === lid)?.medidas.find((k) => k.id === mid); if (m) fn(m); });
  const pn = painel(a);
  return (
    <>
      <p className="mb-4 max-w-[760px] text-[13px] text-ink-3">Ordenado pela prioridade (NR mais alto primeiro). As medidas de prevenção devem corresponder ao resultado da avaliação (Lei n.º 102/2009, art. 15.º n.º 3); as que dependem de outros responsáveis da empresa são-lhes comunicadas (art. 98.º n.º 3). {pn.medidas} medidas · {pn.medidasConcluidas} concluídas.</p>
      {!linhas.length && <p className="border border-dashed border-ink-4 p-6 text-center text-[13px] text-ink-3">Ainda não há medidas. Indique-as em cada risco, no separador «Riscos».</p>}
      {linhas.map(({ l, i, r }) => (
        <Caixa key={l.id} titulo={`${refR(i)} · ${l.perigo || 'Perigo por indicar'}`} direita={<ChipNivel nr={r.nr} />}>
          {[...l.medidas].sort((x, y) => (x.tipo ?? 9) - (y.tipo ?? 9)).map((m) => (
            <div key={m.id} className="mb-3 border-l-[3px] border-paper-3 pl-3 last:mb-0">
              <p className="text-[13px] font-semibold">{m.descricao || <span className="text-alerta">Descrição por indicar</span>} <span className="font-normal text-ink-3">· {m.tipo ? TIPO_MEDIDA[m.tipo] : 'tipo por indicar'}</span></p>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <Field label="Responsável"><Text value={m.responsavel} onChange={(v) => upM(l.id, m.id, (z) => { z.responsavel = v; })} /></Field>
                <Field label="Prazo"><input type="date" className="input" value={m.prazo} onChange={(e) => upM(l.id, m.id, (z) => { z.prazo = e.target.value; })} /></Field>
                <Field label="Custo estimado (€)"><input className="input-num" inputMode="decimal" value={m.custo ?? ''} placeholder="0" onChange={(e) => upM(l.id, m.id, (z) => { const n = parseFloat(e.target.value.replace(',', '.')); z.custo = Number.isFinite(n) ? n : undefined; })} /></Field>
                <Field label="Estado"><select className="input" value={m.estado} onChange={(e) => upM(l.id, m.id, (z) => { z.estado = e.target.value as EstadoMedida; })}>{Object.entries(ESTADO_MEDIDA).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></Field>
                <Field label="Data de conclusão"><input type="date" className="input" value={m.conclusao} onChange={(e) => upM(l.id, m.id, (z) => { z.conclusao = e.target.value; })} /></Field>
                <Field label="Evidência" className="sm:col-span-3"><Text value={m.evidencia} onChange={(v) => upM(l.id, m.id, (z) => { z.evidencia = v; })} placeholder="Ex.: registo de formação, fotografia, fatura" /></Field>
              </div>
            </div>
          ))}
        </Caixa>
      ))}
    </>
  );
}

/* ───────────────────────── Reavaliação (completa) ───────────────────────── */

function Reavaliacao({ a, up }: { a: AvaliacaoRiscos; up: Up }) {
  const g = a.reavaliacao;
  const setG = (k: keyof typeof g) => (v: string) => up((x) => { x.reavaliacao[k] = v; });
  return (
    <>
      <p className="mb-4 max-w-[760px] text-[13px] text-ink-3">Depois de implementadas as medidas, avalie o risco residual e a eficácia. Objetivo da lei: níveis eficazes de proteção (art. 15.º n.º 3). Critério da matriz: residual aceitável se nível III ou IV (NR' &lt; {LIMITE_ACEITAVEL}).</p>
      {a.riscos.map((l, i) => {
        const r = calcular(l);
        const upL = (fn: (x: LinhaRisco) => void) => up((av) => { const z = av.riscos.find((k) => k.id === l.id); if (z) fn(z); });
        return (
          <Caixa key={l.id} titulo={`${refR(i)} · ${l.perigo || 'Perigo por indicar'}`} direita={<span className="flex items-center gap-1"><ChipNivel nr={r.nr} pequeno /><span className="text-ink-4">→</span><ChipNivel nr={r.nr2} pequeno /></span>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Medidas efetivamente implementadas" className="sm:col-span-2"><Area rows={2} value={l.implementadas} onChange={(v) => upL((x) => { x.implementadas = v; })} /></Field>
            </div>
            <Residual l={l} upL={upL} />
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Field label="Eficácia"><select className="input" value={l.eficacia ?? ''} onChange={(e) => upL((x) => { x.eficacia = (e.target.value || undefined) as Eficacia | undefined; })}><option value="">—</option>{Object.entries(EFICACIA).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></Field>
              <Field label="Data da reavaliação"><input type="date" className="input" value={l.dataReav} onChange={(e) => upL((x) => { x.dataReav = e.target.value; })} /></Field>
              <Field label="Verificado por" className="sm:col-span-2"><Text value={l.verificadoPor} onChange={(v) => upL((x) => { x.verificadoPor = v; })} /></Field>
              {(r.aceitavelCalc === false || l.eficacia === 'ineficaz' || l.eficacia === 'parcial') && <Field label="Ações adicionais necessárias" className="falta sm:col-span-4"><Area rows={2} value={l.acoesAdicionais} onChange={(v) => upL((x) => { x.acoesAdicionais = v; })} /></Field>}
            </div>
          </Caixa>
        );
      })}
      <Caixa titulo="Validação da reavaliação">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Reavaliado por"><Text value={g.reavaliadoPor} onChange={setG('reavaliadoPor')} /></Field>
          <Field label="Verificado por"><Text value={g.verificadoPor} onChange={setG('verificadoPor')} /></Field>
          <Field label="Aprovado por"><Text value={g.aprovadoPor} onChange={setG('aprovadoPor')} /></Field>
          <Field label="Data"><input type="date" className="input" value={g.data} onChange={(e) => setG('data')(e.target.value)} /></Field>
          <Field label="Consulta dos trabalhadores (art. 18.º)"><Text value={g.consulta} onChange={setG('consulta')} /></Field>
          <Field label="Próxima reavaliação"><input type="date" className="input" value={g.proxima} onChange={(e) => setG('proxima')(e.target.value)} /></Field>
          <Field label="Observações" className="sm:col-span-3"><Area rows={2} value={g.observacoes} onChange={setG('observacoes')} /></Field>
        </div>
      </Caixa>
    </>
  );
}

/* ───────────────────────── Painel e conclusões ───────────────────────── */

export function textoConclusoes(a: AvaliacaoRiscos): string {
  const pn = painel(a);
  const [i1, i2, i3, i4] = pn.distInicial;
  const partes = [`Foram identificados e avaliados ${pn.avaliados} riscos${a.trabalho.local ? ` em ${a.trabalho.local}` : ''}, pelo método SSARA (NTP 330).`];
  partes.push(`Na avaliação inicial: ${i1} de nível I (situação crítica, correção urgente), ${i2} de nível II (corrigir e adotar medidas de controlo), ${i3} de nível III e ${i4} de nível IV.`);
  if (i1 + i2) partes.push(`Os riscos de nível I e II exigem medidas de prevenção e proteção, a aplicar pela ordem dos princípios gerais de prevenção (Lei n.º 102/2009, art. 15.º n.º 2), com prioridade aos de NR mais elevado.`);
  if (pn.reavaliados) partes.push(`Após as medidas, foram reavaliados ${pn.reavaliados} riscos${pn.reducaoMedia !== undefined ? `, com redução média do nível de risco de ${Math.round(pn.reducaoMedia * 100)} %` : ''}; ${pn.naoAceitaveis ? `${pn.naoAceitaveis} mantêm risco residual não aceitável e exigem ações adicionais` : 'todos ficam com risco residual aceitável (nível III ou IV)'}.`);
  partes.push(`A avaliação deve ser revista sempre que se alterem as condições de trabalho e dada a conhecer aos trabalhadores e aos seus representantes (arts. 18.º e 19.º).`);
  return partes.join(' ');
}

function Painel({ a, up }: { a: AvaliacaoRiscos; up: Up }) {
  const pn = painel(a);
  const maxD = Math.max(1, ...pn.distInicial, ...pn.distResidual);
  const St = ({ l, v, sub }: { l: string; v: string | number; sub?: string }) => <div className="border border-paper-3 bg-white p-3"><p className="label">{l}</p><p className="mt-1 font-display text-[26px] font-extrabold leading-none">{v}</p>{sub && <p className="mt-1 text-[11.5px] text-ink-3">{sub}</p>}</div>;
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <St l="Riscos avaliados" v={pn.avaliados} sub={`de ${a.riscos.length} identificados`} />
        <St l="Nível I e II" v={pn.criticos} sub="exigem correção" />
        <St l="NR médio" v={pn.nrMedio !== undefined ? Math.round(pn.nrMedio) : '—'} sub={pn.nrMedioResidual !== undefined ? `residual ${Math.round(pn.nrMedioResidual)}` : 'sem reavaliação'} />
        <St l="Medidas" v={pn.medidas} sub={`${pn.medidasConcluidas} concluídas`} />
      </div>
      <Caixa titulo="Distribuição por nível de intervenção">
        <div className="flex flex-col gap-2">
          {NIVEIS.map((n, k) => (
            <div key={n.n} className="grid grid-cols-[34px_1fr] items-center gap-2 text-[12px]">
              <span className="font-mono font-bold" style={{ color: n.cor }}>{n.n}</span>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2"><div className="h-3" style={{ width: `${(pn.distInicial[k] / maxD) * 100}%`, background: n.cor, minWidth: pn.distInicial[k] ? 4 : 0 }} /><span className="font-mono">{pn.distInicial[k]} inicial</span></div>
                {pn.reavaliados > 0 && <div className="flex items-center gap-2"><div className="h-3 opacity-45" style={{ width: `${(pn.distResidual[k] / maxD) * 100}%`, background: n.cor, minWidth: pn.distResidual[k] ? 4 : 0 }} /><span className="font-mono text-ink-3">{pn.distResidual[k]} residual</span></div>}
              </div>
            </div>
          ))}
        </div>
      </Caixa>
      {pn.ranking.length > 0 && (
        <Caixa titulo="Prioridades (NR mais alto)">
          <ol className="flex flex-col gap-1">{pn.ranking.map(({ l, r }) => <li key={l.id} className="flex items-center gap-3 text-[12.5px]"><ChipNivel nr={r.nr} pequeno /><span className="w-9 font-mono text-ink-3">{refR(a.riscos.indexOf(l))}</span><span className="min-w-0 flex-1 truncate">{l.perigo}</span>{r.nr2 !== undefined && <ChipNivel nr={r.nr2} pequeno />}</li>)}</ol>
        </Caixa>
      )}
      <Caixa titulo="Conclusões" direita={<button className="text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => { if (!a.conclusoes.trim() || confirm('Substituir o texto atual pela sugestão?')) up((x) => { x.conclusoes = textoConclusoes(x); }); }}>Sugerir texto</button>}>
        <Area rows={6} value={a.conclusoes} onChange={(v) => up((x) => { x.conclusoes = v; })} placeholder="Conclusões do técnico. Use «Sugerir texto» para um ponto de partida a partir dos resultados." />
        <p className="mt-1 text-[11.5px] text-ink-3">Última atualização: {dataPt(new Date(a.atualizadoEm).toISOString().slice(0, 10))}</p>
      </Caixa>
    </>
  );
}
