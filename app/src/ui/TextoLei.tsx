import { useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';

type Artigo = { titulo: string; texto: string[] };
type Textos = { RT: Record<string, Artigo>; RJ: Record<string, Artigo> };
export type Ref = { dip: 'RT' | 'RJ'; art: string };

const NOME = {
  RT: 'RT-SCIE — Portaria n.º 1532/2008, republicada pela Portaria n.º 135/2020',
  RJ: 'RJ-SCIE — Decreto-Lei n.º 220/2008, republicado pela Lei n.º 123/2019',
};

/** Extrai os artigos citados numa base legal (ex.: «RT-SCIE, arts. 54.º e 56.º; RJ-SCIE, art. 11.º»). */
export function refsDeBase(base: string): Ref[] {
  const out: Ref[] = [];
  let dip: 'RT' | 'RJ' = 'RT';
  for (const seg of base.split(/;/)) {
    if (/RJ-SCIE/.test(seg)) dip = 'RJ';
    else if (/RT-SCIE/.test(seg)) dip = 'RT';
    if (!/\barts?\./.test(seg)) continue;
    const parte = seg.slice(seg.search(/\barts?\./));
    // intervalos «186.º a 189.º»
    const intervalos = [...parte.matchAll(/(\d+)\.º a (\d+)\.º/g)];
    for (const m of intervalos) {
      const a = +m[1], b = +m[2];
      if (b > a && b - a <= 40) for (let n = a; n <= b; n++) out.push({ dip, art: String(n) });
    }
    for (const m of parte.matchAll(/(\d+)\.º(-[A-Z])?/g)) out.push({ dip, art: m[1] + (m[2] ?? '') });
  }
  const vistos = new Set<string>();
  return out.filter((r) => { const k = r.dip + r.art; if (vistos.has(k)) return false; vistos.add(k); return true; });
}

let cache: Promise<Textos> | null = null;
const carregar = () => (cache ??= import('../data/textosLegais.json').then((m) => (m.default ?? m) as unknown as Textos));

/** Janela com o texto integral dos artigos (texto republicado no Diário da República). */
export default function TextoLei({ refs, titulo, onFechar }: { refs: Ref[]; titulo?: string; onFechar: () => void }) {
  const [txt, setTxt] = useState<Textos | null>(null);
  const [i, setI] = useState(0);
  useEffect(() => { carregar().then(setTxt); }, []);
  const r = refs[i];
  const a = txt && r ? txt[r.dip][r.art] : undefined;
  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center bg-ink/60 sm:items-center sm:p-6" onClick={onFechar}>
      <div className="flex max-h-full w-full max-w-[820px] flex-col overflow-hidden border border-ink bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-ink px-5 py-4">
          <div>
            <p className="label !text-fire flex items-center gap-1.5"><BookOpen size={13} /> Texto integral da lei</p>
            {titulo && <p className="mt-1 text-[13px] text-ink-3">{titulo}</p>}
          </div>
          <button className="btn-icon" onClick={onFechar}><X size={18} /></button>
        </div>
        {refs.length > 1 && (
          <div className="flex gap-px overflow-x-auto border-b border-ink bg-paper">
            {refs.map((x, k) => (
              <button key={x.dip + x.art} onClick={() => setI(k)} className={`whitespace-nowrap px-3 py-2 font-mono text-[12px] ${k === i ? 'bg-white font-semibold text-fire' : 'text-ink-3 hover:text-ink'}`}>
                {x.dip === 'RJ' ? 'RJ ' : ''}art. {x.art}.º
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!txt ? <p className="text-[13px] text-ink-3">A carregar…</p> : !r ? <p className="text-[13px] text-ink-3">Sem artigo identificado nesta base legal.</p> : !a ? (
            <p className="text-[13px] text-ink-3">Artigo {r.art}.º não encontrado no texto republicado.</p>
          ) : (
            <>
              <p className="ref mb-1">{NOME[r.dip]}</p>
              <h3 className="mb-3 font-display text-[19px] font-bold">Artigo {r.art}.º — {a.titulo}</h3>
              {a.texto.map((p, k) => (
                <p key={k} className={`mb-2 text-[13.5px] leading-relaxed ${/^[a-z]\)|^[ivx]+\)/.test(p) ? 'pl-5' : ''} ${/^QUADRO/.test(p) ? 'mt-3 font-semibold' : ''}`}>{p}</p>
              ))}
              {a.texto.some((p) => /^QUADRO/.test(p)) && <p className="mt-3 border-l-[3px] border-fire bg-fire-soft px-3 py-2 text-[12px]">Os quadros perdem o formato em texto corrido: consulte-os organizados na página «Tabelas legais».</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
