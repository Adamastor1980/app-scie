import { Fragment } from 'react';
import type { Edificio, UT } from '../data/types';
import { dimensionarRIA } from '../engine/ria';
import { fmt } from '../engine/calc';
import { tituloUT } from '../nome';

/** Quadro da rede de incêndio armada do tipo carretel (todas as UT) — Estudo de extintores e relatório SCIE */
export function QuadroRIA({ uts }: { uts: { ed: Edificio; ut: UT }[] }) {
  const rs = uts.map((x) => ({ ...x, r: dimensionarRIA(x.ut) }));
  const com = rs.filter((x) => x.r.exigida && !x.r.proibida);
  return (
    <div>
      <table className="tbl mb-3">
        <thead><tr><th className="w-[34%]">Utilização-tipo</th><th>Exigência</th></tr></thead>
        <tbody>{rs.map(({ ed, ut, r }) => (
          <tr key={ut.id} className="avoid-break"><td className="text-[11.5px] font-semibold">{ed.nome} · {tituloUT(ut)}</td>
            <td className="text-[11.5px]"><b>{r.exigida === null ? 'Por saber' : r.exigida ? (r.proibida ? 'Não aplicável' : 'Exigida') : 'Não exigida'}</b> — {r.motivo}{r.notas.map((t, i) => <span key={i} className="block text-ink-3">{t}</span>)}</td></tr>
        ))}</tbody>
      </table>
      {com.length > 0 && (
        <table className="tbl mb-3">
          <thead><tr><th>Piso</th><th className="text-right">Mínimo de bocas</th><th>Origem</th></tr></thead>
          <tbody>{com.map(({ ed, ut, r }) => (
            <Fragment key={ut.id}>
              <tr><td colSpan={3} className="bg-paper font-display text-[11.5px] font-bold">{ed.nome} · {tituloUT(ut)}{r.alcance ? <span className="font-sans font-normal text-ink-3"> · mangueira {fmt(r.alcance - 5, 0)} m, alcance {fmt(r.alcance, 0)} m</span> : null}</td></tr>
              {r.pisos.map((p) => (
                <tr key={p.n} className="avoid-break"><td className="text-[11.5px]">{p.nome}</td><td className="num text-right text-[11.5px] font-semibold">{p.minimo}</td>
                  <td className="text-[10.5px] text-ink-2">{[!r.soLocais && p.cobertura ? `cobertura ${fmt(p.area, 0)} m² ÷ ${fmt(r.areaPorBoca, 0)} m² (art. 165.º a))` : '', p.escadas ? `${p.escadas} junto às escadas (art. 165.º c))` : '', p.locais200 ? `${p.locais200} junto a locais > 200 pessoas (art. 165.º d))` : ''].filter(Boolean).join(' · ') || '—'}</td></tr>
              ))}
              <tr className="border-t-2 border-ink"><td className="font-bold">Total (mínimo)</td><td className="num text-right font-bold">{r.total}</td>
                <td className="text-[10.5px]">Caudal {fmt(r.caudalTotal, 1)} l/s ({r.simultaneas} × {fmt(r.caudalBoca, 1)} l/s); K ≥ {r.K} (art. 167.º)</td></tr>
              <tr><td colSpan={3} className="text-[10.5px] text-ink-2">{r.alimentacao}</td></tr>
            </Fragment>
          ))}</tbody>
        </table>
      )}
      {com.length > 0 && (
        <>
          <ul className="mb-2 ml-5 list-disc text-[11.5px] leading-[1.55] text-ink-2">{com[0].r.regras.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className="text-[10.5px] text-ink-3">O número de bocas é um mínimo: cada boca conta com o quadrado inscrito no círculo de alcance (mangueira + 5 m), critério técnico; a planta confirma que todos os pontos ficam a ≤ 5 m da agulheta e que a distância entre bocas não excede o dobro da mangueira.</p>
        </>
      )}
    </div>
  );
}

export const temRIA = (uts: { ut: UT }[]) => uts.some((x) => dimensionarRIA(x.ut).exigida !== false);
