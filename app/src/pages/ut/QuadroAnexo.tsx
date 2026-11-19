import type { Classificacao } from '../../engine/calc';
import { CAT_COR } from '../../ui/primitives';

/** Desenha o quadro do anexo III com o valor de cada fator e a célula em que cai */
export default function QuadroAnexo({ c, titulo, mostrarValores = true }: { c: Classificacao; titulo?: string; mostrarValores?: boolean }) {
  return (
    <div className="avoid-break border border-ink bg-white">
      {titulo && <div className="border-b border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white">{titulo}</div>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className="w-[110px] border-b border-r border-ink bg-paper px-3 py-2 text-left label">Categoria</th>
              {c.fatores.map((f) => (
                <th key={f.id} className="border-b border-r border-ink bg-paper px-3 py-2 text-left align-bottom text-[11.5px] font-semibold leading-tight last:border-r-0">{f.rotulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((k) => (
              <tr key={k}>
                <td className={`border-b border-r border-ink px-3 py-2 font-mono font-semibold ${c.cat === k ? `${CAT_COR[k as 1]} text-white` : ''}`}>{k}.ª</td>
                {c.fatores.map((f) => {
                  const hit = f.cat === k;
                  return (
                    <td key={f.id} className={`border-b border-r border-paper-3 px-3 py-2 font-mono last:border-r-0 ${hit ? 'bg-fire-soft font-semibold text-ink outline outline-2 -outline-offset-2 outline-fire' : 'text-ink-2'}`}>
                      {f.limites[k - 1] ?? '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            {mostrarValores && (
              <tr>
                <td className="border-r border-ink bg-ink px-3 py-2 font-mono text-[11px] uppercase text-white">Valor</td>
                {c.fatores.map((f) => (
                  <td key={f.id} className="border-r border-ink-2 bg-ink px-3 py-2 font-mono font-semibold text-white last:border-r-0">
                    {typeof f.valor === 'number' ? f.valor.toLocaleString('pt-PT') : f.valor}{typeof f.valor === 'number' && f.unidade ? ` ${f.unidade}` : ''}
                    <span className="ml-2 text-fire">→ {f.cat}.ª</span>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
