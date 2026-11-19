import { useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import type { UTProps } from '../UTPage';
import { precisaEfetivo } from '../UTPage';
import type { CriterioEfetivo, Espaco, LocalRisco } from '../../data/types';
import { QUADRO_XXVII } from '../../data/rtscie';
import { LOCAIS, SUBTIPOS_C } from '../../data/rjscie';
import { efetivoEspaco, efetivoUT, fmt } from '../../engine/calc';
import { Empty, Field, Note, Num, Section, Select, Stat, Text, Toggle } from '../../ui/primitives';
import { novoEspaco, uid } from '../../store';

const CRITERIOS: { v: CriterioEfetivo; l: string; uts?: number[] }[] = [
  { v: 'indice', l: 'Índice de ocupação × área útil (quadro XXVII)' },
  { v: 'lugares', l: 'Número de lugares fixos (n.º 2 d))' },
  { v: 'camas', l: 'Ocupantes em camas (n.º 2 a))', uts: [4, 5, 7] },
  { v: 'acamados', l: '3,2 × lugares de acamados (n.º 2 b))', uts: [5] },
  { v: 'tipologia', l: 'Apartamentos/moradias turísticas Tn (quadro XXVI)', uts: [7] },
  { v: 'comprimento', l: 'Por metro de banco ou frente (quadro XXVIII)' },
  { v: 'desportivo', l: 'Instalações desportivas (art. 283.º)', uts: [9] },
  { v: 'declarado', l: 'Declarado pela entidade, mín. 0,03 p/m² (n.º 2 e))', uts: [11, 12] },
  { v: 'fundamentado', l: 'Valor fundamentado pelo autor (n.º 8)' },
];

const LOCAL_OPTS: { v: LocalRisco; l: string }[] = [
  { v: 'A', l: 'A' }, { v: 'B', l: 'B' }, { v: 'C', l: 'C' }, { v: 'Cag', l: 'C agravado' }, { v: 'D', l: 'D' }, { v: 'E', l: 'E' }, { v: 'F', l: 'F' },
];

export default function UTEfetivo({ ut, upU }: UTProps) {
  const ef = efetivoUT(ut);
  const [showQ, setShowQ] = useState(false);
  const crits0 = CRITERIOS.filter((c) => !c.uts || c.uts.includes(ut.tipo));
  const crits = ut.tipo === 12 ? [...crits0.filter((c) => c.v === 'declarado'), ...crits0.filter((c) => c.v !== 'declarado')] : crits0;
  const setE = (i: number, fn: (e: Espaco) => void) => upU((u) => fn(u.espacos[i]));

  return (
    <div>
      {!precisaEfetivo(ut.tipo) && (
        <div className="mb-6"><Note>O efetivo não é fator de risco da UT {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][ut.tipo - 1]} (art. 12.º n.º 2). Registe os espaços para classificar os locais de risco (art. 10.º) e dimensionar saídas e vias de evacuação (arts. 54.º a 64.º).{ut.tipo === 12 && <> Na UT XII o critério legal para zonas de produção, armazéns e espaços sem público é o <b>número de ocupantes declarado pela entidade exploradora, com o mínimo de 0,03 pessoas/m²</b> (art. 51.º n.º 2 e)). Os índices do quadro XXVII só se usam em espaços integrados de outro tipo (escritórios, refeitórios, balneários).</>}</Note></div>
      )}
      <div className="mb-8 grid gap-3 md:grid-cols-4">
        <Stat label="Efetivo da UT" value={fmt(ef.total)} unit="pessoas" sub={ef.origem === 'manual' ? 'Valor introduzido manualmente' : 'Somatório dos espaços (art. 51.º n.º 1)'} accent />
        <Stat label="Efetivo em locais D" value={fmt(ef.emD)} unit="pessoas" />
        <Stat label="Efetivo em locais E" value={fmt(ef.emE)} unit="pessoas" />
        <Stat label="Para evacuação (×1,3)" value={fmt(ef.totalEvacuacao)} unit="pessoas" sub="Art. 51.º n.º 5: só dimensiona vias e saídas" />
      </div>

      <Section n="2.1" title="Espaços e locais de risco" sub="Um espaço por linha. O efetivo de cada espaço é arredondado ao inteiro superior (art. 51.º n.os 2 e 3)."
        right={<div className="flex gap-2"><button className="btn" onClick={() => setShowQ((s) => !s)}>{showQ ? 'Ocultar' : 'Ver'} quadro XXVII</button><button className="btn-fire" onClick={() => upU((u) => { u.espacos.push(novoEspaco(u.tipo)); })}><Plus size={15} /> Espaço</button></div>}>
        {showQ && <QuadroXXVII />}
        {ut.espacos.length === 0 ? (
          <Empty title="Sem espaços." action={<button className="btn-fire" onClick={() => upU((u) => { u.espacos.push(novoEspaco(u.tipo)); })}><Plus size={15} /> Adicionar espaço</button>}>
            Para cada espaço escolha o critério legal de cálculo do efetivo e o local de risco (art. 10.º do RJ-SCIE).
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {ut.espacos.map((e, i) => {
              const c = efetivoEspaco(e);
              const aviso = e.local === 'A' && (c.valor > 100 || (e.efetivoPublico ?? 0) > 50);
              return (
                <div key={e.id} className={`border bg-white ${e.naoSimultaneo ? 'border-dashed border-ink-4 opacity-80' : 'border-ink'}`}>
                  <div className="grid gap-3 p-4 md:grid-cols-[1.4fr_0.7fr_0.8fr_1.8fr_auto]">
                    <Field label="Espaço"><Text value={e.nome} onChange={(v) => setE(i, (x) => { x.nome = v; })} placeholder="ex.: Open space piso 1" /></Field>
                    <Field label="Piso"><Text value={e.piso} onChange={(v) => setE(i, (x) => { x.piso = v; })} /></Field>
                    <Field label="Local de risco" legal="art. 10.º"><Select value={e.local} onChange={(v) => setE(i, (x) => { x.local = v; })} options={LOCAL_OPTS} /></Field>
                    <Field label="Critério do efetivo" legal="RT-SCIE art. 51.º"><Select value={e.criterio} onChange={(v) => setE(i, (x) => { x.criterio = v; })} options={crits.map((k) => ({ v: k.v, l: k.l }))} /></Field>
                    <div className="flex items-end gap-1">
                      <button className="btn-icon" title="Duplicar" onClick={() => upU((u) => { u.espacos.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(e)), id: uid(), nome: e.nome + ' (cópia)' }); })}><Copy size={14} /></button>
                      <button className="btn-icon" title="Apagar" onClick={() => upU((u) => { u.espacos.splice(i, 1); })}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-paper-3 bg-paper/40 p-4 md:grid-cols-4">
                    <Params e={e} set={(fn) => setE(i, fn)} />
                    {(e.local === 'C' || e.local === 'Cag') && (
                      <Field label="Enquadramento do local C" legal="art. 10.º n.º 3" className="md:col-span-2">
                        <Select value={e.subtipoC ?? ''} onChange={(v) => setE(i, (x) => { x.subtipoC = v; })} options={[{ v: '', l: '—' }, ...SUBTIPOS_C.map((s) => ({ v: s.id, l: s.txt }))]} />
                      </Field>
                    )}
                    <Field label="Efetivo de público" hint="Para distinguir A/B (art. 10.º)."><Num value={e.efetivoPublico} onChange={(v) => setE(i, (x) => { x.efetivoPublico = v; })} /></Field>
                    <Field label="Saídas existentes" hint="Opcional: verificação."><Num value={e.saidasExistentes} onChange={(v) => setE(i, (x) => { x.saidasExistentes = v || undefined; })} /></Field>
                    <Field label="UP existentes" hint="Opcional: verificação."><Num value={e.upExistentes} onChange={(v) => setE(i, (x) => { x.upExistentes = v || undefined; })} /></Field>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-paper-3 px-4 py-3">
                    <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" className="accent-fire" checked={!!e.mobilidadeReduzida} onChange={(ev) => setE(i, (x) => { x.mobilidadeReduzida = ev.target.checked; })} /> Crianças ≤ 3 anos ou pessoas limitadas (×1,3 na evacuação — art. 51.º n.º 5{ut.tipo === 5 ? ', art. 232.º' : ''})</label>
                    <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" className="accent-fire" checked={!!e.naoSimultaneo} onChange={(ev) => setE(i, (x) => { x.naoSimultaneo = ev.target.checked; })} /> Ocupado pelas mesmas pessoas noutro horário — não somar (art. 51.º n.º 9)</label>
                    <div className="ml-auto flex items-baseline gap-3">
                      <span className="ref">{c.formula} =</span>
                      <span className="font-display text-[26px] font-extrabold num">{fmt(c.valor)}</span>
                      {e.mobilidadeReduzida && <span className="ref">evac. {c.evacuacao}</span>}
                    </div>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-paper-3 px-4 py-2 text-[11px] text-ink-3">
                    <span>{c.base}</span>
                    {aviso && <span className="font-semibold text-fire">Efetivo &gt; 100 ou público &gt; 50: é local de risco B, não A (art. 10.º n.º 1 b)).</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {ef.excluidos > 0 && <p className="mt-2 text-[12px] text-ink-3">Excluídos do total por não coexistirem (art. 51.º n.º 9): {ef.excluidos} pessoas.</p>}
      </Section>

      {ef.porPiso.length > 0 && (
        <Section n="2.2" title="Efetivo por piso" sub="Base do dimensionamento das vias verticais: 1 UP por 70 utilizadores, considerando a maior soma de dois pisos consecutivos (art. 64.º n.os 11 e 12).">
          <div className="border border-ink bg-white">
            <table className="tbl">
              <thead><tr><th>Piso</th><th className="text-right">Efetivo</th><th className="text-right">Efetivo de evacuação</th></tr></thead>
              <tbody>{ef.porPiso.map((p) => <tr key={p.piso}><td>{p.piso}</td><td className="num text-right">{p.efetivo}</td><td className="num text-right">{p.evacuacao}</td></tr>)}</tbody>
            </table>
          </div>
        </Section>
      )}

      <Section n="2.3" title="Locais de risco" sub="Definições do art. 10.º do RJ-SCIE.">
        <div className="grid gap-px border border-ink bg-ink md:grid-cols-2">
          {(Object.keys(LOCAIS) as LocalRisco[]).map((k) => (
            <div key={k} className="bg-white p-4">
              <p className="font-display text-[15px] font-bold">{LOCAIS[k].nome}</p>
              <p className="mt-1 text-[12px] leading-snug text-ink-3">{LOCAIS[k].def}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section n="2.4" title="Valor manual (opcional)" sub="Só para lotações licenciadas ou declaradas que não se possam reconstituir por espaços. Fica identificado no relatório.">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <Toggle checked={ut.usarEfetivoManual} onChange={(v) => upU((u) => { u.usarEfetivoManual = v; })} label="Usar efetivo introduzido manualmente" hint="Substitui o somatório dos espaços no fator de risco." />
          <Field label="Efetivo manual"><Num value={ut.efetivoManual} onChange={(v) => upU((u) => { u.efetivoManual = Math.ceil(v); })} /></Field>
        </div>
      </Section>
    </div>
  );
}

function Params({ e, set }: { e: Espaco; set: (fn: (e: Espaco) => void) => void }) {
  switch (e.criterio) {
    case 'indice':
      return (
        <>
          <Field label="Uso do espaço (quadro XXVII)" className="md:col-span-2">
            <Select value={e.indiceId ?? ''} onChange={(v) => set((x) => { x.indiceId = v; })} options={QUADRO_XXVII.map((q) => ({ v: q.id, l: `${q.indice.toFixed(2).replace('.', ',')} p/m² — ${q.espaco}` }))} />
          </Field>
          <Field label="Área útil" legal="art. 2.º c) RJ-SCIE"><Num value={e.area} onChange={(v) => set((x) => { x.area = v; })} suffix="m²" /></Field>
          <span />
        </>
      );
    case 'camas':
    case 'lugares':
    case 'fundamentado':
      return (
        <>
          <Field label={e.criterio === 'camas' ? 'N.º de ocupantes em camas' : e.criterio === 'lugares' ? 'N.º de lugares fixos' : 'Efetivo fundamentado'}>
            <Num value={e.n} onChange={(v) => set((x) => { x.n = Math.round(v); })} />
          </Field>
          {e.criterio === 'fundamentado' ? (
            <Field label="Fundamentação" className="md:col-span-3"><Text value={e.justificacao ?? ''} onChange={(v) => set((x) => { x.justificacao = v; })} placeholder="Critério usado e origem dos dados" /></Field>
          ) : <span className="md:col-span-3" />}
        </>
      );
    case 'acamados':
      return <><Field label="N.º de lugares de acamados"><Num value={e.n} onChange={(v) => set((x) => { x.n = Math.round(v); })} /></Field><span className="md:col-span-3" /></>;
    case 'tipologia':
      return (
        <>
          <Field label="Tipologia Tn (n)"><Num value={e.tipologia} onChange={(v) => set((x) => { x.tipologia = Math.round(v); })} /></Field>
          <Field label="N.º de unidades"><Num value={e.n} onChange={(v) => set((x) => { x.n = Math.round(v); })} /></Field>
          <p className="self-end text-[11.5px] text-ink-3 md:col-span-2">Quadro XXVI: T0 = 2, T1 = 4, T2 = 6, T3 = 8, T4 = 10, Tn = 2(n+1).</p>
        </>
      );
    case 'declarado':
      return (
        <>
          <Field label="Efetivo declarado"><Num value={e.n} onChange={(v) => set((x) => { x.n = Math.round(v); })} /></Field>
          <Field label="Área útil"><Num value={e.area} onChange={(v) => set((x) => { x.area = v; })} suffix="m²" /></Field>
          <p className="self-end text-[11.5px] text-ink-3 md:col-span-2">Arquivos e espaços não acessíveis a público da UT XII: mínimo de 0,03 pessoas/m².</p>
        </>
      );
    case 'comprimento':
      return (
        <>
          <Field label="Tipo" className="md:col-span-2">
            <Select value={e.comprimentoTipo ?? 'sentados'} onChange={(v) => set((x) => { x.comprimentoTipo = v; })} options={[
              { v: 'sentados' as const, l: 'Lugares sentados não individualizados — 2 pessoas/m de banco ou bancada' },
              { v: 'pe' as const, l: 'Lugares de pé numa única frente — 5 pessoas/m de frente' },
            ]} />
          </Field>
          <Field label="Comprimento"><Num value={e.comprimento} onChange={(v) => set((x) => { x.comprimento = v; })} suffix="m" /></Field>
          <span />
        </>
      );
    case 'desportivo':
      return (
        <>
          <Field label="Situação (art. 283.º)" className="md:col-span-2">
            <Select value={e.desportivoTipo ?? 'apoio'} onChange={(v) => set((x) => { x.desportivoTipo = v; })} options={[
              { v: 'apoio' as const, l: 'a) Instalação coberta — 0,1 p/m² da área útil de apoio' },
              { v: 'patinagem' as const, l: 'b) Pista de patinagem — 0,7 p/m² da pista' },
              { v: 'agua' as const, l: 'c) Piscina/parque aquático — 1 p/m² de plano de água' },
            ]} />
          </Field>
          <Field label="Espectadores"><Num value={e.espectadores} onChange={(v) => set((x) => { x.espectadores = Math.round(v); })} /></Field>
          <Field label="Área"><Num value={e.area} onChange={(v) => set((x) => { x.area = v; })} suffix="m²" /></Field>
        </>
      );
  }
}

function QuadroXXVII() {
  return (
    <div className="mb-5 border border-ink bg-white">
      <div className="border-b border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white">Quadro XXVII — número de ocupantes por unidade de área (RT-SCIE, art. 51.º n.º 3)</div>
      <table className="tbl">
        <thead><tr><th>Espaços</th><th className="w-32 text-right">Índice (p/m²)</th></tr></thead>
        <tbody>{QUADRO_XXVII.map((q) => <tr key={q.id}><td>{q.espaco}</td><td className="num text-right">{q.indice.toFixed(2).replace('.', ',')}</td></tr>)}</tbody>
      </table>
      <div className="grid gap-px border-t border-ink bg-ink md:grid-cols-2">
        <div className="bg-white p-3 text-[12px]"><b>Quadro XXVI</b> — apartamentos e moradias turísticas: T0 = 2; T1 = 4; T2 = 6; T3 = 8; T4 = 10; Tn = 2(n+1).</div>
        <div className="bg-white p-3 text-[12px]"><b>Quadro XXVIII</b> — lugares sentados não individualizados: 2 pessoas/m de banco; lugares de pé numa única frente: 5 pessoas/m de frente.</div>
      </div>
    </div>
  );
}
