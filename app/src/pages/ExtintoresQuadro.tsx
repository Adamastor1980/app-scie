import { Fragment } from 'react';
import type { Cat, UT } from '../data/types';
import { CONVERSAO, NOTA_RECOM, NOME_AGENTE, UNIDADE, dimensionarExtintores, type LinhaMapa } from '../engine/extintores';
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
      {(temPo || r.co2.length > 0) && <p className="text-[10.5px] text-ink-3">{[temPo && CONVERSAO.po.texto, r.co2.length > 0 && CONVERSAO.co2.texto].filter(Boolean).join('. ')} — {CONVERSAO.fonte}.</p>}
    </div>
  );
}

/** Mapa final de extintores — o quê, onde e quantos (todas as UT). Exigido por lei e recomendação técnica sempre separados. */
export function MapaExtintores({ linhas }: { linhas: { ut: string; l: LinhaMapa }[] }) {
  if (!linhas.length) return null;
  const temRecom = linhas.some((x) => x.l.recom);
  const grupos = [...new Set(linhas.map((x) => x.ut))];
  const cols = temRecom ? 5 : 4;
  return (
    <div>
      <table className="tbl mb-2">
        <thead><tr><th className="w-[30%]">Onde</th><th className="w-[24%]">O quê</th><th className="w-[9%] text-right">Qtd.</th><th>Exigido por lei</th>{temRecom && <th className="w-[15%]">Recomendação técnica</th>}</tr></thead>
        <tbody>
          {grupos.map((g) => (
            <Fragment key={g}>
              {<tr><td colSpan={cols} className="bg-paper font-display text-[11.5px] font-bold">{g}</td></tr>}
              {linhas.filter((x) => x.ut === g).map(({ l }, i) => (
                <tr key={i} className="avoid-break">
                  <td className="text-[11px]">{l.onde}</td>
                  <td className="text-[11.5px] font-semibold">{l.oque}</td>
                  <td className="num text-right text-[11.5px] font-bold">{l.qtd}</td>
                  <td className="text-[10.5px]">{l.lei}<span className="ref block">{l.base}</span></td>
                  {temRecom && <td className="text-[10.5px] italic text-ink-2">{l.recom ?? '—'}</td>}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      {temRecom && <p className="text-[10.5px] text-ink-3">{NOTA_RECOM}</p>}
    </div>
  );
}
