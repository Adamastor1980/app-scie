import { useEffect, useState } from 'react';
import { BookOpen, Building, FolderOpen } from 'lucide-react';
import { go, match, useHash } from './router';
import { useStore } from './store';
import Home from './pages/Home';
import ProjetoShell from './pages/ProjetoShell';
import Tabelas from './pages/Tabelas';
import Perfil from './pages/Perfil';

function Logo() {
  return (
    <button onClick={() => go('/')} className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center bg-fire">
        <svg viewBox="0 0 32 32" className="h-5 w-5"><path d="M16 4c1 5 7 7 7 14a7 7 0 0 1-14 0c0-3 1.5-5 3-6.5 0 2.5 1 4 2.5 4.5C13 11 15 8 16 4z" fill="#fff" /></svg>
      </span>
      <span className="font-display text-[17px] font-extrabold tracking-tight text-white">
        SCIE<span className="text-fire">/</span>CALC
      </span>
    </button>
  );
}

export default function App() {
  const path = useHash();
  const [ready, setReady] = useState(useStore.persist.hasHydrated());
  useEffect(() => useStore.persist.onFinishHydration(() => setReady(true)), []);

  const pm = match('/p/:pid', path) || matchPrefix(path);
  const isTabelas = path.startsWith('/tabelas');
  const isPerfil = path.startsWith('/empresa');

  return (
    <div className="min-h-full">
      <header className="no-print sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black bg-ink px-5">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#/" className={`flex h-14 items-center gap-2 border-b-2 px-3 text-[13px] font-semibold ${!isTabelas && !isPerfil ? 'border-fire text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              <FolderOpen size={15} /> Projetos
            </a>
            <a href="#/tabelas" className={`flex h-14 items-center gap-2 border-b-2 px-3 text-[13px] font-semibold ${isTabelas ? 'border-fire text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              <BookOpen size={15} /> Tabelas legais
            </a>
            <a href="#/empresa" className={`flex h-14 items-center gap-2 border-b-2 px-3 text-[13px] font-semibold ${isPerfil ? 'border-fire text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              <Building size={15} /> A minha empresa
            </a>
          </nav>
        </div>
        <div className="hidden items-center gap-3 font-mono text-[10.5px] uppercase tracking-wider text-white/50 lg:flex">
          <span>DL 220/2008 · Lei 123/2019</span>
          <span className="text-fire">■</span>
          <span>Portaria 135/2020</span>
          <span className="text-fire">■</span>
          <span>Despacho 8954/2020</span>
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
