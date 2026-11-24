import { Trash2, Wand2 } from 'lucide-react';
import type { Piso } from '../../data/types';
import type { UTProps } from '../UTPage';
import { Area, Field, Note, Num, Section, Select, Toggle } from '../../ui/primitives';
import { fmt, numPiso, pisoAbaixo, pisosSemNumero, pisosUT, rotuloPiso } from '../../engine/calc';
import { novoPiso } from '../../store';
import { classeAltura } from '../../data/rtscie';

/** Dados que não entram na categoria de risco: só concretizam as medidas e a memória descritiva */
const OPCOES = Array.from({ length: 51 }, (_, k) => 40 - k);

export default function UTComplementares({ ed, ut, upU }: UTProps) {
  const t = ut.tipo;
  const lista = pisosUT(ut);
  const semNum = pisosSemNumero(ut);
  const comCota = lista.filter((p) => p.cota !== undefined && !p.tecnico);
  const pisosCalc = {
    altura: Math.max(0, ...comCota.filter((p) => !pisoAbaixo(p)).map((p) => p.cota as number)),
    abaixo: lista.filter((p) => pisoAbaixo(p) && !p.tecnico).length,
    area: lista.reduce((s, p) => s + p.area, 0),
  };
  /** grava cota/área na linha do piso n (cria-a se ainda não existir) */
  const setLinha = (n: number, fn: (p: Piso) => void) => upU((u) => {
    let l = u.pisos.find((p) => numPiso(p) === n);
    if (!l) { l = { ...novoPiso(n), n, nome: rotuloPiso(n), cota: 0 }; u.pisos.push(l); }
    fn(l);
  });
  const livres = OPCOES.filter((o) => !lista.some((p) => p.n === o));
  return (
    <div>
        <Section n="A" title="Pisos da UT" sub="Os pisos vêm dos espaços (passo «Espaços e efetivo»). Aqui indica a cota e a área de cada um (anexo IV, I-3 b)): servem para dimensionar extintores (RT-SCIE, art. 163.º), pontos de penetração (art. 6.º) e controlo de fumo (art. 135.º).">
          {semNum.length > 0 && (
            <div className="mb-3 border-l-[3px] border-alerta bg-white px-4 py-3 text-[12.5px]">
              <p className="font-semibold text-alerta">Falta preencher: número do piso</p>
              <p className="mb-2 text-ink-2">Estas linhas antigas não têm um número de piso reconhecível. Indique o número para as ligar aos espaços desse piso; sem ele, a cota e a área não entram nas medidas.</p>
              {semNum.map((p) => (
                <div key={p.id} className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="min-w-[120px] font-semibold">«{p.nome}»</span>
                  <Select value="" onChange={(v) => upU((u) => { const l = u.pisos.find((x) => x.id === p.id); if (l && v !== '') { l.n = Number(v); l.nome = rotuloPiso(Number(v)); } })}
                    options={[{ v: '', l: 'Escolher piso…' }, ...livres.map((o) => ({ v: String(o), l: rotuloPiso(o) }))]} />
                  <button className="btn-icon" title="Apagar linha" onClick={() => upU((u) => { u.pisos = u.pisos.filter((x) => x.id !== p.id); })}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {lista.length > 0 ? (
            <>
              <div className="overflow-x-auto border border-ink bg-white">
                <table className="tbl !table min-w-[560px]">
                  <thead><tr><th>Piso</th><th className="w-[130px] text-right">Cota (m)</th><th className="w-[150px] text-right">Área do piso (m²)</th><th className="w-[150px]">Só técnico</th><th className="w-10" /></tr></thead>
                  <tbody>
                    {lista.map((p) => (
                      <tr key={p.n}>
                        <td className="font-semibold">{p.nome}{p.n === 0 && <span className="ref"> plano de referência</span>}{!p.comEspacos && <span className="ref"> · sem espaços</span>}</td>
                        <td><Num value={p.cota ?? 0} mostrarZero={p.cota !== undefined} onChange={(v) => setLinha(p.n, (l) => { l.cota = v; })} /></td>
                        <td><Num value={p.area} onChange={(v) => setLinha(p.n, (l) => { l.area = v; })} /></td>
                        <td><Select value={p.tecnico ? 's' : 'n'} onChange={(v) => upU((u) => { const t = new Set(u.pisosTecnicos ?? []); if (v === 's') t.add(p.n); else t.delete(p.n); u.pisosTecnicos = [...t]; const l = u.pisos.find((x) => numPiso(x) === p.n); if (l) delete l.tecnico; })} options={[{ v: 'n', l: 'Não' }, { v: 's', l: 'Sim (não conta)' }]} /></td>
                        <td>{!p.comEspacos && <button className="btn-icon" title="Retirar piso" onClick={() => upU((u) => { u.pisos = u.pisos.filter((x) => numPiso(x) !== p.n); u.pisosTecnicos = (u.pisosTecnicos ?? []).filter((x) => x !== p.n); })}><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-paper-3 bg-white px-4 py-3">
                <span className="text-[12.5px] text-ink-2">
                  Dos pisos: altura da UT <b className="num">{fmt(pisosCalc.altura, 2)} m</b> · pisos abaixo <b className="num">{pisosCalc.abaixo}</b> · área total <b className="num">{fmt(pisosCalc.area)} m²</b>
                </span>
                {comCota.length > 0 && <button className="btn-ghost" onClick={() => upU((u) => { u.altura = pisosCalc.altura; u.pisosAbaixo = pisosCalc.abaixo; u.indicados = { altura: true, pisos: true }; if (u.tipo === 2 && !u.areaBruta) u.areaBruta = pisosCalc.area; })}>
                  <Wand2 size={14} /> Usar nos fatores de risco
                </button>}
              </div>
            </>
          ) : <p className="text-[12.5px] text-ink-3">Ainda não há espaços com piso. Os pisos aparecem aqui quando indicar o piso de cada espaço.</p>}
          {livres.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
              <span className="text-ink-3">Piso sem espaços (ex.: só técnico):</span>
              <Select value="" onChange={(v) => { if (v !== '') setLinha(Number(v), () => {}); }} options={[{ v: '', l: 'Acrescentar piso…' }, ...livres.map((o) => ({ v: String(o), l: rotuloPiso(o) }))]} />
            </div>
          )}
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
