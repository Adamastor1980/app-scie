import { useEffect, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import type { Cat } from '../data/types';

export function Field({ label, hint, children, className = '', legal }: { label: string; hint?: string; children: ReactNode; className?: string; legal?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="label">{label}</span>
        {legal && <span className="ref whitespace-nowrap">{legal}</span>}
      </span>
      {children}
      {hint && <span className="text-[11.5px] leading-snug text-ink-3">{hint}</span>}
    </label>
  );
}

const parse = (s: string) => {
  const v = parseFloat(s.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(v) ? v : 0;
};

export function Num({ value, onChange, suffix, min, step, className = '', placeholder, mostrarZero = false }: {
  /** onChange recebe também o texto escrito: caixa apagada («») é diferente de 0 escrito */
  value: number | undefined; onChange: (v: number, texto: string) => void; suffix?: string; min?: number; step?: number; className?: string; placeholder?: string; mostrarZero?: boolean;
}) {
  const txt = (v: number | undefined) => (v === undefined || (v === 0 && !mostrarZero) ? '' : String(v).replace('.', ','));
  const [s, setS] = useState(txt(value));
  useEffect(() => {
    if (parse(s) !== (value ?? 0) || (mostrarZero && s === '' && value === 0)) setS(txt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mostrarZero]);
  return (
    <div className={`relative ${className}`}>
      <input
        className={`input-num ${suffix ? 'pr-12' : ''}`}
        inputMode="decimal"
        value={s}
        onFocus={(e) => e.target.select()}
        placeholder={placeholder ?? '0'}
        step={step}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9,.\-\s]/g, '');
          setS(t);
          let v = parse(t);
          if (min !== undefined && v < min) v = min;
          onChange(v, t);
        }}
      />
      {suffix && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-ink-4">{suffix}</span>}
    </div>
  );
}

export function Text({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return <input className={`input ${className}`} value={value} placeholder={placeholder ?? ' '} onChange={(e) => onChange(e.target.value)} />;
}

export function Area({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea className="input" rows={rows} value={value} placeholder={placeholder ?? ' '} onChange={(e) => onChange(e.target.value)} />;
}

export function Select<T extends string | number>({ value, onChange, options, className = '' }: {
  value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; className?: string;
}) {
  return (
    <select
      className={`input ${className}`}
      value={String(value)}
      onChange={(e) => {
        const o = options.find((x) => String(x.v) === e.target.value);
        if (o) onChange(o.v);
      }}
    >
      {options.map((o) => (
        <option key={String(o.v)} value={String(o.v)}>{o.l}</option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint, legal }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; legal?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex w-full items-start gap-3 border p-3 text-left transition-colors ${checked ? 'border-ink bg-white' : 'border-paper-3 bg-white/60 hover:border-ink-4'}`}>
      <span className={`mt-0.5 flex h-[18px] w-[32px] shrink-0 items-center border border-ink px-[2px] transition-colors ${checked ? 'bg-ink' : 'bg-white'}`}>
        <span className={`h-[12px] w-[12px] transition-transform ${checked ? 'translate-x-[14px] bg-fire' : 'bg-ink'}`} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold leading-tight">{label}</span>
        {hint && <span className="text-[11.5px] leading-snug text-ink-3">{hint}</span>}
        {legal && <span className="ref">{legal}</span>}
      </span>
    </button>
  );
}

export function Section({ n, title, sub, right, children, className = '' }: { n?: string; title: string; sub?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-10 ${className}`}>
      <header className="mb-4 flex items-end justify-between gap-4 border-b-2 border-ink pb-2">
        <div className="flex items-baseline gap-3">
          {n && <span className="font-mono text-[12px] font-semibold text-fire-ink">{n}</span>}
          <div>
            <h2 className="section-title">{title}</h2>
            {sub && <p className="mt-0.5 text-[12.5px] text-ink-3">{sub}</p>}
          </div>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

export const CAT_COR: Record<Cat, string> = { 1: 'bg-cat1', 2: 'bg-cat2', 3: 'bg-cat3', 4: 'bg-cat4' };

export function CatBadge({ cat, size = 'md' }: { cat: Cat | null; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-6 px-2 text-[11px]' : size === 'lg' ? 'h-10 px-4 text-[15px]' : 'h-7 px-2.5 text-[12px]';
  if (cat == null) return <span className={`inline-flex items-center border border-dashed border-ink-4 font-mono font-semibold text-ink-3 ${s}`} title="Categoria por atribuir: faltam critérios">POR ATRIBUIR</span>;
  return <span className={`inline-flex items-center font-mono font-semibold text-white ${CAT_COR[cat]} ${s}`}>{cat}.ª CAT</span>;
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'fire' }) {
  const c = tone === 'warn' ? 'border-warn bg-warn-soft' : tone === 'fire' ? 'border-alerta bg-alerta-soft' : 'border-ink-4 bg-paper';
  return (
    <div className={`flex gap-2.5 border-l-[3px] px-3 py-2.5 text-[12.5px] leading-relaxed ${c}`}>
      <Info size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Stat({ label, value, unit, sub, accent }: { label: string; value: ReactNode; unit?: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col gap-3 border p-4 ${accent ? 'border-ink bg-ink text-white' : 'border-ink bg-white'}`}>
      <span className={`label ${accent ? '!text-white/60' : ''}`}>{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-[34px] font-extrabold leading-none tracking-tight num">{value}</span>
        {unit && <span className={`font-mono text-[12px] ${accent ? 'text-white/60' : 'text-ink-3'}`}>{unit}</span>}
      </div>
      {/* número sempre à mesma altura, com ou sem nota por baixo */}
      <span className={`min-h-[1.2em] text-[11.5px] ${accent ? 'text-white/70' : 'text-ink-3'}`}>{sub}</span>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-ink-4 bg-white/50 p-6">
      <p className="font-display text-[17px] font-bold">{title}</p>
      {children && <div className="max-w-xl text-[13px] text-ink-3">{children}</div>}
      {action}
    </div>
  );
}

export function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** Reduz imagens grandes para poupar espaço (mantém PDF nítido até ~2000 px) */
export async function compressImage(dataUrl: string, max = 2200, quality = 0.88, force = false): Promise<string> {
  if (!dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:image/svg')) return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const k = Math.min(1, max / Math.max(img.width, img.height));
  if (!force && k === 1 && dataUrl.length < 1_500_000) return dataUrl;
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', quality);
}

/** Garante que a imagem cabe num documento da nuvem (limite de 1 MiB): reduz qualidade e dimensão se necessário */
export async function caberNaNuvem(dataUrl: string, maxChars = 900_000): Promise<string> {
  let d = dataUrl;
  let lado = 2200;
  let q = 0.85;
  for (let i = 0; i < 8 && d.length > maxChars; i++) {
    d = await compressImage(dataUrl, lado, q, true);
    if (q > 0.6) q -= 0.08;
    else lado = Math.round(lado * 0.85);
  }
  return d;
}

/** Logótipos: quadro até 500 px e no máximo ~200 kB, para caberem folgadamente no documento do projeto na nuvem */
export async function logoLeve(dataUrl: string): Promise<string> {
  if (dataUrl.length <= 200_000) return dataUrl;
  return caberNaNuvem(await compressImage(dataUrl, 500, 0.9, true), 200_000);
}

/** Depois de criar um bloco no topo da lista, leva o ecrã até ele e destaca-o por instantes (marca com data-bloco={id}). */
export function mostrarNovo(id: string) {
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>(`[data-bloco="${id}"]`);
    if (!el) return;
    el.style.scrollMarginTop = '96px';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('bloco-novo');
    setTimeout(() => el.classList.remove('bloco-novo'), 1600);
  }, 60);
}

/** Campos obrigatórios por preencher: a caixa fica a âmbar (classe «falta») e esta lista diz o que falta e o que significa. */
export function Faltas({ itens, titulo = 'Falta preencher para o cálculo' }: { itens: [string, string][]; titulo?: string }) {
  if (!itens.length) return null;
  return (
    <div className="mt-3 border-l-[3px] border-alerta bg-alerta-soft px-4 py-3 text-[12.5px]">
      <p className="mb-1 font-semibold text-alerta">{titulo}:</p>
      <ul className="flex flex-col gap-0.5">
        {itens.map(([c, s], i) => <li key={i}><b>{c}</b> <span className="text-ink-2">— {s}</span></li>)}
      </ul>
    </div>
  );
}
