import Rodape from '../ui/Rodape';
import { useRef, useState } from 'react';
import { ArrowUpRight, Calculator, Copy, Download, FireExtinguisher, Flame, ScanLine, Signpost, Trash2, Upload, Wrench } from 'lucide-react';
import LerQR from '../ui/LerQR';
import { PesquisaExt } from './FichaExt';
import { lerUrlExt } from '../engine/manutencao';
import { resumoManut } from '../engine/manutencao';
import { exportarJSON } from './ProjetoShell';
import { useStore } from '../store';
import { go } from '../router';
import { classificar } from '../engine/calc';
import { CatBadge, Empty, ExtBadge } from '../ui/primitives';
import { ROMANO } from '../data/rjscie';
import type { Projeto } from '../data/types';
import { exemploProjeto } from '../exemplo';

export default function Home() {
  const { projetos: todos, criar, apagar, duplicar, importar, abrirExemplo } = useStore();
  const projetos = todos.filter((p) => !p.exemplo);
  const fileRef = useRef<HTMLInputElement>(null);
  const [extMenu, setExtMenu] = useState(false);
  const [qr, setQr] = useState(false);
  const todosExt = projetos.flatMap((p) => (p.manutencao?.extintores ?? []).map((e) => ({ e, p })));
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
      alert('Ficheiro inválido: não é um projeto Cautela SCIE exportado em JSON.');
    }
  };

  return (
    <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-6">
        <h1 className="h-display text-[44px]">
          Classificar. Calcular. <span className="text-fire">Cumprir.</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-fire h-10 px-4" onClick={() => go(`/p/${criar()}`)}><Flame size={16} /> Novo projeto SCIE</button>
          <div className="relative">
            <button className={`btn h-10 px-4 ${extMenu ? '!bg-ink !text-white' : ''}`} aria-expanded={extMenu} onClick={() => setExtMenu(!extMenu)}><FireExtinguisher size={16} /> Extintores</button>
            {extMenu && <button aria-label="Fechar" className="fixed inset-0 z-30 cursor-default" onClick={() => setExtMenu(false)} />}
            {extMenu && (
              <div className="absolute left-0 top-full z-40 mt-1 w-[min(330px,calc(100vw-48px))] border border-ink bg-white shadow-[6px_6px_0_rgba(20,35,58,0.12)]">
                <p className="border-b border-paper-3 px-4 py-2 text-[12px] font-semibold text-ink-3">O que vai fazer?</p>
                <button className="flex w-full items-start gap-3 border-b border-paper-3 px-4 py-3 text-left hover:bg-paper" onClick={() => go(`/p/${criar('extintores')}`)}>
                  <Calculator size={17} className="mt-0.5 shrink-0 text-fire-ink" />
                  <span><span className="block text-[13.5px] font-semibold">Dimensionamento</span><span className="block text-[12px] text-ink-3">Calcular os extintores exigidos (RT-SCIE, art. 163.º). Inclui também o plano de manutenção.</span></span>
                </button>
                <button className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-paper" onClick={() => go(`/p/${criar('manutencao')}`)}>
                  <Wrench size={17} className="mt-0.5 shrink-0 text-fire-ink" />
                  <span><span className="block text-[13.5px] font-semibold">Plano de manutenção</span><span className="block text-[12px] text-ink-3">Extintores já instalados: listagem por edifício e piso, registo das manutenções e próximas datas.</span></span>
                </button>
              </div>
            )}
          </div>
          <button className="btn h-10 px-4" title="Estudo de sinalética de segurança (RT-SCIE, arts. 108.º a 112.º)" onClick={() => go(`/p/${criar('sinaletica')}`)}><Signpost size={16} /> Sinalética</button>
          {todosExt.length > 0 && <button className="btn h-10 px-3" onClick={() => setQr(true)}><ScanLine size={16} /> Ler QR</button>}
          <button className="btn h-10 px-3" onClick={() => fileRef.current?.click()}><Upload size={15} /> Importar (JSON)</button>
          {projetos.length > 0 && (
            <button className="btn h-10 px-3" onClick={() => {
                const blob = new Blob([JSON.stringify(projetos, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `scie-calc-copia-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}><Download size={15} /> Exportar todos (JSON)</button>
          )}
          <button className="btn h-10 px-3" onClick={() => go(`/p/${abrirExemplo(exemploProjeto())}`)}>Abrir exemplo</button>
          {qr && (
            <LerQR onLido={(t) => { setQr(false); const u = lerUrlExt(t); if (u) go(`/x/${u.pid}/${u.eid}`); else alert('Este QR não é de um extintor da Cautela.'); }} onFechar={() => setQr(false)}>
              <PesquisaExt lista={todosExt.map((x) => x.e)} abrir={(e) => { const x = todosExt.find((z) => z.e.id === e.id)!; setQr(false); go(`/p/${x.p.id}/ext/${e.id}`); }}
                sub={(e) => { const x = todosExt.find((z) => z.e.id === e.id)!; return `${x.p.nome} · ${x.p.edificios.find((z) => z.id === e.edificio)?.nome ?? ''} · ${e.local || '—'}`; }} />
            </LerQR>
          )}
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </div>
      </div>

      <a href="#/empresa" className="mb-10 flex flex-wrap items-center justify-between gap-4 border border-ink bg-white p-4 hover:bg-paper">
        <div className="flex min-w-0 flex-1 basis-[260px] items-center gap-4">
          {empresa?.logo ? <img src={empresa.logo} className="h-16 w-16 border border-paper-3 object-contain shrink-0" /> : <div className="grid h-16 w-16 shrink-0 place-items-center border border-dashed border-ink-4 text-[10px] text-ink-4">logo</div>}
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <p className="label">A minha empresa · aplicada a todos os projetos</p>
            <p className="font-display text-[18px] font-bold">{empresa?.nome || 'Defina os dados da sua empresa e do autor'}</p>
            <p className="text-[12.5px] text-ink-3">{[autor?.nome, autor?.qualificacao, empresa?.email].filter(Boolean).join(' · ') || 'Logótipo, contactos, apresentação e autor técnico'}</p>
          </div>
        </div>
        <span className="btn ml-auto shrink-0">Editar</span>
      </a>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="section-title">Projetos <span className="font-mono text-[14px] text-ink-3">({projetos.length})</span></h2>
      </div>

      {projetos.length === 0 ? (
        <Empty title="Ainda não existem projetos.">
          Crie um projeto novo ou abra o exemplo para ver o fluxo completo: projeto → edifícios → utilizações-tipo → cálculos → medidas → relatório.
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => {
            const uts = p.edificios.flatMap((e) => e.uts);
            const cls = uts.map((u) => classificar(u));
            const completas = cls.length > 0 && cls.every((c) => !c.falta.length);
            const max = completas ? (Math.max(...cls.map((c) => c.cat)) as 1 | 2 | 3 | 4) : null;
            return (
              <article key={p.id} className="group flex min-h-[210px] flex-col justify-between border border-ink bg-white p-5 transition-colors hover:bg-paper">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="ref">{p.referencia || 'S/ referência'} · v{p.versao}</span>
                    {p.modo === 'sinaletica' ? <ExtBadge size="sm" texto="SINALÉTICA" icone={<Signpost size={13} strokeWidth={2} />} /> : p.modo === 'manutencao' ? <ExtBadge size="sm" texto="MANUTENÇÃO" /> : p.modo === 'extintores' ? <ExtBadge size="sm" /> : <span className="flex items-center gap-1.5" title="Projeto SCIE completo"><Flame size={17} strokeWidth={2} className="text-fire-ink" />{uts.length > 0 && <CatBadge cat={max} size="sm" />}</span>}
                  </div>
                  <button onClick={() => go(`/p/${p.id}`)} className="flex w-full items-center gap-3.5 text-left">
                    {/* logótipo do cliente (Dados do projeto); sem logótipo: iniciais do cliente/projeto */}
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden border border-paper-3 bg-white">
                      {p.clienteLogo
                        ? <img src={p.clienteLogo} alt="" className="h-full w-full object-contain p-1.5" />
                        : <span className="font-display text-[17px] font-extrabold tracking-tight text-ink-4">{iniciais(p.cliente || p.nome)}</span>}
                    </span>
                    <span className="min-w-0">
                      <h3 className="font-display text-[21px] font-bold leading-tight tracking-tight group-hover:text-fire-ink">{p.nome}</h3>
                      <p className="mt-1 text-[12.5px] text-ink-3">{[p.cliente, p.concelho].filter(Boolean).join(' · ') || '—'}</p>
                    </span>
                  </button>
                  {p.modo === 'manutencao' && (() => {
                    const r = resumoManut(p.manutencao);
                    return (
                      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                        <span className="text-ink-3">{r.total} {r.total === 1 ? 'extintor' : 'extintores'}</span>
                        {r.atraso > 0 && <span className="font-semibold text-alerta">{r.atraso} em atraso</span>}
                        {r.breve > 0 && <span className="font-semibold text-ink">{r.breve} nos próximos 60 dias</span>}
                        {r.sem > 0 && <span className="text-ink-3">{r.sem} sem registo</span>}
                      </p>
                    );
                  })()}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {uts.map((u) => (
                      <span key={u.id} className="chip border-ink-4 font-mono text-ink-2">UT {ROMANO[u.tipo]}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-paper-3 pt-3">
                  <span className="font-mono text-[10.5px] text-ink-4">
                    {p.edificios.length} edif. · {p.modo === 'manutencao' ? `${p.manutencao?.extintores.length ?? 0} ext.` : p.modo === 'sinaletica' ? `${p.sinaletica?.pisos.length ?? 0} pisos` : `${uts.length} UT`} · {new Date(p.atualizadoEm).toLocaleDateString('pt-PT')}
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
      <Rodape />
    </main>
  );
}

function iniciais(t: string) {
  const w = t.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter((x) => x.length > 2 || /^\d+$/.test(x));
  return (w.length ? w : t.split(/\s+/)).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? '').join('') || '—';
}
