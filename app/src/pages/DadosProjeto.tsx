import { useRef } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import { useStore } from '../store';
import { Area, Field, Section, Text, compressImage, logoLeve, readFile } from '../ui/primitives';

const INTERVENCOES = [
  'Edifício existente — avaliação das condições de SCIE',
  'Construção nova — projeto da especialidade de SCIE',
  'Alteração / ampliação — projeto da especialidade de SCIE',
  'Mudança de uso',
  'Medidas de autoproteção',
  'Trabalho académico',
];

export default function DadosProjeto() {
  const { p, up } = useP();
  const cliRef = useRef<HTMLInputElement>(null);
  const perfilE = useStore((s) => s.empresaPadrao);
  const perfilA = useStore((s) => s.autorPadrao);

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
      <h1 className="h-display mb-8 text-[40px]">Dados do projeto</h1>

      <Section n="01" title="Identificação do projeto" sub="Anexo IV do RJ-SCIE, art. 2.º, I — Introdução: objetivo e localização.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Designação do projeto"><Text value={p.nome} onChange={(v) => up((x) => { x.nome = v; })} /></Field>
          <Field label="Referência interna"><Text value={p.referencia} onChange={(v) => up((x) => { x.referencia = v; })} placeholder="ex.: SCIE-2026-014" /></Field>
          <Field label="Cliente / entidade responsável"><Text value={p.cliente} onChange={(v) => up((x) => { x.cliente = v; })} /></Field>
          <Field label="Tipo de intervenção">
            <select className="input" value={p.tipoIntervencao} onChange={(e) => up((x) => { x.tipoIntervencao = e.target.value; })}>
              {INTERVENCOES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Morada" className="md:col-span-2"><Text value={p.morada} onChange={(v) => up((x) => { x.morada = v; })} /></Field>
          <Field label="Concelho"><Text value={p.concelho} onChange={(v) => up((x) => { x.concelho = v; })} /></Field>
          <Field label="Distrito"><Text value={p.distrito} onChange={(v) => up((x) => { x.distrito = v; })} /></Field>
          <Field label="Coordenadas (opcional)"><Text value={p.coordenadas} onChange={(v) => up((x) => { x.coordenadas = v; })} placeholder="41.1925, -8.7000" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data"><input type="date" className="input" value={p.data} onChange={(e) => up((x) => { x.data = e.target.value; })} /></Field>
            <Field label="Versão"><Text value={p.versao} onChange={(v) => up((x) => { x.versao = v; })} /></Field>
          </div>
          <Field label="Objetivo do documento" className="md:col-span-2" hint="Texto da secção «Objetivo» do relatório. Se ficar vazio, é usado um texto-base factual.">
            <Area value={p.objetivo} onChange={(v) => up((x) => { x.objetivo = v; })} rows={3} />
          </Field>
        </div>
      </Section>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border border-ink bg-white p-4">
        <div className="flex items-center gap-4">
          {perfilE?.logo ? <img src={perfilE.logo} className="h-14 w-14 border border-paper-3 object-contain" /> : <div className="grid h-14 w-14 place-items-center border border-dashed border-ink-4 text-[10px] text-ink-4">logo</div>}
          <div>
            <p className="label">Empresa e autor (iguais em todos os projetos)</p>
            <p className="font-semibold">{perfilE?.nome || 'Empresa por definir'} · {perfilA?.nome || 'Autor por definir'}</p>
          </div>
        </div>
        <a className="btn" href="#/empresa">Editar «A minha empresa»</a>
      </div>

      <Section n="02" title="Logótipo do cliente" sub="Opcional. Aparece na capa do relatório, ao lado do logótipo da sua empresa.">
        <div className="flex items-center gap-4">
          <button onClick={() => cliRef.current?.click()} className="grid h-32 w-32 place-items-center border border-dashed border-ink-4 bg-white hover:border-ink">
            {p.clienteLogo ? <img src={p.clienteLogo} className="h-full w-full object-contain p-2" /> : <span className="flex flex-col items-center gap-1 text-[11px] text-ink-3"><ImagePlus size={20} /> Carregar</span>}
          </button>
          {p.clienteLogo && <button className="btn-ghost" onClick={() => up((x) => { x.clienteLogo = undefined; })}><Trash2 size={13} /> Remover</button>}
          <input ref={cliRef} type="file" accept="image/*" className="hidden" onChange={async (ev) => { const f = ev.target.files?.[0]; if (!f) return; const d = await logoLeve(await compressImage(await readFile(f), 600, 0.92)); up((x) => { x.clienteLogo = d; }); }} />
        </div>
      </Section>

      <Section n="03" title="Revisões e distribuição" sub="Anexos A e B do relatório: histórico de versões e exemplares entregues." right={<div className="flex gap-2">
        <button className="btn" onClick={() => up((x) => { x.revisoes = [...(x.revisoes ?? []), { versao: x.versao, data: x.data, descricao: '' }]; })}><Plus size={14} /> Revisão</button>
        <button className="btn" onClick={() => up((x) => { x.distribuicao = [...(x.distribuicao ?? []), { exemplar: String((x.distribuicao?.length ?? 0) + 1), entidade: '', suporte: 'Digital' }]; })}><Plus size={14} /> Exemplar</button>
      </div>}>
        {(p.revisoes ?? []).length > 0 && (
          <table className="tbl mb-4"><thead><tr><th className="w-24">Versão</th><th className="w-40">Data</th><th>Descrição da revisão</th><th className="w-8" /></tr></thead><tbody>
            {(p.revisoes ?? []).map((r, i) => (
              <tr key={i}><td><Text value={r.versao} onChange={(v) => up((x) => { x.revisoes![i].versao = v; })} /></td><td><input type="date" className="input" value={r.data} onChange={(e) => up((x) => { x.revisoes![i].data = e.target.value; })} /></td><td><Text value={r.descricao} onChange={(v) => up((x) => { x.revisoes![i].descricao = v; })} placeholder="ex.: Emissão inicial" /></td><td><button className="btn-icon" onClick={() => up((x) => { x.revisoes!.splice(i, 1); })}><Trash2 size={13} /></button></td></tr>
            ))}
          </tbody></table>
        )}
        {(p.distribuicao ?? []).length > 0 && (
          <table className="tbl"><thead><tr><th className="w-24">Exemplar</th><th>Entidade / destinatário</th><th className="w-40">Suporte</th><th className="w-8" /></tr></thead><tbody>
            {(p.distribuicao ?? []).map((d, i) => (
              <tr key={i}><td><Text value={d.exemplar} onChange={(v) => up((x) => { x.distribuicao![i].exemplar = v; })} /></td><td><Text value={d.entidade} onChange={(v) => up((x) => { x.distribuicao![i].entidade = v; })} placeholder="ex.: Responsável de segurança" /></td><td><Text value={d.suporte} onChange={(v) => up((x) => { x.distribuicao![i].suporte = v; })} /></td><td><button className="btn-icon" onClick={() => up((x) => { x.distribuicao!.splice(i, 1); })}><Trash2 size={13} /></button></td></tr>
            ))}
          </tbody></table>
        )}
        {!(p.revisoes ?? []).length && !(p.distribuicao ?? []).length && <p className="text-[12.5px] text-ink-3">Sem registos. Se ficar vazio, o anexo A indica apenas a versão e a data do projeto.</p>}
      </Section>

      <Section n="04" title="Conclusões do relatório" sub="Texto livre do autor. A app junta, antes deste texto, uma síntese factual dos resultados.">
        <Area value={p.conclusoes} onChange={(v) => up((x) => { x.conclusoes = v; })} rows={5} />
      </Section>
    </main>
  );
}
