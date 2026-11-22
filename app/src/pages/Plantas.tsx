import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import type { Planta } from '../data/types';
import { Empty, Field, Note, Select, Text, caberNaNuvem, compressImage, readFile } from '../ui/primitives';
import { uid } from '../store';

const TIPOS: { v: Planta['tipo']; l: string; ref: string }[] = [
  { v: 'localizacao', l: 'Planta de localização (1:2000 ou 1:5000)', ref: 'Anexo IV, art. 3.º a)' },
  { v: 'implantacao', l: 'Planta de implantação (1:200 ou 1:500)', ref: 'Anexo IV, art. 3.º c)' },
  { v: 'cortes', l: 'Cortes e alçados (1:100 ou 1:200)', ref: 'Anexo IV, art. 3.º b)' },
  { v: 'piso', l: 'Planta de piso (1:100 ou 1:200)', ref: 'Anexo IV, art. 3.º d)' },
  { v: 'outra', l: 'Outra peça desenhada / fotografia', ref: '' },
];

async function pdfParaImagens(file: File): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const out: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
    const page = await doc.getPage(i);
    const v0 = page.getViewport({ scale: 1 });
    const scale = Math.min(3, 2200 / Math.max(v0.width, v0.height));
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    out.push(canvas.toDataURL('image/jpeg', 0.9));
  }
  return out;
}

export default function Plantas() {
  const { p, up } = useP();
  const ref = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<Planta['tipo']>('piso');
  const [busy, setBusy] = useState(false);

  const add = async (files: FileList) => {
    setBusy(true);
    try {
      const novas: Planta[] = [];
      for (const f of Array.from(files)) {
        const imgs = await Promise.all((f.type === 'application/pdf' ? await pdfParaImagens(f) : [await compressImage(await readFile(f))]).map((x) => caberNaNuvem(x)));
        imgs.forEach((img, k) => novas.push({
          id: uid(), tipo, titulo: f.name.replace(/\.[^.]+$/, '') + (imgs.length > 1 ? ` — pág. ${k + 1}` : ''), escala: '', imagem: img, legenda: '',
        }));
      }
      up((x) => { x.plantas.push(...novas); });
    } catch (e) {
      alert('Não foi possível ler o ficheiro: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
      <p className="label !text-fire-ink">Peças desenhadas</p>
      <h1 className="h-display mb-3 mt-2 text-[40px]">Plantas e desenhos</h1>
      <p className="mb-6 max-w-3xl text-[13px] text-ink-3">
        O anexo IV do RJ-SCIE (art. 3.º) exige: planta de localização; cortes e alçados com a envolvente até 5 m; planta de implantação com acessibilidade dos bombeiros e hidrantes; plantas de todos os pisos com locais de risco, efetivos, resistência ao fogo, vias de evacuação, saídas e posição dos equipamentos de SCIE.
      </p>

      <div className="mb-8 flex flex-wrap items-end gap-3 border border-ink bg-white p-4">
        <Field label="Tipo de peça" className="w-full sm:min-w-[320px] sm:w-auto flex-1">
          <Select value={tipo} onChange={setTipo} options={TIPOS.map((t) => ({ v: t.v, l: t.l }))} />
        </Field>
        <button className="btn-fire h-9" disabled={busy} onClick={() => ref.current?.click()}><ImagePlus size={15} /> {busy ? 'A processar…' : 'Carregar imagens ou PDF'}</button>
        <input ref={ref} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = ''; }} />
      </div>

      {p.plantas.length === 0 ? (
        <Empty title="Sem peças desenhadas.">Carregue imagens (PNG, JPG) ou PDF (cada página é convertida em imagem). Ficam guardadas no próprio projeto e entram no relatório na ordem definida aqui.</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {p.plantas.map((pl, i) => (
            <div key={pl.id} className="grid gap-4 border border-ink bg-white p-4 md:grid-cols-[260px_1fr_auto]">
              <img src={pl.imagem} className="h-[180px] w-full border border-paper-3 bg-paper object-contain" />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Título" className="md:col-span-2"><Text value={pl.titulo} onChange={(v) => up((x) => { x.plantas[i].titulo = v; })} /></Field>
                <Field label="Tipo"><Select value={pl.tipo} onChange={(v) => up((x) => { x.plantas[i].tipo = v; })} options={TIPOS.map((t) => ({ v: t.v, l: t.l }))} /></Field>
                <Field label="Escala"><Text value={pl.escala} onChange={(v) => up((x) => { x.plantas[i].escala = v; })} placeholder="1:100" /></Field>
                <Field label="Legenda / notas" className="md:col-span-2"><Text value={pl.legenda} onChange={(v) => up((x) => { x.plantas[i].legenda = v; })} /></Field>
              </div>
              <div className="flex flex-col gap-1">
                <button className="btn-icon" disabled={i === 0} onClick={() => up((x) => { const [a] = x.plantas.splice(i, 1); x.plantas.splice(i - 1, 0, a); })}><ArrowUp size={15} /></button>
                <button className="btn-icon" disabled={i === p.plantas.length - 1} onClick={() => up((x) => { const [a] = x.plantas.splice(i, 1); x.plantas.splice(i + 1, 0, a); })}><ArrowDown size={15} /></button>
                <button className="btn-icon" onClick={() => up((x) => { x.plantas.splice(i, 1); })}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6"><Note>As plantas de emergência (art. 205.º n.º 6 do RT-SCIE) seguem a NP 4386 e integram o plano de emergência interno, quando exigível.</Note></div>
    </main>
  );
}
