import { Building2, ChevronRight, Plus } from 'lucide-react';
import { useP } from './ProjetoShell';
import { Faltas, Section } from '../ui/primitives';
import { verificarEdificio, type EstadoReq, type ResReq } from '../engine/verificacaoExt';

export const COR_REQ: Record<EstadoReq, string> = {
  cumpre: 'border-ok bg-ok-soft text-ok', falta: 'border-alerta bg-alerta-soft text-alerta', verificar: 'border-warn bg-warn-soft text-ink', dados: 'border-ink-4 bg-paper text-ink-3',
};
export const NOME_REQ: Record<EstadoReq, string> = { cumpre: 'Cumpre', falta: 'Não cumpre', verificar: 'Verificar', dados: 'Faltam dados' };

/** Plano de manutenção — os extintores existentes cumprem a lei? (RT-SCIE, art. 163.º e condições específicas da UT) */
export default function VerificacaoExt() {
  const { p, up, pedirUT } = useP();
  const pl = p.manutencao!;
  const base = `#/p/${p.id}`;
  const conf = pl.confirmados ?? {};
  const setConf = (k: string, v: boolean) => up((q) => { (q.manutencao!.confirmados ??= {})[k] = v; });

  if (!pl.verificar) return (
    <Section n="03" title="Verificação legal (opcional)" sub="O plano de manutenção não precisa dela. Se o cliente quiser saber se os extintores existentes cumprem a lei, ative-a: a app pergunta o que a lei exige para cada edifício e verifica tudo.">
      <button className="btn h-10 px-4" onClick={() => up((q) => { q.manutencao!.verificar = true; })}>Verificar se os extintores cumprem a lei</button>
    </Section>
  );
  return (
    <Section n="03" title="Os extintores existentes cumprem a lei?" sub="Verificação completa: art. 163.º do RT-SCIE (pisos, locais de risco C e F, cozinhas, centrais térmicas, tendas, distância e instalação) e condições específicas da utilização-tipo.">
      {p.edificios.map((ed) => {
        if (!ed.uts.length) return (
          <div key={ed.id} className="mb-6 border-l-[3px] border-alerta bg-alerta-soft px-4 py-3 text-[13px]">
            <p className="mb-2 flex items-center gap-2 font-semibold"><Building2 size={15} /> {ed.nome}</p>
            <p className="mb-2"><b className="text-alerta">Falta preencher:</b> a utilização-tipo do edifício — a lei exige extintores diferentes conforme a UT, a categoria e os locais de risco (RT-SCIE, art. 163.º e título VIII).</p>
            <button className="btn h-9 px-3 text-[12.5px]" onClick={() => pedirUT(ed.id)}><Plus size={14} /> Indicar a utilização-tipo</button>
          </div>
        );
        const { porUT, res } = verificarEdificio(ed, pl);
        const n = (e: EstadoReq) => res.filter((r) => r.estado === e).length;
        return (
          <div key={ed.id} className="mb-8">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink pb-2">
              <Building2 size={16} /><span className="font-display text-[16px] font-bold">{ed.nome}</span>
              <span className="ml-auto flex flex-wrap gap-1.5 font-mono text-[11px] font-semibold">
                {(['falta', 'verificar', 'dados', 'cumpre'] as EstadoReq[]).filter((e) => n(e)).map((e) => <span key={e} className={`border px-1.5 py-0.5 ${COR_REQ[e]}`}>{n(e)} {NOME_REQ[e].toLowerCase()}</span>)}
              </span>
            </div>
            {porUT.map((u) => (
              <div key={u.utId} className="mb-2 text-[12.5px]">
                <a className="flex items-center gap-1 font-semibold text-fire-ink hover:underline" href={`${base}/e/${ed.id}/u/${u.utId}/extintores`}>{u.ut} — dados para a verificação (áreas, locais de risco, cozinha, central térmica…) <ChevronRight size={14} /></a>
                <p className="text-ink-3">{u.motivo}</p>
                <Faltas itens={u.falta.map((f) => { const [a, b] = f.split(' — '); return [a, b ?? ''] as [string, string]; })} titulo="Falta preencher (no passo Extintores da UT)" />
              </div>
            ))}
            <button className="mb-3 flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-fire-ink hover:underline" onClick={() => pedirUT(ed.id)}><Plus size={13} /> Outra utilização-tipo neste edifício</button>
            <div className="flex flex-col gap-1.5">
              {res.map((r) => <LinhaReq key={r.key} r={r} conf={!!conf[r.key]} setConf={(v) => setConf(r.key, v)} />)}
            </div>
          </div>
        );
      })}
      <button className="mb-3 text-[12px] font-semibold text-ink-3 hover:text-ink hover:underline" onClick={() => confirm('Desativar a verificação legal? Os dados indicados mantêm-se.') && up((q) => { q.manutencao!.verificar = false; })}>Desativar a verificação legal</button>
      <p className="text-[11.5px] leading-relaxed text-ink-3">Os extintores sem «Para que serve» contam para o piso (art. 163.º n.º 2). Os das exigências próprias (cozinha, central térmica, locais C e F…) indicam-se em cada extintor, no campo «Para que serve». Pó: kg × 2 e espuma como água (critério técnico); CO₂ e móveis não contam para o piso.</p>
    </Section>
  );
}

function LinhaReq({ r, conf, setConf }: { r: ResReq; conf: boolean; setConf: (v: boolean) => void }) {
  const pede = r.tipo === 'manual' || r.tipo === 'outro' || (r.tipo === 'item' && r.qtd == null);
  return (
    <div className="border border-paper-3 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <div className="min-w-0 flex-1 basis-[260px] text-[13px]">
          <p className="font-semibold">{r.titulo}</p>
          {r.tipo !== 'piso' && r.tipo !== 'manual' && <p className="text-[12px] text-ink-3">{r.onde}</p>}
          <p className="ref">{r.base}</p>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 font-mono text-[11px] font-semibold ${COR_REQ[r.estado]}`}>{NOME_REQ[r.estado]}</span>
      </div>
      {r.tipo !== 'manual' && r.tipo !== 'outro' && <p className="mt-1 text-[12.5px]">{r.texto}{r.exts.length > 0 && <span className="text-ink-3"> · {r.exts.map((e) => e.num).join(', ')}</span>}</p>}
      {r.problemas.length > 0 && <ul className="mt-1 list-disc pl-5 text-[12px] text-alerta">{r.problemas.map((x, i) => <li key={i}>{x}</li>)}</ul>}
      {pede && (
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12.5px]">
          <input type="checkbox" className="h-4 w-4 accent-[#14233A]" checked={conf} onChange={(e) => setConf(e.target.checked)} />
          {r.tipo === 'outro' ? 'Existe no local' : r.tipo === 'manual' ? 'Confirmado no local ou na planta' : 'Confirmado que chegam'}
        </label>
      )}
    </div>
  );
}
