import { nomeUT } from '../nome';
import { novaUT } from '../store';
import { Trash2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import { go } from '../router';
import type { Edificio, UT } from '../data/types';
import { ROMANO, utInfo } from '../data/rjscie';
import { classificar, efetivoUT, cargaUT, fmt, CAT_NOME } from '../engine/calc';
import { CAT_COR } from '../ui/primitives';
import UTFatores from './ut/UTFatores';
import UTEfetivo from './ut/UTEfetivo';
import UTCarga from './ut/UTCarga';
import UTCategoria from './ut/UTCategoria';
import UTMedidas from './ut/UTMedidas';

export interface UTProps {
  ed: Edificio;
  ut: UT;
  upU: (fn: (u: UT) => void) => void;
}

export const precisaEfetivo = (t: number) => t >= 3 && t <= 11;
export const precisaCarga = (t: number) => t === 11 || t === 12;

export default function UTPage({ eid, uid, step }: { eid: string; uid: string; step: string }) {
  const { p, up } = useP();
  const ed = p.edificios.find((e) => e.id === eid);
  const ut = ed?.uts.find((u) => u.id === uid);
  if (!ed || !ut) return <div className="p-8">Utilização-tipo não encontrada.</div>;

  const upU = (fn: (u: UT) => void) =>
    up((pp) => {
      const u = pp.edificios.find((e) => e.id === eid)?.uts.find((x) => x.id === uid);
      if (u) fn(u);
    });

  const ef = efetivoUT(ut);
  const carga = cargaUT(ut);
  const cls = classificar(ut, ef, carga);
  const info = utInfo(ut.tipo);
  const base = `/p/${p.id}/e/${eid}/u/${uid}`;

  const todos = [
    { k: 'fatores', t: 'Fatores de risco', s: info.quadro },
    ...(precisaEfetivo(ut.tipo)
      ? [{ k: 'efetivo', t: 'Efetivo', s: `${fmt(ef.total)} pessoas` }]
      : []),
    ...(precisaCarga(ut.tipo) ? [{ k: 'carga', t: 'Carga de incêndio', s: `${fmt(carga.q)} MJ/m²` }] : []),
    { k: 'categoria', t: 'Categoria', s: CAT_NOME[cls.cat] },
    { k: 'medidas', t: 'Medidas', s: 'RT-SCIE' },
  ];
  const steps = todos.map((x, i) => ({ ...x, n: String(i + 1).padStart(2, '0') }));
  if (!steps.some((x) => x.k === step)) step = 'fatores';
  const props: UTProps = { ed, ut, upU };

  return (
    <main className="pb-24">
      <div className="border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1240px] items-stretch gap-3 sm:gap-6 px-4 pt-6 sm:px-8">
          <div className={`flex w-[64px] shrink-0 flex-col items-center sm:w-[92px] justify-center self-stretch ${CAT_COR[cls.cat]} text-white`}>
            <span className="font-display text-[30px] font-extrabold leading-none sm:text-[44px]">{cls.cat}.ª</span>
            <span className="mt-1 font-mono text-[9.5px] uppercase tracking-wider">categoria</span>
          </div>
          <div className="min-w-0 flex-1 pb-5">
            <p className="label">{ed.nome} · UT {ROMANO[ut.tipo]} · art. 8.º n.º 1 {info.alinea} RJ-SCIE</p>
            <input
              className="mt-1 w-full bg-transparent font-display text-[22px] sm:text-[32px] font-extrabold leading-tight tracking-tight outline-none focus:text-fire"
              value={ut.designacao === novaUT(ut.tipo).designacao ? '' : ut.designacao}
              placeholder={nomeUT(ut).temNome ? nomeUT(ut).nome : 'Nome desta UT (ex.: Escritórios piso 1)'}
              title="Clique para alterar o nome"
              onChange={(e) => upU((u) => { u.designacao = e.target.value || novaUT(u.tipo).designacao; })}
            />
            <p className="mt-1 hidden max-w-3xl text-[12.5px] leading-snug text-ink-3 sm:block">{info.definicao}</p>
          </div>
          <div className="pb-5">
            <button className="btn-icon" title="Apagar UT" onClick={() => {
              if (!confirm('Apagar esta utilização-tipo?')) return;
              up((pp) => { const e = pp.edificios.find((x) => x.id === eid); if (e) e.uts = e.uts.filter((x) => x.id !== uid); });
              go(`/p/${p.id}/e/${eid}`);
            }}><Trash2 size={16} /></button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1240px] gap-px overflow-x-auto px-4 sm:px-8">
          {steps.map((s) => {
            const a = step === s.k;
            return (
              <a key={s.k} href={`#${base}/${s.k}`} className={`flex min-w-[130px] flex-1 flex-col sm:min-w-[170px] border-t-[3px] px-3 py-2.5 ${a ? 'border-fire bg-paper' : 'border-transparent hover:bg-paper/60'}`}>
                <span className="flex items-baseline gap-2">
                  <span className={`font-mono text-[11px] font-semibold ${a ? 'text-fire' : 'text-ink-4'}`}>{s.n}</span>
                  <span className="text-[13.5px] font-bold">{s.t}</span>
                </span>
                <span className="ref ml-[26px]">{s.s}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-8 sm:pt-8">
        {step === 'fatores' && <UTFatores {...props} />}
        {step === 'efetivo' && <UTEfetivo {...props} />}
        {step === 'carga' && <UTCarga {...props} />}
        {step === 'categoria' && <UTCategoria {...props} />}
        {step === 'medidas' && <UTMedidas {...props} />}

        <div className="no-print mt-10 flex justify-between border-t border-ink pt-4">
          {(() => {
            const i = steps.findIndex((s) => s.k === step);
            return (
              <>
                {i > 0 ? <a className="btn" href={`#${base}/${steps[i - 1].k}`}>← {steps[i - 1].t}</a> : <span />}
                {i < steps.length - 1 ? <a className="btn-primary" href={`#${base}/${steps[i + 1].k}`}>{steps[i + 1].t} →</a> : <a className="btn-fire" href={`#/p/${p.id}/relatorio`}>Relatório →</a>}
              </>
            );
          })()}
        </div>
      </div>
    </main>
  );
}
