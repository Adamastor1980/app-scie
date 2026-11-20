import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { UTProps } from '../UTPage';
import { precisaCarga } from '../UTPage';
import type { Compartimento } from '../../data/types';
import { QUADRO_I_HI, QUADRO_II } from '../../data/despacho';
import { CI_OPCOES, RAI, RAI_NOME, cargaCompartimento, cargaUT, fmt } from '../../engine/calc';
import { Empty, Field, Note, Num, Section, Select, Stat, Text } from '../../ui/primitives';
import Combo from '../../ui/Combo';
import { novoCompartimento, uid } from '../../store';
import { QuadroIView, QuadroIIView } from '../Tabelas';

const CI_OPTS = CI_OPCOES.map((c) => ({ v: c.v, l: `${c.v.toFixed(2).replace('.', ',')} ${c.rotulo.split(' — ')[0].replace('Risco ', '')}` }));

const ITENS_HI = QUADRO_I_HI.map((p, i) => ({ key: i, label: p.p, right: `${fmt(p.h, 2)} MJ/kg` }));
const ITENS_HI_OUTRO = [...ITENS_HI, { key: -1, label: 'Outro material (não listado no quadro I)', right: 'Hi manual' }];
const ITENS_ALL = QUADRO_II.flatMap((a) => [
  ...(a.qs !== undefined ? [{ key: a.id * 2, label: `${a.a} — fabrico/reparação`, right: `Rai ${RAI_NOME[a.rs!].toLowerCase()}` }] : []),
  ...(a.qv !== undefined ? [{ key: a.id * 2 + 1, label: `${a.a} — armazenamento`, right: `Rai ${RAI_NOME[a.rv!].toLowerCase()}` }] : []),
]);
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

      <Section n="3.1" title="Compartimentos corta-fogo" sub="O Despacho manda calcular a carga de incêndio por compartimento corta-fogo (n.º 3.º): o espaço delimitado por paredes, pavimentos e portas resistentes ao fogo (ex.: um armazém separado da produção por parede corta-fogo). Se a UT não tiver compartimentação interior, é um único compartimento com a área útil total. Em cada um escolha o método." right={
        <button className="btn" title="Só para outro espaço separado por paredes e portas resistentes ao fogo" onClick={() => upU((u) => { u.compartimentos.push(novoCompartimento(u.compartimentos.length + 1)); })}><Plus size={15} /> Outro compartimento corta-fogo</button>
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
        <Field label="Área útil S do compartimento" hint="Indicada uma única vez: divide a soma de todos os materiais/zonas."><Num value={c.area} onChange={(v) => set((x) => { x.area = v; })} suffix="m²" /></Field>
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
            <p className="mt-1 max-w-4xl text-[12.5px] leading-relaxed text-ink-2">Usa-se quando se conhecem os materiais combustíveis e as quantidades: inventário de stock, fichas técnicas, pesagens. Preenche: 1) a atividade do compartimento, que dá o Rai (quadro II); 2) por cada material, o material (Hi automático do quadro I), a massa Mi em kg e o Ci (n.º 6.º).</p>
            <p className="mt-2 font-mono text-[13px]">qs = Σ (Mi × Hi × Ci × Rai) / S <span className="font-sans text-[11px] text-ink-3">— n.º 3.º, 1, b) do Despacho</span></p>
          </>
        ) : (
          <>
            <p className="font-display text-[16px] font-bold">Método probabilístico — «sei a atividade e as áreas»</p>
            <p className="mt-1 max-w-4xl text-[12.5px] leading-relaxed text-ink-2">Usa-se quando não há inventário de massas, só a atividade e a área que ocupa. É o mais usado em projeto. Preenche por zona a atividade (qsi/qvi e Rai automáticos do quadro II), a área Si, o Ci e, no armazenamento, a altura hi. Dois tipos de zona:</p>
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
          <div className="mb-5 grid items-end gap-3 md:grid-cols-[1.6fr_1fr]">
            <Field label="1. Atividade exercida no compartimento (quadro II) — define o Rai" legal="n.º 3.º, 1 e n.º 7.º">
              <Combo items={ITENS_ALL} value={ITENS_ALL.find((i) => i.key === c.atividadeDetId)?.label ?? ''} placeholder="Escolher a atividade do compartimento"
                onPick={(o) => set((x) => { const k = o.key as number; const a = QUADRO_II.find((y) => y.id === Math.floor(k / 2))!; x.atividadeDetId = k; x.raiDet = RAI[(k % 2 ? a.rv : a.rs)!]; })} />
            </Field>
            <div className={`flex h-9 items-center border px-3 text-[13px] ${c.raiDet ? 'border-ink bg-white' : 'border-warn bg-warn-soft'}`}>
              {c.raiDet ? <>Rai = <b className="num mx-1">{fmt(c.raiDet, 1)}</b> ({RAI_NOME[c.raiDet === 2 ? 'A' : c.raiDet === 1.5 ? 'M' : 'B']}) — aplicado a todos os materiais</> : 'Escolha a atividade para obter o Rai'}
            </div>
          </div>
          <p className="-mt-3 mb-5 text-[11.5px] text-ink-3">A atividade escolhida serve <b>apenas para obter o Rai</b>. Não soma carga de incêndio: o qsi/qvi do quadro II não entra no método determinístico. A carga resulta só dos materiais da tabela abaixo (Mi × Hi × Ci × Rai).</p>
          <p className="label mb-2">2. Materiais combustíveis — material, massa e Ci</p>
          <table className="tbl">
            <thead><tr><th>Material (quadro I)</th><th className="w-[120px] text-right">Hi (MJ/kg)</th><th className="w-[170px] text-right">Massa Mi (kg ou litros)</th><th className="w-[150px]">Ci</th><th className="w-[140px] text-right">Mi·Hi·Ci·Rai (MJ)</th><th className="w-8" /></tr></thead>
            <tbody>
              {c.itens.map((it, k) => {
                const doQuadro = QUADRO_I_HI.some((p) => p.p === it.produto && p.h === it.hi);
                return (
                  <tr key={it.id}>
                    <td>
                      <Combo items={ITENS_HI_OUTRO} value={it.produto} placeholder="Escolher material" onPick={(o) => set((x) => {
                        if (o.key === -1) { x.itens[k].produto = ''; x.itens[k].hi = 0; return; }
                        const p = QUADRO_I_HI[o.key as number]; x.itens[k].produto = p.p; x.itens[k].hi = p.h;
                      })} />
                      {!doQuadro && <input className="input mt-1 h-8 text-[12px]" value={it.produto} placeholder="Material não listado: designação (Hi de fonte fundamentada)" onChange={(e) => set((x) => { x.itens[k].produto = e.target.value; })} />}
                    </td>
                    <td>{doQuadro ? <span className="num block pr-2.5 pt-2 text-right">{fmt(it.hi, 2)}</span> : <Num value={it.hi} onChange={(v) => set((x) => { x.itens[k].hi = v; })} />}</td>
                    <td>
                      <div className="mb-1 grid grid-cols-2 border border-ink text-[11px] font-semibold">
                        <button className={`h-6 ${!it.emLitros ? 'bg-ink text-white' : 'bg-white'}`} onClick={() => set((x) => { x.itens[k].emLitros = false; })}>kg</button>
                        <button className={`h-6 ${it.emLitros ? 'bg-ink text-white' : 'bg-white'}`} onClick={() => set((x) => { x.itens[k].emLitros = true; })}>litros</button>
                      </div>
                      {!it.emLitros ? (
                        <Num value={it.massa} onChange={(v) => set((x) => { x.itens[k].massa = v; })} suffix="kg" />
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Num value={it.litros} onChange={(v) => set((x) => { const y = x.itens[k]; y.litros = v; y.massa = v * (y.densidade ?? 0); })} suffix="L" />
                          <Num value={it.densidade} onChange={(v) => set((x) => { const y = x.itens[k]; y.densidade = v; y.massa = (y.litros ?? 0) * v; })} suffix="kg/L" placeholder="FDS secç. 9" />
                          <input className="input h-7 text-[11px]" value={it.fonteDensidade ?? ''} placeholder="fonte: FDS do produto, secção 9" onChange={(e) => set((x) => { x.itens[k].fonteDensidade = e.target.value; })} />
                          <span className="num text-right text-[11px] text-ink-3">= {fmt(it.massa, 1)} kg</span>
                        </div>
                      )}
                    </td>
                    <td><Select value={it.ci} onChange={(v) => set((x) => { x.itens[k].ci = v; })} options={CI_OPTS} /></td>
                    <td className="num pt-4 text-right font-semibold">{fmt(r.linhas[k]?.parcela)}</td>
                    <td><button className="btn-icon" onClick={() => set((x) => { x.itens.splice(k, 1); })}><Trash2 size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button className="btn-fire mt-3" onClick={() => set((x) => { x.itens.push({ id: uid(), produto: '', hi: 0, massa: 0, ci: 1, rai: 1 }); })}><Plus size={14} /> Adicionar material a este compartimento</button>
          <p className="mt-2 text-[11.5px] text-ink-3">Cada material leva só a massa (em kg, ou em litros × densidade para líquidos, com a densidade da FDS): não tem área própria. Todos os materiais deste compartimento são somados e divididos pela área útil S indicada no topo.</p>
        </div>
      ) : (
        <div className="p-4">
          <p className="label mb-2">Zonas do compartimento — para cada zona escolha se é de fabrico/reparação ou de armazenamento</p>
          <table className="tbl">
            <thead><tr><th className="w-[200px]">Tipo de zona</th><th>Atividade / produto (quadro II)</th><th className="w-[100px] text-right">qsi / qvi</th><th className="w-[110px] text-right">Altura hi (m)</th><th className="w-[120px] text-right">Área Si (m²)</th><th className="w-[145px]">Ci</th><th className="w-[70px] text-right">Rai</th><th className="w-[120px] text-right">Parcela (MJ)</th><th className="w-8" /></tr></thead>
            <tbody>
              {c.atividades.map((z, k) => (
                <tr key={z.id}>
                  <td><Select value="f" onChange={(v) => v === 'a' && set((x) => { const [o] = x.atividades.splice(k, 1); x.armazens.push({ id: o.id, nome: '', qv: 0, altura: 0, area: o.area, ci: o.ci, rai: 1 }); })} options={[{ v: 'f', l: 'Fabrico/reparação' }, { v: 'a', l: 'Armazenamento' }]} /></td>
                  <td><Combo items={ITENS_QS} value={z.nome} placeholder="Escolher atividade de fabrico/reparação" onPick={(o) => set((x) => { const a = QUADRO_II.find((y) => y.id === o.key)!; Object.assign(x.atividades[k], { atividadeId: a.id, nome: a.a, qs: a.qs!, rai: RAI[a.rs!] }); })} /></td>
                  <td className="num pt-4 text-right">{z.qs ? <>{fmt(z.qs)}<span className="block text-[10px] text-ink-4">MJ/m²</span></> : '—'}</td>
                  <td className="pt-4 text-right text-[11px] text-ink-4">não se aplica</td>
                  <td><Num value={z.area} onChange={(v) => set((x) => { x.atividades[k].area = v; })} /></td>
                  <td><Select value={z.ci} onChange={(v) => set((x) => { x.atividades[k].ci = v; })} options={CI_OPTS} /></td>
                  <td className="num pt-4 text-right">{fmt(r.raiAplicado ?? z.rai, r.raiAplicado ? 3 : 1)}</td>
                  <td className="num pt-4 text-right font-semibold">{fmt(r.linhas[k]?.parcela)}</td>
                  <td><button className="btn-icon" onClick={() => set((x) => { x.atividades.splice(k, 1); })}><Trash2 size={13} /></button></td>
                </tr>
              ))}
              {c.armazens.map((z, k) => (
                <tr key={z.id}>
                  <td><Select value="a" onChange={(v) => v === 'f' && set((x) => { const [o] = x.armazens.splice(k, 1); x.atividades.push({ id: o.id, nome: '', qs: 0, area: o.area, ci: o.ci, rai: 1 }); })} options={[{ v: 'f', l: 'Fabrico/reparação' }, { v: 'a', l: 'Armazenamento' }]} /></td>
                  <td><Combo items={ITENS_QV} value={z.nome} placeholder="Escolher produto armazenado" onPick={(o) => set((x) => { const a = QUADRO_II.find((y) => y.id === o.key)!; Object.assign(x.armazens[k], { atividadeId: a.id, nome: a.a, qv: a.qv!, rai: RAI[a.rv!] }); })} /></td>
                  <td className="num pt-4 text-right">{z.qv ? <>{fmt(z.qv)}<span className="block text-[10px] text-ink-4">MJ/m³</span></> : '—'}</td>
                  <td><Num value={z.altura} onChange={(v) => set((x) => { x.armazens[k].altura = v; })} /></td>
                  <td><Num value={z.area} onChange={(v) => set((x) => { x.armazens[k].area = v; })} /></td>
                  <td><Select value={z.ci} onChange={(v) => set((x) => { x.armazens[k].ci = v; })} options={CI_OPTS} /></td>
                  <td className="num pt-4 text-right">{fmt(r.raiAplicado ?? z.rai, r.raiAplicado ? 3 : 1)}</td>
                  <td className="num pt-4 text-right font-semibold">{fmt(r.linhas[c.atividades.length + k]?.parcela)}</td>
                  <td><button className="btn-icon" onClick={() => set((x) => { x.armazens.splice(k, 1); })}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex gap-2">
            <button className="btn-fire" onClick={() => set((x) => { x.armazens.push({ id: uid(), nome: '', qv: 0, altura: 0, area: 0, ci: 1, rai: 1 }); })}><Plus size={14} /> Zona de armazenamento</button>
            <button className="btn-fire" onClick={() => set((x) => { x.atividades.push({ id: uid(), nome: '', qs: 0, area: 0, ci: 1, rai: 1 }); })}><Plus size={14} /> Zona de fabrico/reparação</button>
          </div>
          {c.armazens.some((z) => !z.altura) && <div className="mt-3"><Note tone="warn">Há zonas de armazenamento sem altura de armazenagem hi: a parcela dessa zona fica a zero até a preencher.</Note></div>}
          <p className="mt-3 text-[11.5px] text-ink-3"><b>Fabrico/reparação:</b> qsi (MJ/m²) × Si × Ci × Rai — sem altura. <b>Armazenamento:</b> qvi (MJ/m³) × hi × Si × Ci × Rai — a altura de armazenagem é obrigatória. Cada lista mostra apenas as atividades que têm valor na respetiva coluna do quadro II (ex.: «Alimentação, expedição» só tem valor de fabrico).</p>
          <p className="mt-4 text-[11.5px] text-ink-3">qsi, qvi e Rai são lidos do quadro II quando escolhe a atividade.{r.raiNota ? ' Várias zonas no compartimento — ' + r.raiNota : ''}</p>
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
