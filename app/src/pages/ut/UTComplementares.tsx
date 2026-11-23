import { Plus, Trash2, Wand2 } from 'lucide-react';
import type { UTProps } from '../UTPage';
import { Area, Field, Note, Num, Section, Select, Text, Toggle } from '../../ui/primitives';
import { fmt } from '../../engine/calc';
import { novoPiso } from '../../store';
import { classeAltura } from '../../data/rtscie';

/** Dados que não entram na categoria de risco: só concretizam as medidas e a memória descritiva */
export default function UTComplementares({ ed, ut, upU }: UTProps) {
  const t = ut.tipo;
  const pisosCalc = (() => {
    const ocup = ut.pisos.filter((p) => !p.tecnico);
    const acima = ocup.filter((p) => p.cota >= 0);
    return {
      altura: acima.length ? Math.max(...acima.map((p) => p.cota)) : 0,
      abaixo: ocup.filter((p) => p.cota < 0).length,
      area: ut.pisos.reduce((s, p) => s + p.area, 0),
    };
  })();
  return (
    <div>
        <Section n="A" title="Pisos da UT" sub="Descrição piso a piso (anexo IV, I-3 b)). Serve para confirmar a altura e os pisos abaixo do plano de referência e para dimensionar extintores, pontos de penetração e controlo de fumo."
          right={<button className="btn" onClick={() => upU((u) => { u.pisos.push(novoPiso(u.pisos.length)); })}><Plus size={14} /> Piso</button>}>
          {ut.pisos.length > 0 && (
            <>
              <div className="border border-ink bg-white">
                <table className="tbl">
                  <thead><tr><th>Piso</th><th className="w-[140px] text-right">Cota (m)</th><th className="w-[160px] text-right">Área do piso (m²)</th><th className="w-[150px]">Só técnico</th><th className="w-10" /></tr></thead>
                  <tbody>
                    {ut.pisos.map((p, i) => (
                      <tr key={p.id}>
                        <td><Text value={p.nome} onChange={(v) => upU((u) => { u.pisos[i].nome = v; })} /></td>
                        <td><Num value={p.cota} onChange={(v) => upU((u) => { u.pisos[i].cota = v; })} /></td>
                        <td><Num value={p.area} onChange={(v) => upU((u) => { u.pisos[i].area = v; })} /></td>
                        <td><Select value={p.tecnico ? 's' : 'n'} onChange={(v) => upU((u) => { u.pisos[i].tecnico = v === 's'; })} options={[{ v: 'n', l: 'Não' }, { v: 's', l: 'Sim (não conta)' }]} /></td>
                        <td><button className="btn-icon" onClick={() => upU((u) => { u.pisos.splice(i, 1); })}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-paper-3 bg-white px-4 py-3">
                <span className="text-[12.5px] text-ink-2">
                  Dos pisos: altura da UT <b className="num">{fmt(pisosCalc.altura, 2)} m</b> · pisos abaixo <b className="num">{pisosCalc.abaixo}</b> · área total <b className="num">{fmt(pisosCalc.area)} m²</b>
                </span>
                <button className="btn-ghost" onClick={() => upU((u) => { u.altura = pisosCalc.altura; u.pisosAbaixo = pisosCalc.abaixo; u.confirmados = { altura: true, pisos: true }; if (u.tipo === 2 && !u.areaBruta) u.areaBruta = pisosCalc.area; })}>
                  <Wand2 size={14} /> Usar nos fatores de risco
                </button>
              </div>
            </>
          )}
          {ut.pisos.length === 0 && <p className="text-[12.5px] text-ink-3">Sem pisos registados. Opcional, mas recomendado para o dimensionamento dos extintores (art. 163.º) e dos pontos de penetração (art. 6.º).</p>}
        </Section>

        <Section n="B" title="Dados complementares" sub="Usados apenas para concretizar as medidas aplicáveis (não entram na categoria de risco).">
          <div className="grid gap-3 md:grid-cols-2">
            {t === 2 && <Toggle checked={!!ut.parqueAutomatico} onChange={(v) => upU((u) => { u.parqueAutomatico = v; })} label="Parque automático" legal="RT-SCIE, arts. 127.º n.º 3 e 226.º" />}
            {t === 7 && <Toggle checked={!!ut.turismoRural} onChange={(v) => upU((u) => { u.turismoRural = v; })} label="Turismo no espaço rural, de natureza ou de habitação" legal="RT-SCIE, arts. 129.º n.º 2 c) e 257.º" />}
            {t === 6 && <Toggle checked={!!ut.espacoCenicoIsolavel} onChange={(v) => upU((u) => { u.espacoCenicoIsolavel = v; })} label="Possui espaços cénicos isoláveis" legal="RT-SCIE, arts. 135.º n.º 1 k), 241.º e 254.º" />}
            {(t === 10 || t === 11) && <Toggle checked={!!ut.patrimonio} onChange={(v) => upU((u) => { u.patrimonio = v; })} label="Bens de manifesto interesse histórico ou cultural" legal="RT-SCIE, arts. 294.º / 298.º e 299.º" />}
            <Toggle checked={!!ut.temCozinhaC} onChange={(v) => upU((u) => { u.temCozinhaC = v; })} label="Cozinha (local C) ligada a sala de refeições" legal="RT-SCIE, arts. 21.º n.º 2 e 135.º n.º 4" />
            <Toggle checked={!!ut.temGas} onChange={(v) => upU((u) => { u.temGas = v; })} label="Aparelhos a gás em locais C ou ductos com gás" legal="RT-SCIE, art. 184.º" />
            {t === 12 && (
              <>
                <Field label="Caso de implantação (quadro L)" legal="RT-SCIE, art. 302.º">
                  <Select value={ut.casoXII ?? 3} onChange={(v) => upU((u) => { u.casoXII = v; })} options={[
                    { v: 1 as const, l: 'Caso I — coexiste com outras UT' },
                    { v: 2 as const, l: 'Caso II — exclusivo, empena comum com habitação/público' },
                    { v: 3 as const, l: 'Caso III — exclusivo, afastamentos cumpridos' },
                    { v: 4 as const, l: 'Caso IV — isolado, sem pisos enterrados' },
                  ]} />
                </Field>
                <Field label="Líquidos combustíveis armazenados" legal="RT-SCIE, arts. 307.º e 308.º"><Num value={ut.liquidosInflamaveisL} onChange={(v) => upU((u) => { u.liquidosInflamaveisL = v; })} suffix="l" /></Field>
                <Field label="Área de pintura/vernizes (PI < 55 °C)" legal="RT-SCIE, art. 308.º n.º 1"><Num value={ut.pinturaArea} onChange={(v) => upU((u) => { u.pinturaArea = v; })} suffix="m²" /></Field>
              </>
            )}
          </div>
        </Section>

        <Section n="C" title="Descrição da UT" sub="Descrição funcional para a memória descritiva.">
          <Area value={ut.descricao} onChange={(v) => upU((u) => { u.descricao = v; })} rows={4} placeholder="Atividade, horário de funcionamento, ocupação, equipamentos relevantes…" />
          <div className="mt-3"><Note>Altura do edifício «{ed.nome}»: {fmt(ed.altura, 1)} m ({classeAltura(ed.altura).toLowerCase()} altura). É esta altura (RT-SCIE, anexo I) que define as exigências de resistência e reação ao fogo das vias; a altura da UT define a categoria.</Note></div>
        </Section>
    </div>
  );
}
