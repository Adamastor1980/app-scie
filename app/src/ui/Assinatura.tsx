import { useEffect, useRef, useState } from 'react';
import { Eraser, Check, Trash2 } from 'lucide-react';

/** Recorta o traço (sem margens vazias) e devolve PNG transparente, com no máximo 600 px de largura */
function recortar(c: HTMLCanvasElement): string | null {
  const ctx = c.getContext('2d')!;
  const { width: w, height: h } = c;
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const m = 6; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
  const k = Math.min(1, 600 / (x1 - x0 + 1));
  const o = document.createElement('canvas');
  o.width = Math.round((x1 - x0 + 1) * k); o.height = Math.round((y1 - y0 + 1) * k);
  o.getContext('2d')!.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, o.width, o.height);
  return o.toDataURL('image/png');
}

/** Quadro para assinar com o dedo, caneta ou rato (telemóvel, tablet e computador) */
export default function Assinatura({ valor, onGuardar }: { valor?: string; onGuardar: (v: string | undefined) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [aEditar, setAEditar] = useState(!valor);
  const [temTraco, setTemTraco] = useState(false);
  const [gravada, setGravada] = useState(false);
  const desenhar = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c || !aEditar) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#14233A'; ctx.lineWidth = 2.2;
  }, [aEditar]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  const limpar = () => { const c = ref.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setTemTraco(false); setGravada(false); };
  // grava sozinha no fim de cada traço (como o resto da app): sair da página não perde a assinatura
  const gravar = () => { const v = ref.current && recortar(ref.current); if (v) { onGuardar(v); setGravada(true); } };

  if (!aEditar && valor) return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex h-[120px] w-full max-w-[420px] items-center justify-center overflow-hidden border border-ink-4 bg-white p-2"><img src={valor} alt="Assinatura guardada" className="h-full w-full object-contain" /></div>
      <div className="flex gap-2">
        <button className="btn-ghost" onClick={() => setAEditar(true)}><Eraser size={13} /> Assinar de novo</button>
        <button className="btn-ghost" onClick={() => onGuardar(undefined)}><Trash2 size={13} /> Apagar</button>
      </div>
    </div>
  );

  return (
    <div>
      <canvas
        ref={ref}
        className="block h-[170px] w-full max-w-[520px] cursor-crosshair touch-none border border-dashed border-ink-4 bg-white"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); desenhar.current = true; const ctx = e.currentTarget.getContext('2d')!; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke(); setTemTraco(true); }}
        onPointerMove={(e) => { if (!desenhar.current) return; const ctx = e.currentTarget.getContext('2d')!; const [x, y] = pos(e); ctx.lineWidth = e.pointerType === 'pen' && e.pressure ? 1.2 + e.pressure * 2.4 : 2.2; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); }}
        onPointerUp={() => { if (desenhar.current) { desenhar.current = false; gravar(); } }}
        onPointerCancel={() => { if (desenhar.current) { desenhar.current = false; gravar(); } }}
      />
      <p className={`mt-1 text-[11.5px] ${gravada ? 'font-semibold text-ok' : 'text-ink-3'}`}>{gravada ? '✓ Assinatura guardada — aparece nos documentos' : 'Assine dentro do quadro com o dedo, a caneta ou o rato. Fica guardada automaticamente.'}</p>
      <div className="mt-2 flex gap-2">
        <button className="btn-ghost" onClick={limpar}><Eraser size={13} /> Limpar</button>
        <button className="btn" disabled={!temTraco} onClick={() => { gravar(); setAEditar(false); setTemTraco(false); }}><Check size={13} /> Concluir</button>
        {valor && <button className="btn-ghost" onClick={() => setAEditar(false)}>Cancelar</button>}
      </div>
    </div>
  );
}
