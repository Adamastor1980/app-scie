import { CheckCircle2, Circle, MinusCircle, ArrowRight, BookOpen } from 'lucide-react';
import { useState } from 'react';
import type { Projeto } from '../data/types';
import { PASSOS, estadoPercurso } from '../engine/percurso';
import TextoLei, { refsDeBase } from '../ui/TextoLei';
import { go } from '../router';

/** Guia das MAP dentro do projeto: os 10 passos com o estado calculado e o caminho para cada um. */
export function PercursoProjeto({ p, atualizar }: { p: Projeto; atualizar: (fn: (p: Projeto) => void) => void }) {
  const est = estadoPercurso(p);
  const feitos = PASSOS.filter((x) => est[x.n].estado !== 'falta').length;
  const [lei, setLei] = useState<string | null>(null);
  const marca = (k: 'entregue' | 'submetido', v: string) => atualizar((q) => { q.percurso = { ...(q.percurso ?? {}), [k]: v || undefined }; });
  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title">Percurso das medidas de autoproteção</h2>
        <span className="text-[12.5px] text-ink-3"><b className="num text-ink">{feitos}</b> de 10 passos concluídos</span>
      </div>
      <ol className="border border-ink bg-white">
        {PASSOS.map((x) => {
          const e = est[x.n];
          const destino = e.ir ?? x.ir;
          return (
            <li key={x.n} className="flex flex-wrap items-start gap-3 border-b border-paper-3 px-4 py-3 last:border-0">
              <span className="mt-0.5">{e.estado === 'feito' ? <CheckCircle2 size={18} className="text-ok" /> : e.estado === 'na' ? <MinusCircle size={18} className="text-ink-4" /> : <Circle size={18} className="text-ink-4" />}</span>
              <div className="min-w-[220px] flex-1">
                <p className="text-[13.5px] font-semibold"><span className="mr-1.5 font-mono text-fire-ink">{x.n}.</span>{x.titulo}</p>
                <p className={`text-[12px] ${e.estado === 'falta' ? 'text-alerta' : 'text-ink-3'}`}>{e.nota}</p>
                {x.n === 9 && <label className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-3">Data de entrega <input type="date" className="input h-8 w-auto py-0" value={p.percurso?.entregue ?? ''} onChange={(ev) => marca('entregue', ev.target.value)} /></label>}
                {x.n === 10 && e.estado !== 'na' && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                    <label className="flex items-center gap-2">Data de submissão <input type="date" className="input h-8 w-auto py-0" value={p.percurso?.submetido ?? ''} onChange={(ev) => marca('submetido', ev.target.value)} /></label>
                    <input className="input h-8 w-48 py-0" placeholder="N.º do processo" value={p.percurso?.refSubmissao ?? ''} onChange={(ev) => atualizar((q) => { q.percurso = { ...(q.percurso ?? {}), refSubmissao: ev.target.value || undefined }; })} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-[11.5px] font-semibold text-fire-ink hover:underline" onClick={() => setLei(x.base)} title={x.base}><BookOpen size={12} /> Lei</button>
                {destino !== undefined && x.n !== 9 && x.n !== 10 && <button className="btn h-8 px-3 text-[12px]" onClick={() => go(`/p/${p.id}${destino}`)}>Abrir <ArrowRight size={13} /></button>}
              </div>
            </li>
          );
        })}
      </ol>
      {lei && <TextoLei refs={refsDeBase(lei)} titulo={lei} onFechar={() => setLei(null)} />}
    </section>
  );
}

/** Versão de consulta para as Tabelas legais. */
export function PercursoEstatico() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-ink-2">Sequência de trabalho para a elaboração das medidas de autoproteção. Em cada projeto, o painel mostra o estado de cada passo e o caminho para o fazer.</p>
      <ol className="border border-ink bg-white">
        {PASSOS.map((x) => (
          <li key={x.n} className="border-b border-paper-3 px-4 py-3 last:border-0">
            <p className="text-[13.5px] font-semibold"><span className="mr-1.5 font-mono text-fire-ink">{x.n}.</span>{x.titulo}</p>
            <p className="mt-0.5 text-[12.5px] text-ink-2">{x.oQue}</p>
            <p className="ref mt-1">{x.base}</p>
          </li>
        ))}
      </ol>
      <p className="text-[12px] text-ink-3">As medidas exigíveis (passo 5) dependem apenas da UT, da categoria e dos locais de risco D ou E, por isso vêm antes da verificação no local (passo 6); as insuficiências encontradas no passo 6 entram nas MAP como medidas compensatórias (RT-SCIE, art. 193.º n.os 3 e 4).</p>
    </div>
  );
}
