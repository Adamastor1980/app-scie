import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { entrar } from '../cloud/firebase';
import { Lema, NomeApp, Simbolo } from '../ui/Marca';

const CATS = [
  { n: '1.ª', l: 'Risco reduzido', c: 'bg-cat1' },
  { n: '2.ª', l: 'Risco moderado', c: 'bg-cat2' },
  { n: '3.ª', l: 'Risco elevado', c: 'bg-cat3' },
  { n: '4.ª', l: 'Risco muito elevado', c: 'bg-cat4' },
];

function Google() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Entrar() {
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const go = async () => {
    setBusy(true);
    setErro('');
    try {
      await entrar();
    } catch (e) {
      const c = (e as { code?: string }).code ?? '';
      if (!c.includes('popup-closed') && !c.includes('cancelled-popup')) setErro('Não foi possível entrar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-paper text-ink">
      {/* grelha técnica de fundo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'linear-gradient(#14233A 1px, transparent 1px), linear-gradient(90deg, #14233A 1px, transparent 1px)', backgroundSize: '56px 56px' }}
      />
      <Simbolo className="pointer-events-none absolute hidden sm:block -bottom-[16vh] -right-[14vw] h-[86vh] w-[86vh] opacity-[0.06]" />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-12">
        <div className="flex items-center gap-3">
          <Simbolo className="h-10 w-10" />
          <NomeApp className="text-[19px]" />
        </div>
        <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-3 sm:block">Segurança contra incêndio em edifícios</span>
      </header>

      <main className="relative flex flex-1 items-center px-6 py-8 sm:px-12">
        <div className="w-full max-w-[880px]">
          <div className="mb-8 h-[6px] w-20 bg-fire" />
          <h1 className="font-display text-[clamp(44px,8vw,96px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Classificar.<br />Calcular.<br /><span className="text-fire">Cumprir.</span>
          </h1>
          <p className="mt-8 max-w-[520px] text-[15px] leading-relaxed text-ink-3">
            Categorias de risco, efetivo, carga de incêndio modificada e medidas de autoproteção — tudo com base no RJ-SCIE, no RT-SCIE e no Despacho n.º 8954/2020.
          </p>
          <Lema grande className="mt-6 max-w-[560px]" />

          <button
            onClick={go}
            disabled={busy}
            className="group mt-8 inline-flex h-11 items-center gap-3 border border-ink bg-ink pl-3.5 pr-4 text-[13.5px] font-medium text-white transition-colors hover:border-ink-2 hover:bg-ink-2 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <span className="grid h-6 w-6 place-items-center bg-white"><Google /></span>}
            <span className="mr-2">{busy ? 'A entrar…' : 'Entrar com Google'}</span>
            <ArrowRight size={15} className="text-fire transition-all group-hover:translate-x-0.5" />
          </button>
          {erro && <p className="mt-3 text-[13px] text-alerta">{erro}</p>}
        </div>
      </main>

      <footer className="relative px-6 pb-6 sm:px-12">
        <div className="mb-5 grid max-w-[880px] grid-cols-4 gap-px">
          {CATS.map((c) => (
            <div key={c.n}>
              <div className={`h-[5px] ${c.c}`} />
              <p className="mt-2 font-mono text-[11px] font-semibold">{c.n} categoria</p>
              <p className="hidden text-[11px] text-ink-3 sm:block">{c.l}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-4">
            DL 220/2008 · Lei 123/2019 · Portaria 135/2020 · Despacho 8954/2020
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">
            Autor <span className="text-fire">■</span> <span className="text-ink">Fernando Adamastor</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
