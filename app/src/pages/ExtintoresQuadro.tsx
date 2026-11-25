import type { Cat, UT } from '../data/types';
import { CONVERSAO, NOME_AGENTE, UNIDADE, dimensionarExtintores } from '../engine/extintores';
import { fmt } from '../engine/calc';

/** Quadro de dimensionamento de extintores de uma UT — o mesmo no relatório e no estudo de extintores. */
export function QuadroExtintores({ ut, cat }: { ut: UT; cat: Cat }) {
  const r = dimensionarExtintores(ut, cat);
  const temPo = r.pisos.some((p) => p.agente === 'po');
  return (
    <div className="mb-4">
      {!r.geral && <p className="mb-2 text-[11.5px] text-ink-2">{r.motivo}</p>}
      {r.geral && r.pisos.length > 0 && (
        <table className="tbl mb-2">
          <thead><tr><th>Piso</th><th className="text-right">Área (m²)</th><th className="text-right">Mín. (b)</th><th className="text-right">Água (a)</th><th>Extintores previstos</th><th className="text-right">Equivalente</th><th className="w-14 text-center">Cumpre</th></tr></thead>
          <tbody>
            {r.pisos.map((p) => (
              <tr key={p.n}>
                <td>{p.nome}</td>
                <td className="num text-right">{p.area > 0 ? fmt(p.area, 2) : '—'}</td>
                <td className="num text-right">{p.area > 0 ? p.minN : '—'}</td>
                <td className="num text-right">{p.area > 0 ? `${p.litros} L` : '—'}</td>
                <td>{p.area > 0 ? `${p.qtd} × ${NOME_AGENTE[p.agente]} ${p.cap} ${UNIDADE[p.agente]}` : 'área por indicar'}</td>
                <td className="num text-right">{p.area > 0 ? `${fmt(p.totalL)} L` : '—'}</td>
                <td className={`text-center font-bold ${p.cumpre ? 'text-ok' : 'text-alerta'}`}>{p.area > 0 ? (p.cumpre ? 'Sim' : 'Não') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {r.extras.length > 0 && (
        <table className="tbl mb-2"><tbody>
          {r.extras.map((e, i) => <tr key={i}><td className="text-[11.5px]">{e.texto}</td><td className="w-[30%] text-[10px] text-ink-3">{e.base}</td></tr>)}
        </tbody></table>
      )}
      {r.co2.length > 0 && <p className="mb-1 text-[11px] text-ink-2">Complemento (não conta para a alínea a)): {r.co2.map((k) => `${k.qtd} × CO₂ ${fmt(k.kg, 1)} kg — ${k.local || 'local por indicar'}`).join('; ')}.</p>}
      {(temPo || r.co2.length > 0) && <p className="text-[10.5px] text-ink-3">{[temPo && CONVERSAO.po.texto, r.co2.length > 0 && CONVERSAO.co2.texto].filter(Boolean).join('. ')} — {CONVERSAO.fonte}.</p>}
    </div>
  );
}
