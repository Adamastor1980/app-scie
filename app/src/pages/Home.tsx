import { useRef } from 'react';
import { ArrowUpRight, Copy, Download, FilePlus2, Trash2, Upload } from 'lucide-react';
import { exportarJSON } from './ProjetoShell';
import { useStore } from '../store';
import { go } from '../router';
import { classificar } from '../engine/calc';
import { CatBadge, Empty } from '../ui/primitives';
import { ROMANO } from '../data/rjscie';
import type { Projeto } from '../data/types';
import { exemploProjeto } from '../exemplo';

export default function Home() {
  const { projetos, criar, apagar, duplicar, importar } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const empresa = useStore((s) => s.empresaPadrao);
  const autor = useStore((s) => s.autorPadrao);

  const onImport = async (f: File) => {
    try {
      const dados = JSON.parse(await f.text()) as Projeto | Projeto[];
      const lista = Array.isArray(dados) ? dados : [dados];
      if (!lista.length || lista.some((p) => !p.edificios)) throw new Error('Ficheiro inválido');
      const ids = lista.map((p) => importar(p));
      if (ids.length === 1) go(`/p/${ids[0]}`);
      else alert(`${ids.length} projetos importados.`);
    } catch {
      alert('Ficheiro inválido: não é um projeto SCIE/CALC exportado em JSON.');
    }
  };

  return (
    <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-10">
      <div className="mb-12 grid gap-8 border-b-2 border-ink pb-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="label mb-4 !text-fire">Segurança contra incêndio em edifícios</p>
          <h1 className="h-display text-[56px] md:text-[76px]">
            Classificar.<br />Calcular.<br /><span className="text-fire">Cumprir.</span>
          </h1>
        </div>
        <div className="flex flex-col justify-end gap-5">
          <p className="text-[14.5px] leading-relaxed text-ink-2">
            Categoria de risco das 12 utilizações-tipo, efetivo, densidade de carga de incêndio modificada (método determinístico e probabilístico), medidas de segurança aplicáveis e relatório técnico, com base exclusiva no RJ-SCIE, no RT-SCIE e no Despacho n.º 2074/2009.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-fire h-11 px-5 text-[14px]" onClick={() => go(`/p/${criar()}`)}>
              <FilePlus2 size={17} /> Novo projeto
            </button>
            <button className="btn h-11 px-4" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Importar projeto (JSON)
            </button>
            <button className="btn h-11 px-4" onClick={() => go(`/p/${importar(exemploProjeto())}`)}>
              Abrir exemplo
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </div>
        </div>
      </div>

      <a href="#/empresa" className="mb-10 flex items-center justify-between gap-4 border border-ink bg-white p-4 hover:bg-paper">
        <div className="flex items-center gap-4">
          {empresa?.logo ? <img src={empresa.logo} className="h-16 w-16 border border-paper-3 object-contain" /> : <div className="grid h-16 w-16 place-items-center border border-dashed border-ink-4 text-[10px] text-ink-4">logo</div>}
          <div>
            <p className="label">A minha empresa · aplicada a todos os projetos</p>
            <p className="font-display text-[18px] font-bold">{empresa?.nome || 'Defina os dados da sua empresa e do autor'}</p>
            <p className="text-[12.5px] text-ink-3">{[autor?.nome, autor?.qualificacao, empresa?.email].filter(Boolean).join(' · ') || 'Logótipo, contactos, apresentação e autor técnico'}</p>
          </div>
        </div>
        <span className="btn">Editar</span>
      </a>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="section-title">Projetos <span className="font-mono text-[14px] text-ink-3">({projetos.length})</span></h2>
        {projetos.length > 0 && (
          <button className="btn" onClick={() => {
            const blob = new Blob([JSON.stringify(projetos, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `scie-calc-copia-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}><Download size={15} /> Exportar todos (cópia de segurança)</button>
        )}
      </div>

      {projetos.length === 0 ? (
        <Empty title="Ainda não existem projetos.">
          Crie um projeto novo ou abra o exemplo para ver o fluxo completo: projeto → edifícios → utilizações-tipo → cálculos → medidas → relatório.
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => {
            const uts = p.edificios.flatMap((e) => e.uts);
            const cats = uts.map((u) => classificar(u).cat);
            const max = cats.length ? (Math.max(...cats) as 1 | 2 | 3 | 4) : null;
            return (
              <article key={p.id} className="group flex min-h-[210px] flex-col justify-between border border-ink bg-white p-5 transition-colors hover:bg-paper">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="ref">{p.referencia || 'S/ referência'} · v{p.versao}</span>
                    {max && <CatBadge cat={max} size="sm" />}
                  </div>
                  <button onClick={() => go(`/p/${p.id}`)} className="text-left">
                    <h3 className="font-display text-[21px] font-bold leading-tight tracking-tight group-hover:text-fire">{p.nome}</h3>
                  </button>
                  <p className="mt-1 text-[12.5px] text-ink-3">{[p.cliente, p.concelho].filter(Boolean).join(' · ') || '—'}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {uts.map((u) => (
                      <span key={u.id} className="chip border-ink-4 font-mono text-ink-2">UT {ROMANO[u.tipo]}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-paper-3 pt-3">
                  <span className="font-mono text-[10.5px] text-ink-4">
                    {p.edificios.length} edif. · {uts.length} UT · {new Date(p.atualizadoEm).toLocaleDateString('pt-PT')}
                  </span>
                  <div className="flex items-center">
                    <button className="btn-icon" title="Exportar este projeto (JSON)" onClick={() => exportarJSON(p)}><Download size={15} /></button>
                    <button className="btn-icon" title="Duplicar" onClick={() => duplicar(p.id)}><Copy size={15} /></button>
                    <button className="btn-icon" title="Apagar" onClick={() => confirm(`Apagar o projeto «${p.nome}»?`) && apagar(p.id)}><Trash2 size={15} /></button>
                    <button className="btn-icon !text-ink" title="Abrir" onClick={() => go(`/p/${p.id}`)}><ArrowUpRight size={17} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
