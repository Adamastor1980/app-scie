import { useEffect, useRef, useState } from 'react';
import { Check, Eraser, Grid3x3, Pen, Redo2, Trash2, Undo2, X } from 'lucide-react';

/**
 * Editor de desenho à mão (tablet com caneta/dedo, ou rato).
 * Fundo opcional: uma fotografia (para anotar por cima) ou quadriculado.
 * Devolve a imagem final em JPEG (data URL).
 */
type Traco = { cor: string; esp: number; borracha: boolean; pts: [number, number][] };

const W = 1600;
const CORES = ['#14233A', '#C2362B', '#1D5FD1', '#127A4B'];
const ESPESSURAS = [3, 6, 12];

export default function Desenho({ fundo, onGuardar, onFechar }: { fundo?: string; onGuardar: (img: string) => void; onFechar: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [H, setH] = useState(1200);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tracos, setTracos] = useState<Traco[]>([]);
  const [refazer, setRefazer] = useState<Traco[]>([]);
  const [cor, setCor] = useState(CORES[1]);
  const [esp, setEsp] = useState(ESPESSURAS[1]);
  const [borracha, setBorracha] = useState(false);
  const [grelha, setGrelha] = useState(!fundo);
  const atual = useRef<Traco | null>(null);

  // fundo: a proporção do desenho segue a da fotografia
  useEffect(() => {
    if (!fundo) return;
    const i = new Image();
    i.onload = () => { setImg(i); setH(Math.round((W * i.height) / i.width)); };
    i.src = fundo;
  }, [fundo]);

  const desenharFundo = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    if (img) ctx.drawImage(img, 0, 0, W, H);
    else if (grelha) {
      ctx.strokeStyle = '#EFEDE4';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
  };

  // os traços ficam numa camada própria: a borracha apaga traços, nunca a fotografia de fundo
  const camada = useRef<HTMLCanvasElement | null>(null);
  const redesenhar = (lista: Traco[]) => {
    const c = cv.current;
    if (!c) return;
    if (!camada.current) camada.current = document.createElement('canvas');
    const l = camada.current;
    l.width = W;
    l.height = H;
    const lc = l.getContext('2d')!;
    for (const t of lista) {
      if (!t.pts.length) continue;
      lc.lineCap = 'round';
      lc.lineJoin = 'round';
      lc.lineWidth = t.borracha ? t.esp * 4 : t.esp;
      lc.strokeStyle = t.borracha ? '#000' : t.cor;
      lc.globalCompositeOperation = t.borracha ? 'destination-out' : 'source-over';
      lc.beginPath();
      lc.moveTo(...t.pts[0]);
      if (t.pts.length === 1) lc.lineTo(t.pts[0][0] + 0.1, t.pts[0][1]);
      for (const p of t.pts.slice(1)) lc.lineTo(...p);
      lc.stroke();
    }
    const ctx = c.getContext('2d')!;
    desenharFundo(ctx);
    ctx.drawImage(l, 0, 0);
  };

  useEffect(() => { redesenhar(tracos); }); // eslint-disable-line react-hooks/exhaustive-deps

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pressao = e.pointerType === 'pen' && e.pressure > 0 ? 0.6 + e.pressure : 1;
    atual.current = { cor, esp: esp * pressao, borracha, pts: [ponto(e)] };
    setRefazer([]);
    redesenhar([...tracos, atual.current]);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!atual.current) return;
    const ev = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [];
    if (ev.length) {
      const r = e.currentTarget.getBoundingClientRect();
      for (const x of ev) atual.current.pts.push([((x.clientX - r.left) / r.width) * W, ((x.clientY - r.top) / r.height) * H]);
    } else atual.current.pts.push(ponto(e));
    redesenhar([...tracos, atual.current]);
  };
  const up = () => {
    if (!atual.current) return;
    const t = atual.current;
    atual.current = null;
    setTracos((l) => [...l, t]);
  };

  const guardar = () => {
    const c = cv.current!;
    onGuardar(c.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/95">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-ink px-3 py-2 text-white">
        <button className="flex h-10 w-10 items-center justify-center text-white/70 hover:text-white" title="Fechar sem guardar" onClick={() => { if (!tracos.length || confirm('Fechar sem guardar o desenho?')) onFechar(); }}><X size={20} /></button>
        <span className="mx-1 h-6 w-px bg-white/15" />
        {CORES.map((c) => (
          <button key={c} title="Cor" onClick={() => { setCor(c); setBorracha(false); }} className={`grid h-10 w-10 place-items-center ${!borracha && cor === c ? 'bg-white/15' : ''}`}>
            <span className="h-6 w-6 rounded-full border-2 border-white/80" style={{ background: c }} />
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-white/15" />
        {ESPESSURAS.map((e) => (
          <button key={e} title="Espessura" onClick={() => setEsp(e)} className={`grid h-10 w-10 place-items-center ${esp === e ? 'bg-white/15' : ''}`}>
            <span className="rounded-full bg-white" style={{ width: e + 4, height: e + 4 }} />
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-white/15" />
        <button title="Caneta" onClick={() => setBorracha(false)} className={`grid h-10 w-10 place-items-center ${!borracha ? 'bg-white/15' : 'text-white/70'}`}><Pen size={18} /></button>
        <button title="Borracha" onClick={() => setBorracha(true)} className={`grid h-10 w-10 place-items-center ${borracha ? 'bg-white/15' : 'text-white/70'}`}><Eraser size={18} /></button>
        <button title="Anular" disabled={!tracos.length} onClick={() => { setRefazer((r) => [...r, tracos[tracos.length - 1]]); setTracos((l) => l.slice(0, -1)); }} className="grid h-10 w-10 place-items-center text-white/80 disabled:opacity-30"><Undo2 size={18} /></button>
        <button title="Refazer" disabled={!refazer.length} onClick={() => { setTracos((l) => [...l, refazer[refazer.length - 1]]); setRefazer((r) => r.slice(0, -1)); }} className="grid h-10 w-10 place-items-center text-white/80 disabled:opacity-30"><Redo2 size={18} /></button>
        {!fundo && <button title="Quadriculado" onClick={() => setGrelha((g) => !g)} className={`grid h-10 w-10 place-items-center ${grelha ? 'bg-white/15' : 'text-white/70'}`}><Grid3x3 size={18} /></button>}
        <button title="Limpar tudo" disabled={!tracos.length} onClick={() => confirm('Apagar todos os traços?') && (setTracos([]), setRefazer([]))} className="grid h-10 w-10 place-items-center text-white/70 disabled:opacity-30"><Trash2 size={18} /></button>
        <button className="ml-auto flex h-10 items-center gap-2 bg-fire px-4 text-[14px] font-semibold text-ink hover:bg-fire-dark" onClick={guardar}><Check size={18} /> Guardar</button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden p-3">
        <canvas
          ref={cv}
          width={W}
          height={H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="max-h-full max-w-full touch-none bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
          style={{ aspectRatio: `${W} / ${H}`, cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}
