import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { UTProps } from '../UTPage';
import { precisaCarga } from '../UTPage';
import type { Compartimento, Risco } from '../../data/types';
import { QUADRO_I_HI, QUADRO_II } from '../../data/despacho';
import { CI_OPCOES, RAI, RAI_NOME, cargaCompartimento, cargaUT, fmt } from '../../engine/calc';
import { Empty, Field, Note, Num, Section, Select, Stat, Text, Toggle } from '../../ui/primitives';
import Combo from '../../ui/Combo';
import { novoCompartimento, uid } from '../../store';
import { QuadroIView, QuadroIIView } from '../Tabelas';

const RAI_OPTS = (['A', 'M', 'B'] as Risco[]).map((r) => ({ v: RAI[r], l: `${RAI[r].toFixed(1).replace('.', ',')} ${RAI_NOME[r].toLowerCase()}` }));
const CI_OPTS = CI_OPCOES.map((c) => ({ v: c.v, l: `${c.v.toFixed(2).replace('.', ',')} ${c.rotulo.split(' — ')[0].replace('Risco ', '')}` }));

const ITENS_HI = QUADRO_I_HI.map((p, i) => ({ key: i, label: p.p, right: `${fmt(p.h, 2)} MJ/kg` }));
const ITENS_QS = QUADRO_II.filter((a) => a.qs).map((a) => ({ key: a.id, label: a.a, right: `${fmt(a.qs)} MJ/m² · ${RAI_NOME[a.rs!]}` }));
const ITENS_QV = QUADRO_II.filter((a) => a.qv).map((a) => ({ key: a.id, label: a.a, right: `${fmt(a.qv)} MJ/m³ · ${RAI_NOME[a.rv!]}` }));

export default function UTCarga({ ut, upU }: UTProps) {
  const total = cargaUT(ut);
  const setC = (i: number, fn: (c: Compartimento) => void) => upU((u) => fn(u.compartimentos[i]));

  return (
    <div>
      {!precisaCarga(ut.tipo) && (
        <div className="mb-6"><Note>A densidade de carga de incêndio modificada só é fator de risco nas UT XI e XII (art. 12.º n.º 2 h) e i)). Nesta UT, use o cálculo da carga de incêndio modificada (Qs) para verificar se um local é de risco C (&gt; 10 000 MJ, art. 10.º n.º 3 n)) ou C agravado (&gt; 20 000 MJ, art. 11.º n.º 3).</Note></div>
      )}
      <div className="mb-8 grid gap-3 md:grid-cols-4">
        <Stat label="Densidade q da UT" value={fmt(total.q, 1)} unit="MJ/m²" sub="N.º 4.º, 2 do Despacho" accent />
        <Stat label="Carga Q da UT" value={fmt(total.Q)} unit="MJ" sub="N.º 4.º, 1 do Despacho" />
        <Stat label="Área útil ΣSk" value={fmt(total.S, 1)} unit="m²" />
        <Stat label="Compartimentos" value={total.n} />
      </div>

      <div className="mb-8 border border-ink bg-white px-5 py-4 text-[12.5px]">
        <span className="label mr-3">Resultado da UT</span>
        <span className="font-mono">q = Σ qsk · Sk / Σ Sk</span>
        <span className="ml-2 text-ink-3">— média das densidades dos compartimentos corta-fogo ponderada pelas áreas (n.º 4.º do Despacho). Em cada compartimento escolha o método: determinístico ou probabilístico (n.º 2.º).</span>
      </div>

      <Section n="3.1" title="Compartimentos corta-fogo" sub="Um bloco por compartimento. Em cada um escolha o método de cálculo." right={
        <button className="btn-fire" onClick={() => upU((u) => { u.compartimentos.push(novoCompartimento(u.compartimentos.length + 1)); })}><Plus size={15} /> Compartimento</button>
      }>
        {ut.compartimentos.length === 0 && (
          <Empty title="Sem compartimentos." action={<button className="btn-fire" onClick={() => upU((u) => { u.compartimentos.push(novoCompartimento(1)); })}><Plus size={15} /> Adicionar compartimento</button>}>
            Cada compartimento corta-fogo é calculado pelo método determinístico (massa e poder calorífico) ou probabilístico (valores estatísticos por atividade).
          </Empty>
        )}
        <div className="flex flex-col gap-6">
          {ut.compartimentos.map((c, i) => <CompBloco key={c.id} c={c} set={(fn) => setC(i, fn)} remove={() => upU((u) => { u.compartimentos.splice(i, 1); })} />)}
        </div>
      </Section>

      <Section n="3.2" title="Coeficientes" sub="N.º 6.º (Ci) e n.º 7.º (Rai) do Despacho.">
        <div className="grid gap-px border border-ink bg-ink md:grid-cols-2">
          <div className="bg-white p-4">
            <p className="font-display text-[15px] font-bold">Ci — coeficiente de combustibilidade</p>
            {CI_OPCOES.map((c) => <p key={c.v} className="mt-2 text-[12px] leading-snug"><b className="num">{c.rotulo}</b><br /><span className="text-ink-3">{c.det}</span></p>)}
          </div>
          <div className="bg-white p-4">
            <p className="font-display text-[15px] font-bold">Rai — coeficiente de ativação</p>
            <p className="mt-2 text-[12px]">Alto 2,0 · Médio 1,5 · Baixo 1,0, consoante o risco de ativação da atividade (quadro II).</p>
            <p className="mt-2 text-[12px] leading-snug text-ink-3">Várias atividades no mesmo compartimento (n.º 7.º, 3): a) o Rai da atividade de maior risco, se ocupar ≥ 10 % da área útil; b) caso contrário, a média dos Rai ponderada pelas áreas.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

function CompBloco({ c, set, remove }: { c: Compartimento; set: (fn: (c: Compartimento) => void) => void; remove: () => void }) {
  const r = cargaCompartimento(c);
  const [verQuadro, setVerQuadro] = useState(false);
  const [aviso, setAviso] = useState('');
  const pickHi = (i: number) => {
    const p = QUADRO_I_HI[i];
    set((x) => { x.itens.push({ id: uid(), produto: p.p, hi: p.h, massa: 0, ci: 1, rai: 1 }); });
    setAviso(`Adicionado «${p.p}» (Hi = ${fmt(p.h, 2)} MJ/kg). Preencha a massa na tabela abaixo.`);
  };
  const pickQ2 = (id: number, tipo: 'qs' | 'qv') => {
    const a = QUADRO_II.find((x) => x.id === id)!;
    if (tipo === 'qs') {
      set((x) => { x.atividades.push({ id: uid(), atividadeId: a.id, nome: a.a, qs: a.qs!, area: 0, ci: 1, rai: RAI[a.rs!] }); });
      setAviso(`Adicionada a atividade «${a.a}» (qsi = ${fmt(a.qs)} MJ/m²). Preencha a área Si nas zonas de atividade.`);
    } else {
      set((x) => { x.armazens.push({ id: uid(), atividadeId: a.id, nome: a.a, qv: a.qv!, altura: 0, area: 0, ci: 1, rai: RAI[a.rv!] }); });
      setAviso(`Adicionado o armazenamento «${a.a}» (qvi = ${fmt(a.qv)} MJ/m³). Preencha a altura hi e a área Si nas zonas de armazenamento.`);
    }
  };
  const locC = r.Qs > 20000 ? 'Qs > 20 000 MJ: se o espaço for local de risco C, é C agravado (art. 11.º n.º 3); com materiais facilmente inflamáveis é local C (art. 10.º n.º 3 n))' : r.Qs > 10000 ? 'Qs > 10 000 MJ: local de risco C se associado a materiais facilmente inflamáveis ou riscos de explosão (art. 10.º n.º 3 n))' : '';
  const somaZonas = [...c.atividades, ...c.armazens].reduce((s, z) => s + z.area, 0);
  return (
    <div className="border border-ink bg-white">
      <div className="grid items-end gap-3 border-b border-ink p-4 md:grid-cols-[1.5fr_0.8fr_1.4fr_auto]">
        <Field label="Compartimento corta-fogo"><Text value={c.nome} onChange={(v) => set((x) => { x.nome = v; })} /></Field>
        <Field label="Área útil S"><Num value={c.area} onChange={(v) => set((x) => { x.area = v; })} suffix="m²" /></Field>
        <div className="field">
          <span className="label">Método (n.º 2.º do Despacho)</span>
          <div className="grid grid-cols-2 border border-ink">
            {(['deterministico', 'probabilistico'] as const).map((m) => (
              <button key={m} className={`h-9 text-[12.5px] font-semibold ${c.metodo === m ? 'bg-ink text-white' : 'bg-white hover:bg-paper'}`} onClick={() => { set((x) => { x.metodo = m; }); setAviso(''); }}>
                {m === 'deterministico' ? 'Determinístico' : 'Probabilístico'}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-icon" onClick={() => confirm('Apagar este compartimento?') && remove()}><Trash2 size={15} /></button>
      </div>

      <div className="border-b border-ink bg-paper px-4 py-4">
        {c.metodo === 'deterministico' ? (
          <>
            <p className="font-display text-[16px] font-bold">Método determinístico — «sei o que lá está e quanto pesa»</p>
            <p className="mt-1 max-w-4xl text-[12.5px] leading-relaxed text-ink-2">Usa-se quando se conhecem os materiais combustíveis e as quantidades: inventário de stock, fichas técnicas, pesagens. Por cada material: massa Mi (kg), poder calorífico Hi (quadro I), coeficiente de combustibilidade Ci (n.º 6.º) e coeficiente de ativação Rai da atividade do compartimento (quadro II).</p>
            <p className="mt-2 font-mono text-[13px]">qs = Σ (Mi × Hi × Ci × Rai) / S <span className="font-sans text-[11px] text-ink-3">— n.º 3.º, 1, b) do Despacho</span></p>
          </>
        ) : (
          <>
            <p className="font-display text-[16px] font-bold">Método probabilístico — «sei a atividade e as áreas»</p>
            <p className="mt-1 max-w-4xl text-[12.5px] leading-relaxed text-ink-2">Usa-se quando não há inventário de massas, só a atividade e a área que ocupa. É o mais usado em projeto. Divide-se em dois tipos de zona:</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <p className="text-[12.5px]"><b>a) Zonas de fabrico ou reparação</b><br /><span className="font-mono text-[13px]">qs = Σ (qsi × Si × Ci × Rai) / S</span> <span className="text-[11px] text-ink-3">— n.º 3.º, 2, b1)</span></p>
              <p className="text-[12.5px]"><b>b) Zonas de armazenamento</b><br /><span className="font-mono text-[13px]">qs = Σ (qvi × hi × Si × Ci × Rai) / S</span> <span className="text-[11px] text-ink-3">— n.º 3.º, 2, b2)</span></p>
            </div>
          </>
        )}
        <button className={`${verQuadro ? 'btn-primary' : 'btn'} mt-3`} onClick={() => setVerQuadro((v) => !v)}>
          {verQuadro ? 'Ocultar' : 'Abrir'} {c.metodo === 'deterministico' ? 'quadro I — poder calorífico Hi' : 'quadro II — qsi, qvi e Rai por atividade'}
        </button>
        {verQuadro && (
          <div className="mt-3">
            <p className="mb-2 text-[12px] text-ink-2">{c.metodo === 'deterministico' ? 'Clique num produto para o adicionar como constituinte deste compartimento.' : 'Use «+ Atividade» (fabrico/reparação, qsi) ou «+ Armazém» (armazenamento, qvi) para adicionar a este compartimento.'}</p>
            {aviso && <p className="mb-2 text-[12.5px] font-semibold text-ok">✓ {aviso}</p>}
            {c.metodo === 'deterministico' ? <QuadroIView onPick={pickHi} /> : <QuadroIIView onPick={pickQ2} />}
          </div>
        )}
      </div>

      {c.metodo === 'deterministico' ? (
        <div className="p-4">
          <p className="label mb-2">Constituintes combustíveis (Mi, Hi, Ci, Rai)</p>
          <table className="tbl">
            <thead><tr><th>Constituinte (quadro I)</th><th className="w-[120px] text-right">Hi (MJ/kg)</th><th className="w-[130px] text-right">Massa Mi (kg)</th><th className="w-[170px]">Ci</th><th className="w-[160px]">Rai</th><th className="w-[130px] text-right">Mi·Hi·Ci·Rai</th><th className="w-8" /></tr></thead>
            <tbody>
              {c.itens.map((it, k) => (
                <tr key={it.id}>
                  <td>
                    <Combo items={ITENS_HI} value={it.produto} placeholder="Escolher produto ou escrever abaixo" onPick={(o) => set((x) => { const p = QUADRO_I_HI[o.key as number]; x.itens[k].produto = p.p; x.itens[k].hi = p.h; })} />
                    <input className="mt-1 w-full bg-transparent text-[11.5px] text-ink-3 outline-none" value={it.produto} placeholder="Designação livre (Hi por fonte fundamentada)" onChange={(e) => set((x) => { x.itens[k].produto = e.target.value; })} />
                  </td>
                  <td><Num value={it.hi} onChange={(v) => set((x) => { x.itens[k].hi = v; })} /></td>
                  <td><Num value={it.massa} onChange={(v) => set((x) => { x.itens[k].massa = v; })} /></td>
                  <td><Select value={it.ci} onChange={(v) => set((x) => { x.itens[k].ci = v; })} options={CI_OPTS} /></td>
                  <td><Select value={it.rai} onChange={(v) => set((x) => { x.itens[k].rai = v; })} options={RAI_OPTS} /></td>
                  <td className="num text-right font-semibold">{fmt(r.linhas[k]?.parcela)}</td>
                  <td><button className="btn-icon" onClick={() => set((x) => { x.itens.splice(k, 1); })}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn mt-3" onClick={() => set((x) => { x.itens.push({ id: uid(), produto: '', hi: 0, massa: 0, ci: 1, rai: 1 }); })}><Plus size={14} /> Constituinte</button>
          <p className="mt-3 text-[11.5px] text-ink-3">Rai «em função do tipo de atividade ou do armazenamento inerente ao compartimento» (n.º 3.º, 1): use o risco de ativação do quadro II da atividade do compartimento.</p>
        </div>
      ) : (
        <div className="p-4">
          <p className="label mb-2">Zonas de atividade — fabricação e reparação (qsi, Si, Ci, Rai)</p>
          <table className="tbl">
            <thead><tr><th>Atividade (quadro II)</th><th className="w-[110px] text-right">qsi (MJ/m²)</th><th className="w-[120px] text-right">Si (m²)</th><th className="w-[170px]">Ci</th><th className="w-[150px]">Rai</th><th className="w-[130px] text-right">Parcela (MJ)</th><th className="w-8" /></tr></thead>
            <tbody>
              {c.atividades.map((z, k) => (
                <tr key={z.id}>
                  <td><Combo items={ITENS_QS} value={z.nome} onPick={(o) => set((x) => { const a = QUADRO_II.find((y) => y.id === o.key)!; Object.assign(x.atividades[k], { atividadeId: a.id, nome: a.a, qs: a.qs!, rai: RAI[a.rs!] }); })} /></td>
                  <td><Num value={z.qs} onChange={(v) => set((x) => { x.atividades[k].qs = v; })} /></td>
                  <td><Num value={z.area} onChange={(v) => set((x) => { x.atividades[k].area = v; })} /></td>
                  <td><Select value={z.ci} onChange={(v) => set((x) => { x.atividades[k].ci = v; })} options={CI_OPTS} /></td>
                  <td><Select value={z.rai} onChange={(v) => set((x) => { x.atividades[k].rai = v; })} options={RAI_OPTS} /></td>
                  <td className="num text-right font-semibold">{fmt(r.linhas[k]?.parcela)}</td>
                  <td><button className="btn-icon" onClick={() => set((x) => { x.atividades.splice(k, 1); })}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn mt-3" onClick={() => set((x) => { x.atividades.push({ id: uid(), nome: '', qs: 0, area: 0, ci: 1, rai: 1 }); })}><Plus size={14} /> Zona de atividade</button>

          <p className="label mb-2 mt-6">Zonas de armazenamento (qvi, hi, Si, Ci, Rai)</p>
          <table className="tbl">
            <thead><tr><th>Armazenamento (quadro II)</th><th className="w-[110px] text-right">qvi (MJ/m³)</th><th className="w-[100px] text-right">hi (m)</th><th className="w-[110px] text-right">Si (m²)</th><th className="w-[160px]">Ci</th><th className="w-[140px]">Rai</th><th className="w-[120px] text-right">Parcela (MJ)</th><th className="w-8" /></tr></thead>
            <tbody>
              {c.armazens.map((z, k) => (
                <tr key={z.id}>
                  <td><Combo items={ITENS_QV} value={z.nome} onPick={(o) => set((x) => { const a = QUADRO_II.find((y) => y.id === o.key)!; Object.assign(x.armazens[k], { atividadeId: a.id, nome: a.a, qv: a.qv!, rai: RAI[a.rv!] }); })} /></td>
                  <td><Num value={z.qv} onChange={(v) => set((x) => { x.armazens[k].qv = v; })} /></td>
                  <td><Num value={z.altura} onChange={(v) => set((x) => { x.armazens[k].altura = v; })} /></td>
                  <td><Num value={z.area} onChange={(v) => set((x) => { x.armazens[k].area = v; })} /></td>
                  <td><Select value={z.ci} onChange={(v) => set((x) => { x.armazens[k].ci = v; })} options={CI_OPTS} /></td>
                  <td><Select value={z.rai} onChange={(v) => set((x) => { x.armazens[k].rai = v; })} options={RAI_OPTS} /></td>
                  <td className="num text-right font-semibold">{fmt(r.linhas[c.atividades.length + k]?.parcela)}</td>
                  <td><button className="btn-icon" onClick={() => set((x) => { x.armazens.splice(k, 1); })}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn mt-3" onClick={() => set((x) => { x.armazens.push({ id: uid(), nome: '', qv: 0, altura: 0, area: 0, ci: 1, rai: 1 }); })}><Plus size={14} /> Zona de armazenamento</button>

          <div className="mt-5">
            <Toggle checked={c.regraRai} onChange={(v) => set((x) => { x.regraRai = v; })} label="Aplicar o n.º 7.º, 3 (várias atividades no mesmo compartimento)" legal="Despacho 2074/2009, n.º 7.º, 3" hint={r.raiNota ?? 'Só atua com duas ou mais zonas: substitui os Rai individuais pelo Rai do compartimento.'} />
          </div>
          {c.area > 0 && somaZonas > c.area + 0.01 && <div className="mt-3"><Note tone="warn">A soma das áreas das zonas ({fmt(somaZonas, 1)} m²) excede a área útil do compartimento ({fmt(c.area, 1)} m²).</Note></div>}
        </div>
      )}

      <div className="grid gap-px border-t border-ink bg-ink md:grid-cols-[1fr_1fr_2fr]">
        <div className="bg-paper p-4"><p className="label">Qs — carga modificada</p><p className="mt-1 font-display text-[26px] font-extrabold num">{fmt(r.Qs)} <span className="font-mono text-[12px] text-ink-3">MJ</span></p></div>
        <div className="bg-ink p-4 text-white"><p className="label !text-white/60">qs — densidade modificada</p><p className="mt-1 font-display text-[26px] font-extrabold num">{fmt(r.qs, 1)} <span className="font-mono text-[12px] text-white/60">MJ/m²</span></p></div>
        <div className="bg-paper p-4 text-[12px] leading-snug">
          <p className="ref mb-1">qs = {fmt(r.Qs)} MJ / {fmt(c.area, 2)} m²</p>
          {locC && <p className="font-semibold text-fire">{locC}</p>}
          {c.area <= 0 && <p className="text-warn">Indique a área útil do compartimento.</p>}
        </div>
      </div>
    </div>
  );
}
