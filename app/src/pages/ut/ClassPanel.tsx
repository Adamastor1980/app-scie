import { Check } from 'lucide-react';
import type { UT } from '../../data/types';
import { classificar, CAT_NOME, CAT_RISCO, faltaParaMedidas, SIGNIFICADO_FATOR } from '../../engine/calc';
import { CAT_COR } from '../../ui/primitives';
import { integracao } from '../../engine/integrados';
import { ROMANO } from '../../data/rjscie';

/** Critérios da UT (quadro do anexo III): o que falta preencher e, só com tudo preenchido, a categoria atribuída. */
export default function ClassPanel({ ut }: { ut: UT }) {
  const c = classificar(ut);
  const n = c.falta.length;
  const fMed = faltaParaMedidas(ut).filter(([k]) => !c.fatores.some((f) => f.porPreencher && f.id === 'pisos' && k.startsWith('N.º de pisos')));
  const fora = ut.espacos.map((e) => ({ e, ig: integracao(e, ut) })).filter((x) => x.ig?.integrado === false);
  return (
    <aside className="order-first xl:order-none xl:sticky xl:top-[72px] xl:self-start">
      <div className={`border ${n ? 'border-alerta' : 'border-ink'} bg-white`}>
        {n ? (
          <div className="bg-alerta-soft p-5">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">Critérios desta UT · {c.quadro} do anexo III</p>
            <p className="mt-2 font-display text-[24px] font-extrabold leading-tight">Categoria por atribuir</p>
            <p className="mt-1 text-[12.5px] text-ink-2">Falta preencher {n === 1 ? '1 critério' : `${n} critérios`}. A categoria só é atribuída com todos preenchidos (RJ-SCIE, art. 13.º).</p>
          </div>
        ) : (
          <div className={`${CAT_COR[c.cat]} p-5 text-white`}>
            <p className="font-mono text-[10.5px] uppercase tracking-wider opacity-80">Critérios desta UT · {c.quadro} do anexo III</p>
            <p className="h-display mt-2 text-[56px]">{c.cat}.ª</p>
            <p className="font-display text-[17px] font-bold">{CAT_NOME[c.cat]} · {CAT_RISCO[c.cat].toLowerCase()}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold"><Check size={14} /> Todos os critérios preenchidos</p>
          </div>
        )}
        <ul className="divide-y divide-paper-3">
          {c.fatores.map((f) => (
            <li key={f.id} className={`px-4 py-2.5 ${f.porPreencher ? 'bg-alerta-soft/60' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] leading-tight text-ink-2">{f.rotulo}</span>
                {f.porPreencher ? (
                  <span className="shrink-0 border border-alerta bg-alerta-soft px-1.5 font-mono text-[11px] font-semibold text-alerta">por preencher</span>
                ) : (
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="num text-[12.5px] font-semibold">{typeof f.valor === 'number' ? f.valor.toLocaleString('pt-PT') : f.valor}{f.unidade && typeof f.valor === 'number' ? ` ${f.unidade}` : ''}</span>
                    {n ? <Check size={15} className="text-ok" /> : <span className={`grid h-5 w-7 place-items-center font-mono text-[10.5px] font-semibold text-white ${CAT_COR[f.cat]}`}>{f.cat}.ª</span>}
                  </span>
                )}
              </div>
              {f.porPreencher && SIGNIFICADO_FATOR[f.id] && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">{SIGNIFICADO_FATOR[f.id]}</p>}
            </li>
          ))}
        </ul>
        {fMed.length > 0 && (
          <div className="border-t border-alerta bg-alerta-soft px-4 py-2.5 text-[12px]">
            <p className="font-semibold text-alerta">Obrigatório para as medidas (não conta para a categoria):</p>
            {fMed.map(([k, v]) => <p key={k} className="mt-0.5"><b>{k}</b> — <span className="text-ink-2">{v}</span></p>)}
          </div>
        )}
        {fora.length > 0 && (
          <div className="border-t border-alerta bg-alerta-soft px-4 py-2.5 text-[12px]">
            <p className="font-semibold text-alerta">⚠ Espaços que não podem ficar nesta UT (RJ-SCIE, art. 8.º n.º 3):</p>
            {fora.map(({ e, ig }) => <p key={e.id}>{e.nome || 'Espaço sem nome'} → UT {ig!.utPropria.map((t) => ROMANO[t]).join(' ou ')} própria</p>)}
          </div>
        )}
        <p className="border-t border-paper-3 px-4 py-2.5 text-[11.5px] leading-snug text-ink-3">
          A categoria é a mais baixa que satisfaça integralmente todos os critérios; basta exceder um valor para passar à categoria superior (RJ-SCIE, art. 13.º n.os 1 e 2).
        </p>
      </div>
    </aside>
  );
}
