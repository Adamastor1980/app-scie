import { useMemo, useState } from 'react';
import type { UTProps } from '../UTPage';
import { contexto, gerarMedidas, resumoMedidas, GRUPOS, SECOES, secRotulo, type Estado, type Medida } from '../../engine/medidas';
import { Note } from '../../ui/primitives';
import type { Conformidade, UT, Verificacao } from '../../data/types';
import { opcoesPrazo, progresso, verDe } from '../../engine/verificacao';
import UTComplementares from './UTComplementares';
import UTEfetivo from './UTEfetivo';

const ESTADO: Record<Estado, { l: string; c: string }> = {
  aplica: { l: 'Aplicável', c: 'bg-ink text-white' },
  verificar: { l: 'Verificar', c: 'bg-warn text-white' },
  nao: { l: 'Não aplicável', c: 'bg-paper-3 text-ink-3' },
};

export default function UTMedidas({ ed, ut, upU }: UTProps) {
  const M = useMemo(() => gerarMedidas(contexto(ed, ut)), [ed, ut]);
  const r = resumoMedidas(M);
  const [filtro, setFiltro] = useState<'todas' | Estado>('aplica');
  const [q, setQ] = useState('');
  const list = M.filter((m) => (filtro === 'todas' || m.estado === filtro) && (!q || (m.titulo + m.exigencia + m.base).toLowerCase().includes(q.toLowerCase())));
  const porTema = GRUPOS.map((g) => ({ t: g, secs: SECOES.filter((x) => x.g === g).map((x) => ({ x, m: list.filter((y) => y.tema === x.c) })).filter((z) => z.m.length) })).filter((g) => g.secs.length);

  return (
    <div>
      <details className="mb-8 border border-ink bg-white">
        <summary className="cursor-pointer select-none px-5 py-4 font-display text-[16px] font-bold">Dados para concretizar as medidas e a memória descritiva <span className="ml-2 font-sans text-[12px] font-normal text-ink-3">(opcional — não entram na categoria de risco)</span></summary>
        <div className="border-t border-ink px-5 pt-6"><UTComplementares ed={ed} ut={ut} upU={upU} /></div>
      </details>
      {ut.tipo === 12 && (
        <details className="mb-8 border border-ink bg-white">
          <summary className="cursor-pointer select-none px-5 py-4 font-display text-[16px] font-bold">Espaços e locais de risco <span className="ml-2 font-sans text-[12px] font-normal text-ink-3">(opcional — não entram na categoria da UT XII; concretizam isolamento, reação ao fogo e evacuação)</span></summary>
          <div className="border-t border-ink px-5 pt-6"><UTEfetivo ed={ed} ut={ut} upU={upU} /></div>
        </details>
      )}
      <div className="mb-6 grid gap-px border border-ink bg-ink md:grid-cols-4">
        {([['todas', M.length, 'Total'], ['aplica', r.aplica, 'Aplicáveis'], ['verificar', r.verificar, 'A verificar no projeto'], ['nao', r.nao, 'Não aplicáveis (com motivo)']] as const).map(([k, n, l]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`flex items-baseline justify-between p-4 text-left ${filtro === k ? 'bg-ink text-white' : 'bg-white hover:bg-paper'}`}>
            <span className="text-[12.5px] font-semibold">{l}</span>
            <span className="font-display text-[30px] font-extrabold num">{n}</span>
          </button>
        ))}
      </div>
      {(() => {
        const pg = progresso(ut, M);
        return (
          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border border-ink bg-white px-5 py-3 text-[12.5px]">
            <span className="label">Verificação no local</span>
            <span><b className="num">{pg.marcadas}</b> de <b className="num">{pg.total}</b> exigências verificadas</span>
            <span className="text-ok">Cumpre <b className="num">{pg.cumpre}</b></span>
            <span className="text-fire">Não cumpre <b className="num">{pg.naoCumpre}</b></span>
            <span className="text-ink-3">N.A. <b className="num">{pg.na}</b></span>
            <span className="ml-auto text-[11.5px] text-ink-3">As desconformidades e as medidas corretivas entram na «Análise regulamentar» do relatório.</span>
          </div>
        );
      })()}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input className="input max-w-sm" placeholder="Pesquisar nas medidas…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex-1"><Note>Exigências do RJ-SCIE e do RT-SCIE concretizadas para esta UT, com a categoria, a altura do edifício e os locais de risco registados. As marcadas «verificar» dependem de elementos do projeto que a app não recolhe.</Note></div>
      </div>
      <div className="flex flex-col gap-8">
        {porTema.map((g) => (
          <section key={g.t}>
            <h3 className="mb-2 flex items-baseline gap-3 border-b-2 border-ink pb-1.5">
              <span className="font-display text-[18px] font-bold">{g.t}</span>
              <span className="ref">{g.secs.reduce((n, z) => n + z.m.length, 0)}</span>
            </h3>
            {g.secs.map(({ x, m }) => (
              <div key={x.c} className="mb-3">
                {x.c !== '0' && x.c !== 'MAP' && x.c !== 'ESP' && <p className="mb-1 mt-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-fire">{secRotulo(x.c)}</p>}
                <div className="border-x border-t border-ink bg-white">
                  {m.map((y) => <Linha key={y.id} m={y} ut={ut} setV={(fn) => upU((u) => { u.verificacao = u.verificacao ?? {}; const v = { ...(u.verificacao[y.key] ?? {}) }; fn(v); u.verificacao[y.key] = v; })} />)}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

const CONF: { v: Conformidade; l: string; on: string }[] = [
  { v: 'cumpre', l: 'Cumpre', on: 'bg-ok text-white border-ok' },
  { v: 'nao_cumpre', l: 'Não cumpre', on: 'bg-fire text-white border-fire' },
  { v: 'na', l: 'N.A.', on: 'bg-ink-3 text-white border-ink-3' },
];
const PRAZOS = opcoesPrazo();

function Linha({ m, ut, setV }: { m: Medida; ut: UT; setV: (fn: (v: Verificacao) => void) => void }) {
  const e = ESTADO[m.estado];
  const v = verDe(ut, m);
  return (
    <div className={`border-b border-ink px-4 py-3 ${m.estado === 'nao' ? 'bg-paper/50' : v.estado === 'nao_cumpre' ? 'bg-fire-soft/40' : ''}`}>
      <div className="grid gap-3 md:grid-cols-[230px_1fr_200px]">
        <div>
          <span className={`chip mb-1.5 border-0 ${e.c}`}>{e.l}</span>
          <p className={`text-[13px] font-semibold leading-snug ${m.estado === 'nao' ? 'text-ink-3' : ''}`}>{m.titulo}</p>
        </div>
        <div className={`text-[13px] leading-relaxed ${m.estado === 'nao' ? 'text-ink-3' : ''}`}>
          {m.exigencia}
          {m.motivo && <p className="mt-1 text-[12px] italic text-ink-3">{m.motivo}</p>}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <p className="ref leading-snug md:text-right">{m.base}</p>
          {m.estado !== 'nao' && (
            <div className="flex">
              {CONF.map((c) => (
                <button key={c.v} onClick={() => setV((x) => { x.estado = x.estado === c.v ? undefined : c.v; })}
                  className={`-ml-px h-7 border px-2 text-[11px] font-semibold first:ml-0 ${v.estado === c.v ? c.on : 'border-paper-3 bg-white text-ink-3 hover:border-ink hover:text-ink'}`}>{c.l}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {v.estado === 'nao_cumpre' && (
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.3fr_170px]">
          <input className="input" placeholder="Desconformidade observada (o que foi verificado no local)" value={v.obs ?? ''} onChange={(ev) => setV((x) => { x.obs = ev.target.value; })} />
          <input className="input" placeholder="Medida corretiva / compensatória proposta" value={v.corretiva ?? ''} onChange={(ev) => setV((x) => { x.corretiva = ev.target.value; })} />
          <select className="input" value={v.prazo ?? ''} onChange={(ev) => setV((x) => { x.prazo = ev.target.value || undefined; })}>
            <option value="">Prazo…</option>
            {PRAZOS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      )}
      {v.estado === 'na' && (
        <input className="input mt-3" placeholder="Motivo da não aplicabilidade no local (ex.: não existem elevadores)" value={v.obs ?? ''} onChange={(ev) => setV((x) => { x.obs = ev.target.value; })} />
      )}
    </div>
  );
}
