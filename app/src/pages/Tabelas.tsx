import { useMemo, useState } from 'react';
import { QUADRO_I_HI, QUADRO_II } from '../data/despacho';
import { DIPLOMAS, NOTA_PISOS_TECNICOS, ROMANO, UTS } from '../data/rjscie';
import { ENVOLVENTE_LOCAIS, QUADRO_XXV, QUADRO_XXVII, QUADRO_XXXVI, QUADRO_XXXVII, quadroIX, quadroX, quadroXI } from '../data/rtscie';
import { classificar, fmt, RAI, RAI_NOME } from '../engine/calc';
import { novaUT } from '../store';
import QuadroAnexo from './ut/QuadroAnexo';
import type { UTNum } from '../data/types';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function QuadroIView({ onPick }: { onPick?: (i: number) => void } = {}) {
  const [q, setQ] = useState('');
  const l = QUADRO_I_HI.filter((p) => norm(p.p).includes(norm(q)));
  return (
    <div className="border border-ink bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-ink bg-ink px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-white">Despacho 2074/2009 · Quadro I — poder calorífico inferior Hi ({QUADRO_I_HI.length})</span>
        <input className="h-7 w-56 border-0 bg-white/10 px-2 text-[12px] text-white outline-none placeholder:text-white/50" placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid max-h-[460px] overflow-y-auto md:grid-cols-3">
        {l.map((p, i) => onPick ? (
          <button key={i} onClick={() => onPick(QUADRO_I_HI.indexOf(p))} className="group flex justify-between gap-2 border-b border-r border-paper-3 px-3 py-1.5 text-left text-[12.5px] hover:bg-ink hover:text-white" title="Adicionar como constituinte">
            <span><span className="mr-1.5 font-mono text-fire-ink">+</span>{p.p}</span><span className="num font-semibold">{fmt(p.h, 2)}</span>
          </button>
        ) : (
          <div key={i} className="flex justify-between gap-2 border-b border-r border-paper-3 px-3 py-1.5 text-[12.5px]"><span>{p.p}</span><span className="num font-semibold">{fmt(p.h, 2)}</span></div>
        ))}
      </div>
      <p className="border-t border-paper-3 px-3 py-2 text-[11px] text-ink-3">Valores em MJ/kg. 1 kcal = 4,18 × 10⁻³ MJ. Transcrição integral do quadro I, incluindo as entradas repetidas do diploma.</p>
    </div>
  );
}

export function QuadroIIView({ onPick }: { onPick?: (id: number, tipo: 'qs' | 'qv') => void } = {}) {
  const [q, setQ] = useState('');
  const l = useMemo(() => QUADRO_II.filter((a) => norm(a.a).includes(norm(q))), [q]);
  return (
    <div className="border border-ink bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-ink bg-ink px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-white">Despacho 2074/2009 · Quadro II — qsi, qvi e Rai ({QUADRO_II.length} atividades)</span>
        <input className="h-7 w-56 border-0 bg-white/10 px-2 text-[12px] text-white outline-none placeholder:text-white/50" placeholder="Pesquisar atividade…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        <table className="tbl">
          <thead className="sticky top-0"><tr><th>Atividade</th><th className="text-right">qsi (MJ/m²)</th><th>Rai</th><th className="text-right">qvi (MJ/m³)</th><th>Rai</th>{onPick && <th>Adicionar</th>}</tr></thead>
          <tbody>
            {l.map((a) => (
              <tr key={a.id}>
                <td>{a.a}</td>
                <td className="num text-right">{a.qs ? fmt(a.qs) : ''}</td>
                <td className="text-ink-3">{a.rs ? `${RAI_NOME[a.rs]} (${RAI[a.rs].toFixed(1).replace('.', ',')})` : ''}</td>
                <td className="num text-right">{a.qv ? fmt(a.qv) : ''}</td>
                <td className="text-ink-3">{a.rv ? `${RAI_NOME[a.rv]} (${RAI[a.rv].toFixed(1).replace('.', ',')})` : ''}</td>
                {onPick && (
                  <td className="whitespace-nowrap">
                    {a.qs !== undefined && <button className="btn h-7 px-2 text-[11.5px]" onClick={() => onPick(a.id, 'qs')}>+ Atividade</button>}
                    {a.qv !== undefined && <button className="btn ml-1 h-7 px-2 text-[11.5px]" onClick={() => onPick(a.id, 'qv')}>+ Armazém</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-paper-3 px-3 py-2 text-[11px] text-ink-3">Colunas «Fabricação e reparação» (qsi) e «Armazenamento» (qvi) extraídas do PDF oficial preservando as colunas. Rai: alto 2,0; médio 1,5; baixo 1,0 (n.º 7.º, 2).</p>
    </div>
  );
}

const TABS = ['Anexo III — categorias', 'Efetivo', 'Carga de incêndio', 'Resistência e compartimentação', 'Equipamentos e autoproteção', 'Diplomas'] as const;

export default function Tabelas() {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
      <p className="label !text-fire-ink">Biblioteca</p>
      <h1 className="h-display mb-6 mt-2 text-[48px]">Tabelas legais</h1>
      <div className="mb-8 flex flex-wrap gap-px border border-ink bg-ink">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 px-4 py-3 text-[13px] font-semibold ${tab === t ? 'bg-ink text-white' : 'bg-white hover:bg-paper'}`}>{t}</button>
        ))}
      </div>

      {tab === TABS[0] && (
        <div className="flex flex-col gap-6">
          {UTS.flatMap((u) => {
            const variants: { ar: boolean; label: string }[] = [{ ar: false, label: [2, 6, 9, 12].includes(u.n) ? 'integrada em edifício' : '' }];
            if ([6, 9, 12].includes(u.n)) variants.push({ ar: true, label: 'ao ar livre' });
            return variants.map((v) => {
              const ut = novaUT(u.n as UTNum);
              ut.arLivre = v.ar;
              if (u.n === 4 || u.n === 5) ut.espacos = [{ id: 'x', nome: '', piso: '', local: 'D', criterio: 'lugares', n: 0 }];
              if (u.n === 7) ut.espacos = [{ id: 'x', nome: '', piso: '', local: 'E', criterio: 'lugares', n: 0 }];
              const c = classificar(ut);
              return <QuadroAnexo key={u.n + String(v.ar)} c={c} mostrarValores={false} titulo={`${u.quadro} — UT ${ROMANO[u.n]} «${u.nome}»${v.label ? ' · ' + v.label : ''}`} />;
            });
          })}
          <p className="text-[12px] text-ink-3">{NOTA_PISOS_TECNICOS} Notas: UT IV sem locais D ou E — limites do efetivo das 2.ª e 3.ª categorias +50 %; UT XI e XII exclusivamente armazéns — limites da densidade de carga ×10; UT II ao ar livre — sempre 1.ª categoria.</p>
        </div>
      )}

      {tab === TABS[1] && (
        <div className="flex flex-col gap-6">
          <div className="border border-ink bg-white">
            <div className="border-b border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white">RT-SCIE · Quadro XXVII — ocupantes por unidade de área (art. 51.º n.º 3)</div>
            <table className="tbl"><thead><tr><th>Espaços</th><th className="text-right">pessoas/m²</th></tr></thead>
              <tbody>{QUADRO_XXVII.map((q) => <tr key={q.id}><td>{q.espaco}</td><td className="num text-right">{q.indice.toFixed(2).replace('.', ',')}</td></tr>)}</tbody></table>
          </div>
          <div className="grid gap-px border border-ink bg-ink md:grid-cols-2">
            <div className="bg-white p-4 text-[13px]"><p className="label mb-2">Quadro XXVI — apartamentos turísticos</p>T0 = 2 · T1 = 4 · T2 = 6 · T3 = 8 · T4 = 10 · Tn = 2(n+1)</div>
            <div className="bg-white p-4 text-[13px]"><p className="label mb-2">Quadro XXVIII — por comprimento</p>Lugares sentados não individualizados: 2 pessoas/m de banco ou bancada · Lugares de pé numa única frente: 5 pessoas/m</div>
            <div className="bg-white p-4 text-[13px]"><p className="label mb-2">Art. 51.º n.º 2</p>a) ocupantes em camas (IV, V, VII) · b) 3,2 × lugares de acamados (V) · d) lugares fixos · e) declarado, mín. 0,03 p/m² (arquivos e UT XII sem público)</div>
            <div className="bg-white p-4 text-[13px]"><p className="label mb-2">Art. 51.º n.º 5 e art. 232.º</p>Crianças ≤ 3 anos e pessoas limitadas: efetivo × 1,3 só para dimensionar vias de evacuação e saídas.</div>
            <div className="bg-white p-4 text-[13px]"><p className="label mb-2">Art. 283.º — UT IX</p>a) espectadores + 0,1 p/m² de área útil de apoio · b) pistas de patinagem +0,7 p/m² · c) piscinas +1 p/m² de plano de água</div>
            <div className="bg-white p-4 text-[13px]"><p className="label mb-2">Quadros XXIX e XXXI — saídas e UP (coberto)</p>Saídas: 1–50 → 1; 51–1 500 → 1/500 + 1; 1 501–3 000 → 1/500; &gt; 3 000 → mín. 6 · UP: 1–50 → 1; 51–500 → 1/100 + 1; &gt; 500 → 1/100</div>
          </div>
        </div>
      )}

      {tab === TABS[2] && (
        <div className="flex flex-col gap-6">
          <QuadroIIView />
          <QuadroIView />
        </div>
      )}

      {tab === TABS[3] && (
        <div className="grid gap-6 lg:grid-cols-2">
          <TabelaSimples titulo="Quadro IX — elementos estruturais (art. 15.º)" cab={['UT', '1.ª', '2.ª', '3.ª', '4.ª']} linhas={[
            ['I, III a X — suporte', ...[1, 2, 3, 4].map((k) => quadroIX(3, k as 1).suporte)],
            ['I, III a X — suporte e compartimentação', ...[1, 2, 3, 4].map((k) => quadroIX(3, k as 1).compartimentacao)],
            ['II, XI e XII — suporte', ...[1, 2, 3, 4].map((k) => quadroIX(12, k as 1).suporte)],
            ['II, XI e XII — suporte e compartimentação', ...[1, 2, 3, 4].map((k) => quadroIX(12, k as 1).compartimentacao)],
          ]} />
          <TabelaSimples titulo="Quadros X e XI — entre UT distintas (art. 17.º)" cab={['UT', '1.ª', '2.ª', '3.ª', '4.ª']} linhas={[
            ['X: I, III a X (EI/REI)', ...[1, 2, 3, 4].map((k) => String(quadroX(3, k as 1)))],
            ['X: II, XI e XII (EI/REI)', ...[1, 2, 3, 4].map((k) => String(quadroX(12, k as 1)))],
            ['XI: I, III a X (vãos)', ...[1, 2, 3, 4].map((k) => quadroXI(3, k as 1))],
            ['XI: II, XI e XII (vãos)', ...[1, 2, 3, 4].map((k) => quadroXI(12, k as 1))],
          ]} />
          <TabelaSimples titulo="Quadro XII — áreas máximas de compartimento (art. 18.º)" cab={['UT', 'Área máxima por piso']} linhas={[
            ['I, III, VI, VII, VIII, IX e X', '1 600 m²'], ['II', '6 400 m² (acima/no PR) · 3 200 m² (abaixo)'], ['IV e V (sem locais D)', '1 600 m²'], ['IV e V (pisos com locais D)', '800 m²'], ['XI', '800 m² (acima/no PR) · 400 m² (abaixo)'], ['XII', 'Art. 302.º, quadro L'],
          ]} />
          <TabelaSimples titulo="Quadros XIII a XVIII — envolvente de locais de risco" cab={['Local', 'Paredes', 'Suporte', 'Portas']} linhas={Object.entries(ENVOLVENTE_LOCAIS).map(([k, v]) => [`${k === 'Cag' ? 'C agravado' : k} (Q. ${v.quadro})`, v.paredes, v.suporte, v.portas])} />
          <TabelaSimples titulo="Quadro XXV — reação ao fogo em locais de risco" cab={['Local', 'Paredes e tetos', 'Pavimentos']} linhas={Object.entries(QUADRO_XXV).map(([k, v]) => [k, v.paredes, v.pavimentos])} />
          <TabelaSimples titulo="Quadro XIX — vias horizontais protegidas" cab={['Altura', 'Paredes', 'Suporte', 'Portas']} linhas={[['Pequena', 'EI 30', 'REI 30', 'E 15 C'], ['Média ou grande', 'EI 60', 'REI 60', 'E 30 C'], ['Muito grande', 'EI 90', 'REI 90', 'E 45 C']]} />
        </div>
      )}

      {tab === TABS[4] && (
        <div className="grid gap-6 lg:grid-cols-2">
          <TabelaSimples titulo="Quadro XXXVI — configurações de alarme (art. 125.º)" cab={['Componente', '1', '2', '3']} linhas={QUADRO_XXXVI.linhas.map((l) => [l.comp, ...l.c.map((x) => (x ? '■' : ''))])} />
          <TabelaSimples titulo="Quadro XXXVII — sprinklers (art. 174.º)" cab={['UT', 'L/min/m²', 'Área m²', 'N.º', 'mm', 'min']} linhas={Object.entries(QUADRO_XXXVII).map(([k, v]) => [k, String(v.densidade), String(v.area), String(v.n), String(v.calibre), String(v.tempo)])} />
          <TabelaSimples titulo="Quadro XXXIX — medidas de autoproteção (art. 198.º)" cab={['UT', 'Categoria', 'Medidas']} linhas={[
            ['I', '3.ª (espaços comuns)', 'Registos · Plano de prevenção · Proc. emergência · Formação'],
            ['I', '4.ª (espaços comuns)', 'Registos · Plano de prevenção · PEI · Formação · Simulacros'],
            ['II, III, VI, VIII a XII', '1.ª', 'Registos · Procedimentos de prevenção'],
            ['II, III, VI, VIII a XII', '2.ª', 'Registos · Plano de prevenção · Proc. emergência · Formação'],
            ['II, III, VI, VIII a XII', '3.ª e 4.ª', 'Registos · Plano de prevenção · PEI · Formação · Simulacros'],
            ['IV, V e VII', '1.ª sem D/E', 'Registos · Procedimentos de prevenção'],
            ['IV, V e VII', '1.ª com D/E; 2.ª sem D/E', 'Registos · Plano de prevenção · Proc. emergência · Formação'],
            ['IV, V e VII', '2.ª com D/E; 3.ª; 4.ª', 'Registos · Plano de prevenção · PEI · Formação · Simulacros'],
          ]} />
          <TabelaSimples titulo="Quadro XLI — periodicidade dos simulacros (art. 207.º)" cab={['UT', 'Categoria', 'Período máximo']} linhas={[
            ['I', '4.ª', 'Dois anos'], ['II', '3.ª e 4.ª', 'Dois anos'], ['VI e IX', '2.ª e 3.ª', 'Dois anos'], ['VI e IX', '4.ª', 'Um ano'],
            ['III, VIII, X, XI e XII', '2.ª e 3.ª', 'Dois anos'], ['III, VIII, X, XI e XII', '4.ª', 'Um ano'], ['IV, V e VII', '2.ª (com D/E), 3.ª e 4.ª', 'Um ano'],
          ]} />
          <TabelaSimples titulo="RJ-SCIE, art. 19.º — inspeções regulares" cab={['Categoria', 'Prazo máximo']} linhas={[['1.ª', '6 anos'], ['2.ª', '5 anos'], ['3.ª', '4 anos'], ['4.ª', '3 anos']]} />
        </div>
      )}

      {tab === TABS[5] && (
        <div className="grid gap-px border border-ink bg-ink md:grid-cols-3">
          {DIPLOMAS.map((d) => (
            <div key={d.sigla} className="bg-white p-5">
              <p className="font-display text-[22px] font-extrabold">{d.sigla}</p>
              <p className="mt-2 text-[13px] font-semibold">{d.titulo}</p>
              <p className="mt-2 text-[12.5px] text-ink-3">{d.objeto}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function TabelaSimples({ titulo, cab, linhas }: { titulo: string; cab: string[]; linhas: string[][] }) {
  return (
    <div className="border border-ink bg-white">
      <div className="border-b border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white">{titulo}</div>
      <table className="tbl">
        <thead><tr>{cab.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{linhas.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} className={j ? 'font-mono' : ''}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
