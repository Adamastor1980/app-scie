import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import type { UTProps } from '../UTPage';
import type { AgenteExtintor, ExtintoresUT, Piso } from '../../data/types';
import { CAPACIDADES, CONVERSAO, UNIDADE, dimensionarExtintores, litrosEquivalentes } from '../../engine/extintores';
import { classificar, fmt, numPiso, pisosUT, rotuloPiso } from '../../engine/calc';
import { Faltas, Num, Section, Toggle } from '../../ui/primitives';
import { novoPiso, uid } from '../../store';
import TextoLei, { refsDeBase } from '../../ui/TextoLei';

const OPCOES = Array.from({ length: 51 }, (_, k) => 40 - k);
const opcoesExt = (soPo: boolean) => (['agua', 'po'] as AgenteExtintor[]).filter((a) => !soPo || a === 'po').flatMap((a) => CAPACIDADES[a].map((c) => ({
  v: `${a}:${c}`, l: `${a === 'agua' ? 'Água' : 'Pó ABC'} ${c} ${UNIDADE[a]}${a === 'po' ? ` (= ${litrosEquivalentes(a, c)} L de água)` : ''}`,
})));

/** Passo «Extintores» da UT: dimensionamento pelo RT-SCIE, art. 163.º, e condições específicas. A app propõe; o técnico só muda se quiser. */
export default function UTExtintores({ ut, upU }: UTProps) {
  const cls = classificar(ut);
  const r = dimensionarExtintores(ut, cls.cat);
  const [lei, setLei] = useState<string | null>(null);
  const t = ut.tipo;
  const x = ut.extintores ?? {};
  const upX = (fn: (x: ExtintoresUT) => void) => upU((u) => { u.extintores ??= {}; fn(u.extintores); });
  const setPiso = (n: number, fn: (o: { agente?: AgenteExtintor; cap?: number; qtd?: number }) => void) => upX((e) => { e.pisos ??= {}; const o = { ...(e.pisos[String(n)] ?? {}) }; fn(o); e.pisos[String(n)] = o; });
  const setArea = (n: number, v: number) => upU((u) => {
    let l = u.pisos.find((p) => numPiso(p) === n);
    if (!l) { l = { ...novoPiso(n), n, nome: rotuloPiso(n), cota: 0 } as Piso; u.pisos.push(l); }
    l.area = v;
  });
  const comEspacos = new Set(pisosUT(ut).filter((q) => q.comEspacos).map((q) => q.n));
  const apagar = (n: number) => {
    if (!confirm(`Apagar o ${rotuloPiso(n)}? A área e a escolha de extintores deste piso são apagadas.`)) return;
    upU((u) => {
      u.pisos = u.pisos.filter((q) => numPiso(q) !== n);
      if (u.extintores?.pisos) delete u.extintores.pisos[String(n)];
      u.pisosTecnicos = (u.pisosTecnicos ?? []).filter((q) => q !== n);
    });
  };
  const ApagarPiso = ({ n, className = '' }: { n: number; className?: string }) => comEspacos.has(n)
    ? <button className={`btn-icon items-center text-ink-4 ${className}`} title="Piso com espaços registados" onClick={() => alert(`O ${rotuloPiso(n)} tem espaços registados no passo «Efetivo». Para o retirar, mude o piso desses espaços ou apague-os.`)}><Trash2 size={15} /></button>
    : <button className={`btn-icon items-center ${className}`} title={`Apagar ${rotuloPiso(n)}`} onClick={() => apagar(n)}><Trash2 size={15} /></button>;
  // UT sem pisos (ex.: projeto «só extintores», sem espaços): começa com o Piso 0 pronto a receber a área
  const semPisos = r.geral && r.pisos.length === 0;
  useEffect(() => { if (semPisos) setArea(0, 0); }, [semPisos]); // eslint-disable-line react-hooks/exhaustive-deps
  const livres = OPCOES.filter((o) => !r.pisos.some((p) => p.n === o));
  const soPo = t === 8 && x.gare === 'eletrica';
  const Lei = ({ b }: { b: string }) => <button className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-fire-ink hover:underline" onClick={() => setLei(b)}><BookOpen size={12} /> Ver lei</button>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
        <div>
          <p className="label !text-fire-ink">Dimensionamento de extintores</p>
          <p className="mt-1 text-[13.5px] text-ink-2">{r.motivo}</p>
        </div>
        <Lei b="RT-SCIE, art. 163.º; anexo I, art. 8.º" />
      </div>

      {r.geral && (
        <Section n="A" title="Extintores por piso" sub="A app propõe a quantidade que cumpre os dois critérios do art. 163.º n.º 2: a) 18 L de água por 500 m² ou fração e b) 1 extintor por 200 m² ou fração, mínimo 2. Só altere se quiser outra solução.">
          <div className="border border-ink bg-white">
            <div className="hidden grid-cols-[90px_110px_1fr_210px_100px_120px] gap-3 border-b border-ink bg-paper px-4 py-2 font-mono text-[10.5px] uppercase tracking-wide text-ink-3 md:grid">
              <span>Piso</span><span>Área (m²)</span><span>Exigido</span><span>Extintor</span><span>Quantidade</span><span>Resultado</span><span />
            </div>
            {r.pisos.map((p) => (
              <div key={p.n} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 border-b border-paper-3 px-4 py-3 last:border-0 md:grid-cols-[90px_110px_1fr_210px_100px_120px_32px]">
                <span className="flex items-center justify-between font-semibold md:block">{p.nome}
                  <ApagarPiso className="md:hidden" n={p.n} />
                </span>
                <label className={`flex items-center gap-2 ${p.area > 0 ? '' : 'falta'}`}><span className="text-[11px] text-ink-3 md:hidden">Área</span><Num value={p.area} onChange={(v) => setArea(p.n, v)} suffix="m²" /></label>
                <span className="col-span-2 text-[12.5px] md:col-span-1">{p.area > 0 ? <>Exigido: mín. <b>{p.minN}</b> extintores e <b>{p.litros} L</b> de água</> : <span className="text-alerta">Falta preencher: área do piso (para calcular)</span>}</span>
                <select className="input col-span-2 h-10 py-0 text-[13px] md:col-span-1" value={`${p.agente}:${p.cap}`} onChange={(e) => { const [a, c] = e.target.value.split(':'); setPiso(p.n, (o) => { o.agente = a as AgenteExtintor; o.cap = Number(c); delete o.qtd; }); }}>
                  {opcoesExt(soPo).map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                <div>
                  <label className="flex items-center gap-2"><span className="text-[11px] text-ink-3 md:hidden">Quantidade</span><Num value={p.qtd} onChange={(v) => setPiso(p.n, (o) => { if (!v || v === p.proposta) delete o.qtd; else o.qtd = Math.round(v); })} /></label>
                  {x.pisos?.[String(p.n)]?.qtd !== undefined && <button className="mt-0.5 block text-[11px] text-fire-ink hover:underline" onClick={() => setPiso(p.n, (o) => { delete o.qtd; })}>repor proposta ({p.proposta})</button>}
                </div>
                <span className={`text-[12.5px] font-semibold ${p.area > 0 ? (p.cumpre ? 'text-ok' : 'text-alerta') : 'text-ink-3'}`}>
                  {p.area > 0 ? <>{p.cumpre ? '✔ Cumpre' : '✗ Insuficiente'}<span className="block text-[11px] font-normal text-ink-3">{fmt(p.totalL)} L equivalentes</span></> : '—'}
                </span>
                <ApagarPiso className="hidden md:flex" n={p.n} />
              </div>
            ))}
          </div>
          {r.pisos.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px]">
              {(() => { const prox = Math.max(...r.pisos.map((p) => p.n)) + 1; return livres.includes(prox) && <button className="btn h-10 px-4" onClick={() => setArea(prox, 0)}><Plus size={15} /> Acrescentar {rotuloPiso(prox)}</button>; })()}
              <select className="input h-10 w-auto py-0 text-[12.5px]" value="" onChange={(e) => { if (e.target.value !== '') setArea(Number(e.target.value), 0); }}>
                <option value="">Outro piso (ex.: cave)…</option>
                {livres.map((o) => <option key={o} value={o}>{rotuloPiso(o)}</option>)}
              </select>
            </div>
          )}
          <p className="mt-2 text-[11.5px] text-ink-3">{CONVERSAO.po.texto} — {CONVERSAO.fonte}.</p>
        </Section>
      )}

      <Section n={r.geral ? 'B' : 'A'} title="Situações com extintores próprios" sub="Responda só ao que existe nesta UT. Cada resposta acrescenta o que a lei exige.">
        <div className="mb-4 border border-paper-3 bg-white p-3">
          <p className="mb-2 text-[12.5px] font-semibold">Locais de risco C ou F (art. 163.º n.º 4{ut.arLivre ? '; ao ar livre só C, n.º 8' : ''})</p>
          {ut.espacos.filter((e) => ['C', 'Cag', 'F'].includes(e.local)).map((e) => <p key={e.id} className="text-[12.5px] text-ink-2">• {e.nome || 'espaço'} — local {e.local === 'Cag' ? 'C agravado' : e.local} <span className="ref">(dos espaços)</span></p>)}
          {(x.locais ?? []).map((l, i) => (
            <div key={l.id} className="mt-1 flex flex-wrap items-center gap-2">
              <input className="input h-9 max-w-[260px] py-0" placeholder="Nome do local (ex.: cozinha, quadro elétrico)" value={l.nome} onChange={(e) => upX((z) => { z.locais![i].nome = e.target.value; })} />
              <select className="input h-9 w-auto py-0" value={l.tipo} onChange={(e) => upX((z) => { z.locais![i].tipo = e.target.value as 'C' | 'F'; })}><option value="C">Local C</option><option value="F">Local F</option></select>
              <button className="btn-icon" onClick={() => upX((z) => { z.locais = z.locais!.filter((_, k) => k !== i); })}><Trash2 size={14} /></button>
            </div>
          ))}
          <button className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-fire-ink hover:underline" onClick={() => upX((z) => { (z.locais ??= []).push({ id: uid(), nome: '', tipo: 'C' }); })}><Plus size={13} /> Acrescentar local C ou F</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle checked={!!(ut.temCozinhaC || ut.factos?.cozinha)} onChange={(v) => upU((u) => { u.factos ??= {}; u.factos.cozinha = v; if (!v) u.temCozinhaC = false; })} label="Cozinha ou laboratório (local C)" legal="RT-SCIE, art. 163.º n.º 5" />
          <div className="border border-paper-3 bg-white p-3">
            <p className="mb-1.5 text-[13px] font-semibold">Central térmica com mais de 70 kW</p>
            <select className="input h-9 py-0" value={x.combustivelCT ?? ''} onChange={(e) => upX((z) => { z.combustivelCT = (e.target.value || undefined) as ExtintoresUT['combustivelCT']; })}>
              <option value="">{ut.factos?.centralTermica ? 'Indique…' : 'Não'}</option><option value="nao">Não</option><option value="solido_liquido">Sim — combustível sólido ou líquido</option><option value="gas">Sim — gás</option>
            </select>
            {x.combustivelCT === 'solido_liquido' && <label className="mt-2 flex items-center gap-2 text-[12.5px]">N.º de queimadores <Num value={x.queimadores ?? 1} onChange={(v) => upX((z) => { z.queimadores = Math.max(1, Math.round(v)); })} className="w-20" /></label>}
            <p className="ref mt-1">RT-SCIE, art. 163.º n.º 6</p>
          </div>
          {(t === 6 || t === 9) && <Toggle checked={!!ut.factos?.tendas} onChange={(v) => upU((u) => { u.factos ??= {}; u.factos.tendas = v; })} label="Recinto em tenda ou estrutura insuflável" legal="RT-SCIE, art. 163.º n.º 7" />}
          {t === 1 && <>
            <Toggle checked={!!x.arrecadacoes} onChange={(v) => upX((z) => { z.arrecadacoes = v; })} label="Agrupamento de arrecadações de condóminos" legal="RT-SCIE, art. 209.º n.º 14" />
            <Toggle checked={!!x.salaCondominio} onChange={(v) => upX((z) => { z.salaCondominio = v; })} label="Sala de condomínio" legal="RT-SCIE, art. 210.º n.º 6" />
            <Toggle checked={!!x.estacionamento} onChange={(v) => upX((z) => { z.estacionamento = v; })} label="Estacionamento coberto" legal="RT-SCIE, art. 211.º n.º 4" />
          </>}
          {t === 2 && !ut.arLivre && <Toggle checked={!!ut.parqueAutomatico} onChange={(v) => upU((u) => { u.parqueAutomatico = v; })} label="Parque automático" legal="RT-SCIE, art. 226.º n.º 1" />}
          {t === 8 && (
            <div className="border border-paper-3 bg-white p-3">
              <p className="mb-1.5 text-[13px] font-semibold">Gare com plataformas de embarque</p>
              <select className="input h-9 py-0" value={x.gare ?? 'nao'} onChange={(e) => upX((z) => { z.gare = e.target.value as ExtintoresUT['gare']; })}>
                <option value="nao">Não</option><option value="sim">Sim</option><option value="eletrica">Sim — transporte ferroviário com tração elétrica</option>
              </select>
              <p className="ref mt-1">RT-SCIE, art. 273.º</p>
            </div>
          )}
          {t === 9 && <label className="flex flex-col gap-1 border border-paper-3 bg-white p-3 text-[13px] font-semibold">Parque de campismo — n.º de setores <Num value={x.setores ?? 0} onChange={(v) => upX((z) => { z.setores = Math.max(0, Math.round(v)) || undefined; })} className="w-24" /><span className="ref font-normal">RT-SCIE, art. 286.º (0 se não for parque de campismo)</span></label>}
          {t === 12 && <>
            <label className="flex flex-col gap-1 border border-paper-3 bg-white p-3 text-[13px] font-semibold">Combustíveis líquidos armazenados (l) <Num value={ut.liquidosInflamaveisL ?? 0} onChange={(v) => upU((u) => { u.liquidosInflamaveisL = v || undefined; })} className="w-32" /><span className="ref font-normal">RT-SCIE, art. 307.º</span></label>
            {(ut.liquidosInflamaveisL ?? 0) > 0 && <Toggle checked={!!x.metalicos} onChange={(v) => upX((z) => { z.metalicos = v; })} label="Mais de metade em recipientes metálicos estanques" legal="RT-SCIE, art. 307.º n.º 2" />}
          </>}
        </div>
        {r.extras.length > 0 && (
          <ul className="mt-4 border border-ink bg-white">
            {r.extras.map((e, i) => <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-paper-3 px-4 py-2.5 text-[13px] last:border-0"><span>{e.texto}</span><span className="flex items-center gap-3"><span className="ref">{e.base}</span><Lei b={e.base} /></span></li>)}
          </ul>
        )}
      </Section>

      <Section n={r.geral ? 'C' : 'B'} title="Complemento: extintores de CO₂ (opcional)" sub="Para quadros elétricos ou locais técnicos. Não contam para os 18 L de água: o CO₂ não tem eficácia em fogos da classe A (sólidos).">
        {(x.co2 ?? []).map((k, i) => (
          <div key={k.id} className="mb-1.5 flex flex-wrap items-center gap-2 text-[12.5px]">
            <input className="input h-9 max-w-[240px] py-0" placeholder="Local (ex.: quadro elétrico do piso 0)" value={k.local} onChange={(e) => upX((z) => { z.co2![i].local = e.target.value; })} />
            <select className="input h-9 w-auto py-0" value={k.kg} onChange={(e) => upX((z) => { z.co2![i].kg = Number(e.target.value); })}>{[2, 5].map((v) => <option key={v} value={v}>CO₂ {v} kg</option>)}</select>
            <span className="flex items-center gap-1">× <Num value={k.qtd} onChange={(v) => upX((z) => { z.co2![i].qtd = Math.max(1, Math.round(v)); })} className="w-16" /></span>
            <span className="text-ink-3">≈ {fmt(k.kg / CONVERSAO.co2.fator, 1)} L de água cada</span>
            <button className="btn-icon" onClick={() => upX((z) => { z.co2 = z.co2!.filter((_, j) => j !== i); })}><Trash2 size={14} /></button>
          </div>
        ))}
        <button className="flex items-center gap-1 text-[12px] font-semibold text-fire-ink hover:underline" onClick={() => upX((z) => { (z.co2 ??= []).push({ id: uid(), local: '', kg: 5, qtd: 1 }); })}><Plus size={13} /> Acrescentar extintor de CO₂</button>
        <p className="mt-2 text-[11.5px] text-ink-3">{CONVERSAO.co2.texto} — {CONVERSAO.fonte}.</p>
      </Section>

      {r.totais.length > 0 && (
        <div className="mb-6 border-l-[3px] border-fire bg-fire-soft px-4 py-3">
          <p className="mb-1 text-[12.5px] font-semibold">Resultado — extintores portáteis desta UT</p>
          <p className="text-[13.5px]">{r.totais.map((x2) => `${x2.qtd} × ${x2.descricao}`).join(' · ')}{r.extras.some((e) => e.qtd) ? ' · mais os das situações acima' : ''}</p>
        </div>
      )}
      <Faltas itens={r.falta.map((f) => { const [a, b] = f.split(' — '); return [a, b ?? ''] as [string, string]; })} />
      {lei && <TextoLei refs={refsDeBase(lei)} titulo="Extintores" onFechar={() => setLei(null)} />}
    </div>
  );
}

