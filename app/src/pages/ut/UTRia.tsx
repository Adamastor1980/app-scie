import { BookOpen } from 'lucide-react';
import type { UT } from '../../data/types';
import { classificar, efetivoUT, fmt, pisosUT } from '../../engine/calc';
import { dimensionarRIA } from '../../engine/ria';
import { Faltas, Field, Num, Section, Toggle } from '../../ui/primitives';

/** Secção «Rede de incêndio armada (carretéis)» do passo Extintores — RT-SCIE, arts. 164.º a 167.º */
export default function UTRia({ ut, upU, n, verLei, opcional }: { ut: UT; upU: (fn: (u: UT) => void) => void; n: string; verLei: (b: string) => void; opcional?: boolean }) {
  const cls = classificar(ut, efetivoUT(ut));
  const r = dimensionarRIA(ut);
  const x = ut.ria ?? {};
  const upR = (fn: (x: NonNullable<UT['ria']>) => void) => upU((u) => { fn(u.ria ??= {}); });
  const Lei = ({ b }: { b: string }) => <button className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-fire-ink hover:underline" onClick={() => verLei(b)}><BookOpen size={12} /> Ver lei</button>;
  const cor = r.exigida === null ? 'border-alerta bg-alerta-soft' : r.exigida ? 'border-fire bg-fire-soft' : 'border-ok bg-ok-soft';

  // projetos de extintores e de manutenção: a RIA só entra se o técnico a incluir
  if (opcional && !x.ativa) return (
    <Section n={n} title="Rede de incêndio armada (carretéis)" sub="Opcional neste tipo de projeto.">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-paper-3 bg-white px-4 py-3 text-[13px]">
        <p className="min-w-0 flex-1 basis-[280px]"><b>Não incluída neste estudo.</b> <span className="text-ink-2">A lei pode exigi-la conforme a utilização-tipo, a categoria e os locais com mais de 200 pessoas (RT-SCIE, art. 164.º). Inclua-a se o estudo a abranger.</span></p>
        <button className="btn h-9 px-4" onClick={() => upR((z) => { z.ativa = true; })}>Incluir</button>
      </div>
    </Section>
  );

  return (
    <Section n={n} title="Rede de incêndio armada (carretéis)" sub="Quando a lei a exige e o mínimo de bocas, caudal e alimentação (RT-SCIE, arts. 164.º a 167.º).">
      <div className={`mb-4 flex flex-wrap items-start justify-between gap-2 border-l-[3px] px-4 py-3 text-[13px] ${cor}`}>
        <p className="min-w-0 flex-1 basis-[280px]"><b>{r.exigida === null ? 'Por saber' : r.exigida ? 'Exigida' : 'Não exigida'}</b> — {r.motivo}</p>
        <Lei b="RT-SCIE, arts. 164.º a 167.º" />
      </div>
      {r.notas.map((t, i) => <p key={i} className="mb-2 text-[12.5px] text-ink-2">{t}</p>)}
      {opcional && <button className="mb-3 text-[12px] font-semibold text-ink-3 hover:text-ink hover:underline" onClick={() => upR((z) => { z.ativa = false; })}>Retirar do estudo</button>}
      {cls.falta.length > 0 && (
        <Field label="Categoria de risco (indicada pelo técnico)" className={`mb-4 max-w-[420px] ${x.cat ? '' : 'falta'}`} hint="Neste tipo de projeto a categoria não é calculada: indique a do projeto de SCIE ou da ficha de segurança do edifício. Define se a rede é exigida (art. 164.º).">
          <select className="input" value={x.cat ?? ''} onChange={(e) => upR((z) => { z.cat = e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : undefined; })}>
            <option value="">Escolher…</option>{[1, 2, 3, 4].map((k) => <option key={k} value={k}>{k}.ª categoria</option>)}
          </select>
        </Field>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Locais com mais de 200 pessoas" hint="Por piso: cada um é servido por carretel, com uma boca junto à saída (arts. 164.º d) e 165.º d)).">
          <div className="flex flex-col gap-1.5">
            {pisosUT(ut).map((p) => (
              <label key={p.n} className="flex items-center gap-2 text-[12.5px]"><span className="w-[70px] shrink-0">{p.nome}</span>
                <Num value={x.locais200?.[String(p.n)]} placeholder="0" onChange={(v) => upR((z) => { (z.locais200 ??= {})[String(p.n)] = Math.max(0, Math.round(v)); })} className="w-20" />
              </label>
            ))}
          </div>
        </Field>
        {ut.tipo === 1 && (
          <div className="md:col-span-2"><Toggle checked={!!x.salaCondominio200} onChange={(v) => upR((z) => { z.salaCondominio200 = v; })} label="Sala de condomínio com área bruta superior a 200 m²" legal="RT-SCIE, art. 210.º n.º 6 e)" /></div>
        )}
      </div>

      {r.exigida && !r.proibida && (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Comprimento da mangueira" className={x.mangueira && x.mangueira > 0 ? '' : 'falta'} hint="Alcance = mangueira + 5 m; distância entre bocas ≤ 2 × mangueira (art. 165.º a) e b)).">
              <Num value={x.mangueira} suffix="m" onChange={(v) => upR((z) => { z.mangueira = v > 0 ? v : undefined; })} />
            </Field>
            {!r.soLocais && (
              <Field label="Escadas que servem os pisos" className={x.escadas === undefined ? 'falta' : ''} hint="Uma boca junto à saída para cada escada, a menos de 3 m (art. 165.º c)). 0 se não houver.">
                <Num value={x.escadas} mostrarZero={x.escadas !== undefined} onChange={(v, t) => upR((z) => { z.escadas = t.trim() === '' ? undefined : Math.max(0, Math.round(v)); })} />
              </Field>
            )}
            {cls.cat <= 2 && (
              <div className="self-end"><Toggle checked={!!x.publica} onChange={(v) => upR((z) => { z.publica = v; })} label="Alimentada pela rede pública com garantias de pressão e caudal" legal="RT-SCIE, art. 167.º n.os 3 e 5" /></div>
            )}
          </div>
          <Faltas itens={r.falta.map((f) => { const [a, b] = f.split(' — '); return [a, b ?? ''] as [string, string]; })} titulo="Falta preencher" />

          {r.total > 0 && (
            <div className="mt-4 border-l-[3px] border-fire bg-fire-soft px-4 py-3 text-[13px]">
              <p className="mb-2 text-[12.5px] font-semibold">Mínimo de bocas de incêndio do tipo carretel</p>
              <table className="w-full text-[13px]"><tbody>
                {r.pisos.map((p) => (
                  <tr key={p.n}><td className="py-0.5 pr-3">{p.nome}<span className="block text-[11.5px] text-ink-3">{[
                    !r.soLocais && p.area > 0 && r.areaPorBoca ? `cobertura ${fmt(p.area, 0)} m² ÷ ${fmt(r.areaPorBoca, 0)} m² = ${p.cobertura}` : '',
                    p.escadas ? `${p.escadas} junto às escadas` : '', p.locais200 ? `${p.locais200} junto a locais > 200 pessoas` : '',
                  ].filter(Boolean).join(' · ')}</span></td><td className="py-0.5 text-right align-top font-bold">{p.minimo}</td></tr>
                ))}
                <tr className="border-t border-fire/40 font-semibold"><td className="pt-1 pr-3">Total (mínimo)</td><td className="pt-1 text-right text-[15px]">{r.total}</td></tr>
              </tbody></table>
              <p className="mt-2 border-t border-fire/40 pt-2">Caudal: <b>{fmt(r.caudalBoca, 1)} l/s</b> por boca com {r.simultaneas} {r.simultaneas === 1 ? 'boca aberta' : 'bocas abertas'} (metade, máximo 4) = <b>{fmt(r.caudalTotal, 1)} l/s</b>; K ≥ {r.K} l/min·bar^0,5 (art. 167.º n.os 1 a 3).</p>
              <p className="mt-1">{r.alimentacao}</p>
              <p className="mt-2 text-[11.5px] text-ink-3">{r.soLocais ? 'Bocas junto à saída de cada local; a cobertura de todo o local (5 m de qualquer ponto) confirma-se na planta.' : `Cobertura: cada boca alcança ${r.alcance} m (mangueira + 5 m); a app conta, por boca, o quadrado inscrito nesse círculo (${fmt(r.areaPorBoca, 0)} m²) — critério técnico. É um mínimo: a planta confirma que todos os pontos ficam a ≤ 5 m da agulheta e a distância entre bocas.`}</p>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
