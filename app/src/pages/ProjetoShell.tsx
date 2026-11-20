import { nomeUT } from '../nome';
import { createContext, useContext, useEffect, useState } from 'react';
import { Building2, ChevronRight, Download, FileText, Image, LayoutDashboard, Menu, Plus, Settings2, ShieldCheck, X } from 'lucide-react';
import { novaUT, novoEdificio, useStore } from '../store';
import { go, match } from '../router';
import type { Projeto, UTNum } from '../data/types';
import { ROMANO } from '../data/rjscie';
import { classificar } from '../engine/calc';
import { CAT_COR } from '../ui/primitives';
import Overview from './Overview';
import DadosProjeto from './DadosProjeto';
import EdificioPage from './EdificioPage';
import UTPage from './UTPage';
import Plantas from './Plantas';
import Relatorio from './Relatorio';
import Autoprotecao from './Autoprotecao';
import MapDocumento from './MapDocumento';
import EscolherUT from './EscolherUT';

interface Ctx {
  p: Projeto;
  up: (fn: (p: Projeto) => void) => void;
  pedirUT: (eid: string) => void;
}
const PCtx = createContext<Ctx | null>(null);
export const useP = () => useContext(PCtx)!;

export function exportarJSON(p: Projeto) {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(p.referencia || p.nome).replace(/[^\w\-]+/g, '_')}.scie.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ProjetoShell({ pid, path }: { pid: string; path: string }) {
  const p = useStore((s) => s.projetos.find((x) => x.id === pid));
  const atualizar = useStore((s) => s.atualizar);
  const [escolher, setEscolher] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  useEffect(() => { setMenuAberto(false); }, [path]);

  if (!p) {
    return (
      <div className="p-10">
        <p className="mb-4 font-display text-xl font-bold">Projeto não encontrado.</p>
        <button className="btn" onClick={() => go('/')}>Voltar aos projetos</button>
      </div>
    );
  }
  const up = (fn: (p: Projeto) => void) => atualizar(pid, fn);
  const base = `/p/${pid}`;
  const rel = path.slice(base.length) || '/';

  const mU = match('/e/:eid/u/:uid/:step', rel) || match('/e/:eid/u/:uid', rel);
  const mE = match('/e/:eid', rel);

  const adicionarUT = (eid: string, tipo: UTNum, nome: string) => {
    const ut = novaUT(tipo);
    if (nome) ut.designacao = nome;
    up((pp) => {
      const e = pp.edificios.find((x) => x.id === eid);
      e?.uts.push(ut);
    });
    setEscolher(null);
    go(`${base}/e/${eid}/u/${ut.id}/fatores`);
  };

  let page;
  if (rel === '/' || rel === '') page = <Overview />;
  else if (rel === '/dados') page = <DadosProjeto />;
  else if (rel === '/plantas') page = <Plantas />;
  else if (rel === '/relatorio') page = <Relatorio />;
  else if (rel === '/autoprotecao') page = <Autoprotecao />;
  else if (rel === '/map') page = <MapDocumento />;
  else if (mU) page = <UTPage eid={mU.eid} uid={mU.uid} step={mU.step ?? 'fatores'} />;
  else if (mE) page = <EdificioPage eid={mE.eid} />;
  else page = <Overview />;

  const isReport = rel === '/relatorio';

  const NavItem = ({ to, icon, children, active }: { to: string; icon: React.ReactNode; children: React.ReactNode; active: boolean }) => (
    <a href={`#${base}${to}`} className={`flex h-9 items-center gap-2.5 border-l-2 px-3 text-[13px] font-semibold ${active ? 'border-fire bg-white text-ink' : 'border-transparent text-ink-2 hover:bg-white/60'}`}>
      {icon} {children}
    </a>
  );

  const menu = (
    <>
          <div className="border-b border-ink-4/40 px-4 py-4">
            <p className="label mb-1">Projeto</p>
            <p className="font-display text-[16px] font-bold leading-tight">{p.nome}</p>
            <p className="ref mt-1">{p.referencia || 'S/ ref.'} · v{p.versao}</p>
          </div>
          <nav className="flex flex-col py-2">
            <NavItem to="" icon={<LayoutDashboard size={15} />} active={rel === '/'}>Painel</NavItem>
            <NavItem to="/dados" icon={<Settings2 size={15} />} active={rel === '/dados'}>Dados do projeto</NavItem>
          </nav>
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <span className="label">Edifícios e UT</span>
            <button
              className="btn-icon h-6 w-6"
              title="Adicionar edifício"
              onClick={() => {
                const e = novoEdificio(p.edificios.length + 1);
                up((pp) => { pp.edificios.push(e); });
                go(`${base}/e/${e.id}`);
              }}
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="flex flex-col pb-3">
            {p.edificios.map((e) => (
              <div key={e.id} className="mb-1">
                <a href={`#${base}/e/${e.id}`} className={`flex h-9 items-center gap-2 border-l-2 px-3 text-[13px] font-semibold ${mE?.eid === e.id && !mU ? 'border-fire bg-white' : 'border-transparent hover:bg-white/60'}`}>
                  <Building2 size={15} className="shrink-0" />
                  <span className="truncate">{e.nome}</span>
                </a>
                {e.uts.map((u) => {
                  const c = classificar(u).cat;
                  const act = mU?.uid === u.id;
                  return (
                    <a key={u.id} href={`#${base}/e/${e.id}/u/${u.id}/fatores`} className={`ml-[22px] flex h-8 items-center gap-2 border-l px-3 text-[12.5px] ${act ? 'border-fire bg-white font-semibold text-ink' : 'border-ink-4/40 text-ink-2 hover:bg-white/60'}`}>
                      <span className={`h-2 w-2 shrink-0 ${CAT_COR[c]}`} />
                      <span className="w-9 shrink-0 font-mono text-[11px]">{ROMANO[u.tipo]}</span>
                      {(() => {
                        const n = nomeUT(u);
                        return <span className={`truncate ${n.temNome ? '' : 'italic text-ink-4'}`} title={n.nome}>{n.nome}</span>;
                      })()}
                      {act && <ChevronRight size={13} className="ml-auto shrink-0 text-fire" />}
                    </a>
                  );
                })}
                <button onClick={() => setEscolher(e.id)} className="ml-[22px] flex h-8 items-center gap-1.5 border-l border-ink-4/40 px-3 text-[12px] font-medium text-ink-3 hover:text-fire">
                  <Plus size={13} /> Adicionar utilização-tipo
                </button>
              </div>
            ))}
          </div>
          <nav className="mt-auto flex flex-col border-t border-ink-4/40 py-2">
            <NavItem to="/plantas" icon={<Image size={15} />} active={rel === '/plantas'}>Peças desenhadas</NavItem>
            <NavItem to="/autoprotecao" icon={<ShieldCheck size={15} />} active={rel === '/autoprotecao'}>Autoproteção</NavItem>
            <NavItem to="/map" icon={<FileText size={15} />} active={rel === '/map'}>Documento MAP</NavItem>
            <NavItem to="/relatorio" icon={<FileText size={15} />} active={isReport}>Relatório</NavItem>
            <button onClick={() => exportarJSON(p)} className="flex h-9 items-center gap-2.5 px-3.5 text-[13px] font-semibold text-ink-2 hover:bg-white/60">
              <Download size={15} /> Exportar projeto (JSON)
            </button>
          </nav>
    </>
  );

  return (
    <PCtx.Provider value={{ p, up, pedirUT: setEscolher }}>
      <div className="flex">
        <aside className="no-print sticky top-14 hidden h-[calc(100vh-56px)] w-[272px] shrink-0 flex-col overflow-y-auto border-r border-ink bg-paper-2 lg:flex">
          {menu}
        </aside>
        {menuAberto && (
          <div className="no-print fixed inset-0 z-50 flex lg:hidden" onClick={() => setMenuAberto(false)}>
            <div className="flex h-full w-[86vw] max-w-[320px] flex-col overflow-y-auto border-r border-ink bg-paper-2 shadow-[8px_0_0_rgba(15,15,14,0.15)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-ink-4/40 px-3 py-2">
                <span className="label">Menu do projeto</span>
                <button className="btn-icon" onClick={() => setMenuAberto(false)}><X size={18} /></button>
              </div>
              {menu}
            </div>
            <div className="flex-1 bg-ink/50" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="no-print sticky top-14 z-30 flex h-12 items-center gap-3 border-b border-ink bg-paper-2 px-3 lg:hidden">
            <button className="btn h-9 px-3" onClick={() => setMenuAberto(true)}><Menu size={16} /> Menu</button>
            <span className="truncate font-display text-[14px] font-bold">{p.nome}</span>
          </div>
          {page}
        </div>
      </div>
      {escolher && <EscolherUT onClose={() => setEscolher(null)} onPick={(t, n) => adicionarUT(escolher, t, n)} />}
    </PCtx.Provider>
  );
}
