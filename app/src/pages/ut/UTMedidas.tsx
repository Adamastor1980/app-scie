import { useMemo, useState } from 'react';
import type { UTProps } from '../UTPage';
import { contexto, gerarMedidas, resumoMedidas, GRUPOS, SECOES, secRotulo, type Estado, type Medida } from '../../engine/medidas';
import { Note } from '../../ui/primitives';
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
                  {m.map((y) => <Linha key={y.id} m={y} />)}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function Linha({ m }: { m: Medida }) {
  const e = ESTADO[m.estado];
  return (
    <div className={`grid gap-3 border-b border-ink px-4 py-3 md:grid-cols-[230px_1fr_200px] ${m.estado === 'nao' ? 'bg-paper/50' : ''}`}>
      <div>
        <span className={`chip mb-1.5 border-0 ${e.c}`}>{e.l}</span>
        <p className={`text-[13px] font-semibold leading-snug ${m.estado === 'nao' ? 'text-ink-3' : ''}`}>{m.titulo}</p>
      </div>
      <div className={`text-[13px] leading-relaxed ${m.estado === 'nao' ? 'text-ink-3' : ''}`}>
        {m.exigencia}
        {m.motivo && <p className="mt-1 text-[12px] italic text-ink-3">{m.motivo}</p>}
      </div>
      <p className="ref leading-snug md:text-right">{m.base}</p>
    </div>
  );
}
