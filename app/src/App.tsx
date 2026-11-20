import { useEffect, useState } from 'react';
import { BookOpen, Building, FolderOpen } from 'lucide-react';
import { go, match, useHash } from './router';
import { useStore } from './store';
import Home from './pages/Home';
import ProjetoShell from './pages/ProjetoShell';
import Tabelas from './pages/Tabelas';
import Perfil from './pages/Perfil';
import Conta, { useLigacaoNuvem } from './cloud/Conta';

function Logo() {
  return (
    <button onClick={() => go('/')} className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center bg-fire">
        <svg viewBox="0 0 32 32" className="h-5 w-5"><path d="M16 4c1 5 7 7 7 14a7 7 0 0 1-14 0c0-3 1.5-5 3-6.5 0 2.5 1 4 2.5 4.5C13 11 15 8 16 4z" fill="#fff" /></svg>
      </span>
      <span className="hidden font-display text-[17px] font-extrabold tracking-tight text-white sm:inline">
        SCIE<span className="text-fire">/</span>CALC
      </span>
    </button>
  );
}

export default function App() {
  const path = useHash();
  const [ready, setReady] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setReady(true));
    // a hidratação pode terminar antes de este efeito correr
    if (useStore.persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);

  useLigacaoNuvem();
  const pm = match('/p/:pid', path) || matchPrefix(path);
  const isTabelas = path.startsWith('/tabelas');
  const isPerfil = path.startsWith('/empresa');

  return (
    <div className="min-h-full">
      <header className="no-print sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-black bg-ink px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-8">
          <Logo />
          <nav className="flex items-center">
            <a href="#/" className={`flex h-14 items-center gap-2 border-b-2 px-2.5 text-[13px] md:px-3 font-semibold ${!isTabelas && !isPerfil ? 'border-fire text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              <FolderOpen size={15} /> <span className="hidden md:inline">Projetos</span>
            </a>
            <a href="#/tabelas" className={`flex h-14 items-center gap-2 border-b-2 px-2.5 text-[13px] md:px-3 font-semibold ${isTabelas ? 'border-fire text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              <BookOpen size={15} /> <span className="hidden md:inline">Tabelas legais</span>
            </a>
            <a href="#/empresa" className={`flex h-14 items-center gap-2 border-b-2 px-2.5 text-[13px] md:px-3 font-semibold ${isPerfil ? 'border-fire text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              <Building size={15} /> <span className="hidden md:inline">A minha empresa</span>
            </a>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-6">
        <Conta />
        <div className="hidden items-center gap-3 font-mono text-[10.5px] uppercase tracking-wider text-white/50 2xl:flex">
          <span>DL 220/2008 · Lei 123/2019</span>
          <span className="text-fire">■</span>
          <span>Portaria 135/2020</span>
          <span className="text-fire">■</span>
          <span>Despacho 8954/2020</span>
        </div>
        </div>
      </header>
      {!ready ? (
        <div className="p-10 font-mono text-sm text-ink-3">A carregar…</div>
      ) : isTabelas ? (
        <Tabelas />
      ) : isPerfil ? (
        <Perfil />
      ) : pm ? (
        <ProjetoShell pid={pm.pid} path={path} />
      ) : (
        <Home />
      )}
    </div>
  );
}

function matchPrefix(path: string) {
  const m = path.match(/^\/p\/([^/]+)/);
  return m ? { pid: m[1] } : null;
}
