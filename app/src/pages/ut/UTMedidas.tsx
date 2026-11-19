import { useMemo, useState } from 'react';
import type { UTProps } from '../UTPage';
import { contexto, gerarMedidas, resumoMedidas, TEMAS, type Estado, type Medida } from '../../engine/medidas';
import { Note } from '../../ui/primitives';

const ESTADO: Record<Estado, { l: string; c: string }> = {
  aplica: { l: 'Aplicável', c: 'bg-ink text-white' },
  verificar: { l: 'Verificar', c: 'bg-warn text-white' },
  nao: { l: 'Não aplicável', c: 'bg-paper-3 text-ink-3' },
};

export default function UTMedidas({ ed, ut }: UTProps) {
  const M = useMemo(() => gerarMedidas(contexto(ed, ut)), [ed, ut]);
  const r = resumoMedidas(M);
  const [filtro, setFiltro] = useState<'todas' | Estado>('aplica');
  const [q, setQ] = useState('');
  const list = M.filter((m) => (filtro === 'todas' || m.estado === filtro) && (!q || (m.titulo + m.exigencia + m.base).toLowerCase().includes(q.toLowerCase())));
  const porTema = TEMAS.map((t) => ({ t, m: list.filter((x) => x.tema === t) })).filter((g) => g.m.length);

  return (
    <div>
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
        {porTema.map((g, gi) => (
          <section key={g.t}>
            <h3 className="mb-2 flex items-baseline gap-3 border-b-2 border-ink pb-1.5">
              <span className="font-mono text-[11px] font-semibold text-fire">{String(gi + 1).padStart(2, '0')}</span>
              <span className="font-display text-[18px] font-bold">{g.t}</span>
              <span className="ref">{g.m.length}</span>
            </h3>
            <div className="border-x border-ink bg-white">
              {g.m.map((m) => <Linha key={m.id} m={m} />)}
            </div>
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
