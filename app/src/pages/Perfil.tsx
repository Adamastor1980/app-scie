import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { novoProjeto, useStore } from '../store';
import { Area, Field, Section, Text, readFile } from '../ui/primitives';

/** Enquadra a imagem num quadrado branco (sem cortar nem deformar o logótipo) */
async function quadrado(dataUrl: string, lado = 600): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = lado;
  c.height = lado;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, lado, lado);
  const k = Math.min(lado / img.width, lado / img.height);
  const w = img.width * k, h = img.height * k;
  ctx.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
  return c.toDataURL('image/png');
}

export default function Perfil() {
  const e = useStore((s) => s.empresaPadrao) ?? novoProjeto().empresa;
  const a = useStore((s) => s.autorPadrao) ?? novoProjeto().autor;
  const setPerfil = useStore((s) => s.setPerfil);
  const logoRef = useRef<HTMLInputElement>(null);
  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-8">
      <p className="label !text-fire">Quem faz os projetos</p>
      <h1 className="h-display mb-3 mt-2 text-[44px]">A minha empresa</h1>
      <p className="mb-8 max-w-3xl text-[13px] text-ink-3">Estes dados são usados em todos os projetos e relatórios (capa, cabeçalhos, apresentação da empresa e termo do autor). Uma alteração aqui atualiza todos os projetos. Ao exportar um projeto em JSON, estes dados vão junto; ao importar noutro computador sem perfil, são adotados automaticamente.</p>
      <Section n="01" title="Empresa" sub="Aparece na capa, no cabeçalho de todas as páginas e na secção «Apresentação da empresa» de todos os relatórios.">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col gap-2">
            <span className="label">Logótipo (quadrado)</span>
            <button onClick={() => logoRef.current?.click()} className="grid aspect-square w-full place-items-center border border-dashed border-ink-4 bg-white hover:border-ink">
              {e.logo ? <img src={e.logo} className="h-full w-full object-contain p-2" /> : <span className="flex flex-col items-center gap-2 text-[12px] text-ink-3"><ImagePlus size={22} /> Carregar imagem</span>}
            </button>
            {e.logo && <button className="btn-ghost" onClick={() => setPerfil((ee) => { ee.logo = undefined; })}><Trash2 size={13} /> Remover</button>}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async (ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              const d = await quadrado(await readFile(f));
              setPerfil((ee) => { ee.logo = d; });
            }} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da empresa"><Text value={e.nome} onChange={(v) => setPerfil((ee) => { ee.nome = v; })} /></Field>
            <Field label="NIF"><Text value={e.nif} onChange={(v) => setPerfil((ee) => { ee.nif = v; })} /></Field>
            <Field label="Morada" className="md:col-span-2"><Text value={e.morada} onChange={(v) => setPerfil((ee) => { ee.morada = v; })} /></Field>
            <Field label="Telefone"><Text value={e.telefone} onChange={(v) => setPerfil((ee) => { ee.telefone = v; })} /></Field>
            <Field label="Email"><Text value={e.email} onChange={(v) => setPerfil((ee) => { ee.email = v; })} /></Field>
            <Field label="Website"><Text value={e.website} onChange={(v) => setPerfil((ee) => { ee.website = v; })} /></Field>
            <Field label="Registo ANEPC (art. 23.º RJ-SCIE)" hint="Entidades de comercialização, instalação e manutenção."><Text value={e.alvara} onChange={(v) => setPerfil((ee) => { ee.alvara = v; })} /></Field>
            <Field label="Apresentação da empresa" className="md:col-span-2" hint="Quem somos, áreas de atuação, certificações, equipa técnica. Vai para a secção «Apresentação da empresa» do relatório.">
              <Area value={e.apresentacao} onChange={(v) => setPerfil((ee) => { ee.apresentacao = v; })} rows={6} />
            </Field>
          </div>
        </div>
      </Section>

      <Section n="02" title="Autor técnico" sub="RJ-SCIE, art. 15.º-A: nas 2.ª, 3.ª e 4.ª categorias o autor tem de ser arquiteto (OA), engenheiro (OE) ou engenheiro técnico (OET) com certificação de especialização, registado na ANEPC.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nome"><Text value={a.nome} onChange={(v) => setPerfil((_, aa) => { aa.nome = v; })} /></Field>
          <Field label="Qualificação"><Text value={a.qualificacao} onChange={(v) => setPerfil((_, aa) => { aa.qualificacao = v; })} placeholder="ex.: Engenheiro de Segurança" /></Field>
          <Field label="Email"><Text value={a.email} onChange={(v) => setPerfil((_, aa) => { aa.email = v; })} /></Field>
          <Field label="Associação profissional">
            <select className="input" value={a.ordem} onChange={(e) => setPerfil((_, aa) => { aa.ordem = e.target.value; })}>
              <option value="">—</option><option>Ordem dos Engenheiros (OE)</option><option>Ordem dos Engenheiros Técnicos (OET)</option><option>Ordem dos Arquitectos (OA)</option>
            </select>
          </Field>
          <Field label="N.º de membro"><Text value={a.numero} onChange={(v) => setPerfil((_, aa) => { aa.numero = v; })} /></Field>
          <Field label="N.º de registo ANEPC"><Text value={a.registoAnepc} onChange={(v) => setPerfil((_, aa) => { aa.registoAnepc = v; })} /></Field>
        </div>
      </Section>

    </main>
  );
}
