import { useP } from './ProjetoShell';
import { useStore } from '../store';
import { Area, Field, Section, Text } from '../ui/primitives';

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
  const perfilE = useStore((s) => s.empresaPadrao);
  const perfilA = useStore((s) => s.autorPadrao);

  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-8">
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

      <Section n="02" title="Conclusões do relatório" sub="Texto livre do autor. A app junta, antes deste texto, uma síntese factual dos resultados.">
        <Area value={p.conclusoes} onChange={(v) => up((x) => { x.conclusoes = v; })} rows={5} />
      </Section>
    </main>
  );
}
