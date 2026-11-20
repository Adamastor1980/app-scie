import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export interface ComboItem {
  key: string | number;
  label: string;
  right?: string;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Caixa de pesquisa com lista filtrada (tabelas longas do Despacho) */
export default function Combo({ items, value, onPick, placeholder }: { items: ComboItem[]; value: string; onPick: (i: ComboItem) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, []);
  const list = useMemo(() => {
    const n = norm(q.trim());
    const r = n ? items.filter((i) => norm(i.label).includes(n)) : items;
    return r.slice(0, 80);
  }, [q, items]);
  return (
    <div ref={ref} className="relative">
      <button type="button" className="input flex items-center justify-between text-left" onClick={() => setOpen((o) => !o)}>
        <span className={`truncate ${value ? '' : 'text-ink-4'}`}>{value || placeholder || 'Escolher…'}</span>
        <Search size={13} className="shrink-0 text-ink-4" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-30 min-w-[min(360px,calc(100vw-2rem))] border border-ink bg-white shadow-[6px_6px_0_rgba(15,15,14,0.15)]">
          <input autoFocus className="input border-0 border-b border-ink" placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="max-h-[300px] overflow-y-auto">
            {list.map((i) => (
              <li key={i.key}>
                <button type="button" className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-[12.5px] hover:bg-ink hover:text-white" onClick={() => { onPick(i); setOpen(false); setQ(''); }}>
                  <span>{i.label}</span>
                  {i.right && <span className="shrink-0 font-mono text-[11px] opacity-70">{i.right}</span>}
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-3 py-2 text-[12px] text-ink-3">Sem resultados.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
