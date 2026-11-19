import { useRef } from 'react';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import { useStore } from '../store';
import { Area, Field, Note, Section, Text, compressImage, readFile } from '../ui/primitives';

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
  const guardarPadrao = useStore((s) => s.guardarPadrao);
  const logoRef = useRef<HTMLInputElement>(null);

  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-8">
      <h1 className="h-display mb-8 text-[40px]">Dados, empresa e autor</h1>

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

      <Section n="02" title="Empresa" sub="Aparece na capa, no cabeçalho de todas as páginas e na secção de apresentação." right={
        <button className="btn-ghost" onClick={() => { guardarPadrao(p); alert('Empresa e autor guardados como padrão para novos projetos.'); }}><Save size={14} /> Guardar como padrão</button>
      }>
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col gap-2">
            <span className="label">Logótipo</span>
            <button onClick={() => logoRef.current?.click()} className="grid h-[150px] place-items-center border border-dashed border-ink-4 bg-white hover:border-ink">
              {p.empresa.logo ? <img src={p.empresa.logo} className="max-h-[120px] max-w-[180px] object-contain" /> : <span className="flex flex-col items-center gap-2 text-[12px] text-ink-3"><ImagePlus size={22} /> Carregar imagem</span>}
            </button>
            {p.empresa.logo && <button className="btn-ghost" onClick={() => up((x) => { x.empresa.logo = undefined; })}><Trash2 size={13} /> Remover</button>}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const d = await compressImage(await readFile(f), 800, 0.92);
              up((x) => { x.empresa.logo = d; });
            }} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da empresa"><Text value={p.empresa.nome} onChange={(v) => up((x) => { x.empresa.nome = v; })} /></Field>
            <Field label="NIF"><Text value={p.empresa.nif} onChange={(v) => up((x) => { x.empresa.nif = v; })} /></Field>
            <Field label="Morada" className="md:col-span-2"><Text value={p.empresa.morada} onChange={(v) => up((x) => { x.empresa.morada = v; })} /></Field>
            <Field label="Telefone"><Text value={p.empresa.telefone} onChange={(v) => up((x) => { x.empresa.telefone = v; })} /></Field>
            <Field label="Email"><Text value={p.empresa.email} onChange={(v) => up((x) => { x.empresa.email = v; })} /></Field>
            <Field label="Website"><Text value={p.empresa.website} onChange={(v) => up((x) => { x.empresa.website = v; })} /></Field>
            <Field label="Registo ANEPC (art. 23.º RJ-SCIE)" hint="Entidades de comercialização, instalação e manutenção."><Text value={p.empresa.alvara} onChange={(v) => up((x) => { x.empresa.alvara = v; })} /></Field>
            <Field label="Apresentação da empresa" className="md:col-span-2" hint="Quem somos, áreas de atuação, certificações, equipa técnica. Vai para a secção «Apresentação da empresa» do relatório.">
              <Area value={p.empresa.apresentacao} onChange={(v) => up((x) => { x.empresa.apresentacao = v; })} rows={6} />
            </Field>
          </div>
        </div>
      </Section>

      <Section n="03" title="Autor técnico" sub="RJ-SCIE, art. 15.º-A: nas 2.ª, 3.ª e 4.ª categorias o autor tem de ser arquiteto (OA), engenheiro (OE) ou engenheiro técnico (OET) com certificação de especialização, registado na ANEPC.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nome"><Text value={p.autor.nome} onChange={(v) => up((x) => { x.autor.nome = v; })} /></Field>
          <Field label="Qualificação"><Text value={p.autor.qualificacao} onChange={(v) => up((x) => { x.autor.qualificacao = v; })} placeholder="ex.: Engenheiro de Segurança" /></Field>
          <Field label="Email"><Text value={p.autor.email} onChange={(v) => up((x) => { x.autor.email = v; })} /></Field>
          <Field label="Associação profissional">
            <select className="input" value={p.autor.ordem} onChange={(e) => up((x) => { x.autor.ordem = e.target.value; })}>
              <option value="">—</option><option>Ordem dos Engenheiros (OE)</option><option>Ordem dos Engenheiros Técnicos (OET)</option><option>Ordem dos Arquitectos (OA)</option>
            </select>
          </Field>
          <Field label="N.º de membro"><Text value={p.autor.numero} onChange={(v) => up((x) => { x.autor.numero = v; })} /></Field>
          <Field label="N.º de registo ANEPC"><Text value={p.autor.registoAnepc} onChange={(v) => up((x) => { x.autor.registoAnepc = v; })} /></Field>
        </div>
        <div className="mt-4"><Note>Os dados de autor e de empresa podem ser guardados como padrão e são preenchidos automaticamente em projetos novos.</Note></div>
      </Section>

      <Section n="04" title="Conclusões do relatório" sub="Texto livre do autor. A app junta, antes deste texto, uma síntese factual dos resultados.">
        <Area value={p.conclusoes} onChange={(v) => up((x) => { x.conclusoes = v; })} rows={5} />
      </Section>
    </main>
  );
}
