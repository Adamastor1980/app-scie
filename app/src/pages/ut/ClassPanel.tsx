import type { UT } from '../../data/types';
import { classificar, CAT_NOME, CAT_RISCO } from '../../engine/calc';
import { CAT_COR } from '../../ui/primitives';

/** Painel lateral com a classificação ao vivo */
export default function ClassPanel({ ut }: { ut: UT }) {
  const c = classificar(ut);
  return (
    <aside className="xl:sticky xl:top-[72px] xl:self-start">
      <div className="border border-ink bg-white">
        <div className={`${CAT_COR[c.cat]} p-5 text-white`}>
          <p className="font-mono text-[10.5px] uppercase tracking-wider opacity-80">Resultado · {c.quadro} do anexo III</p>
          <p className="h-display mt-2 text-[56px]">{c.cat}.ª</p>
          <p className="font-display text-[17px] font-bold">{CAT_NOME[c.cat]} · {CAT_RISCO[c.cat].toLowerCase()}</p>
          {c.falta.length > 0 && <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider opacity-90">Provisória — faltam dados</p>}
        </div>
        <ul className="divide-y divide-paper-3">
          {c.fatores.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-[12px] leading-tight text-ink-2">{f.rotulo}</span>
              <span className="flex items-center gap-2">
                {f.porPreencher ? <span className="bg-warn-soft px-1.5 font-mono text-[11px] font-semibold text-warn">por preencher</span> : <>
                <span className="num text-[12.5px] font-semibold">{typeof f.valor === 'number' ? f.valor.toLocaleString('pt-PT') : f.valor}{f.unidade && typeof f.valor === 'number' ? ` ${f.unidade}` : ''}</span>
                <span className={`grid h-5 w-7 place-items-center font-mono text-[10.5px] font-semibold text-white ${CAT_COR[f.cat]}`}>{f.cat}.ª</span>
                </>}
              </span>
            </li>
          ))}
        </ul>
        {c.falta.length > 0 && <div className="border-t border-warn bg-warn-soft px-4 py-2.5 text-[12px]">Em falta: {c.falta.join('; ')}. A categoria pode mudar depois de preencher.</div>}
        <p className="border-t border-paper-3 px-4 py-2.5 text-[11.5px] leading-snug text-ink-3">
          A categoria é a mais baixa que satisfaça integralmente todos os critérios; basta exceder um valor para passar à categoria superior (RJ-SCIE, art. 13.º n.os 1 e 2).
        </p>
      </div>
    </aside>
  );
}
