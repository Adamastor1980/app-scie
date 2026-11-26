import { useEffect, useState } from 'react';
import { Building2, Download, Plus, Trash2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import type { ExtintorInv, PlanoSinal, SinalPiso } from '../data/types';
import { novoEdificio, uid, useStore } from '../store';
import { Faltas, Field, Num, Section, Text } from '../ui/primitives';
import { areaPlaca, exigida, faltaPiso, placasPiso, totaisSinal } from '../engine/sinaletica';
import { inventarioDoMapa, rotuloPisoInv } from '../engine/manutencao';

const PISOS = Array.from({ length: 36 }, (_, k) => 30 - k);
export const novoSinalPiso = (edificio: string, piso: number | null): SinalPiso => ({ id: uid(), edificio, piso, saidas: 0, corredores: [], mudancas: 0, escadas: 0, extintores: 0, carreteis: 0, botoes: 0, outros: [] });
export const APLIC: Record<PlanoSinal['aplic'], string> = {
  exigida: 'Exigida — edifícios e recintos em geral',
  fogos: 'Não exigida — fogos de habitação',
  ut1cat1: 'Não exigida — espaços comuns da UT I (habitacional) da 1.ª categoria',
};

export default function Sinaletica() {
  const { p, up } = useP();
  const pl = p.sinaletica;
  useEffect(() => { if (!p.sinaletica) up((q) => { q.sinaletica = { aplic: 'exigida', pisos: [] }; }); }, [p.sinaletica, up]);
  if (!pl) return null;
  const upPl = (fn: (x: PlanoSinal) => void) => up((q) => { fn(q.sinaletica ??= { aplic: 'exigida', pisos: [] }); });
  const tot = totaisSinal(pl);

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-6 border-b-2 border-ink pb-5">
        <p className="label !text-fire-ink">RT-SCIE, arts. 108.º a 112.º</p>
        <h1 className="h-display mt-2 text-[34px] sm:text-[40px]">Sinalética de segurança</h1>
        <p className="mt-2 max-w-3xl text-[13px] text-ink-3">Por piso, indique o que está na planta: saídas, vias de evacuação, mudanças de direção, escadas e equipamentos. A app dá o mínimo de placas e o tamanho mínimo, com o artigo de cada uma. É um mínimo a confirmar na planta.</p>
        {exigida(pl) && tot.total > 0 && <p className="mt-3 font-display text-[18px] font-bold">{tot.total} placas no mínimo <a className="ml-2 align-middle text-[13px] font-semibold text-fire-ink hover:underline" href={`#/p/${p.id}/sinaletica/doc`}>Estudo de sinalética (PDF) →</a></p>}
      </div>

      <Section n="01" title="Aplicabilidade" sub="RT-SCIE, art. 108.º n.º 4: todos os edifícios e recintos têm sinalização, exceto os espaços comuns da UT I da 1.ª categoria e os fogos de habitação.">
        <select className="input max-w-[560px]" value={pl.aplic} onChange={(e) => upPl((x) => { x.aplic = e.target.value as PlanoSinal['aplic']; })}>
          {Object.entries(APLIC).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        {!exigida(pl) && <p className="mt-3 border-l-[3px] border-ok bg-ok-soft px-3 py-2 text-[13px]">Sinalização de segurança <b>não exigida</b> neste caso (RT-SCIE, art. 108.º n.º 4).</p>}
      </Section>

      {exigida(pl) && (
        <Section n="02" title="Pisos por edifício" sub="Um cartão por piso. Os campos a vermelho são obrigatórios.">
          {p.edificios.map((ed) => <Edificio key={ed.id} eid={ed.id} />)}
          {p.modo === 'sinaletica' && <button className="btn h-9 px-3 text-[12.5px]" onClick={() => up((q) => { q.edificios.push(novoEdificio(q.edificios.length + 1)); })}><Plus size={14} /> Acrescentar edifício</button>}
        </Section>
      )}

      {exigida(pl) && (
        <Section n="03" title="Regras de instalação" sub="Exigências do RT-SCIE para todas as placas.">
          <ul className="ml-5 list-disc text-[12.5px] leading-[1.7] text-ink-2">
            <li>Placas de material rígido fotoluminescente (art. 110.º).</li>
            <li>Área mínima A ≥ d²/2000, com d (distância de visão) entre 6 e 50 m (art. 109.º).</li>
            <li>Placas salientes da parede a uma altura entre 2,1 m e 3 m, salvo espaços amplos com justificação (art. 111.º n.º 2).</li>
            <li>Nas vias de evacuação, perpendiculares ou a 45° ao sentido da fuga; distância entre placas de 6 a 30 m (art. 112.º n.os 2 e 4).</li>
            <li>A menos de 2 m, em projeção horizontal, de uma fonte de luz, sem ficarem coladas sobre os aparelhos (art. 112.º n.º 7).</li>
            <li>Nada na linha de visão pode ocultar a sinalização ou confundir os ocupantes (art. 108.º n.º 3).</li>
            <li>Pictogramas, cores e formatos: DL 141/95, Portaria 1456-A/95 e normas EN ISO 7010, ISO 3864 e ISO 16069 (art. 108.º n.º 1) — não verificados pela app.</li>
          </ul>
        </Section>
      )}
    </main>
  );
}

function Edificio({ eid }: { eid: string }) {
  const { p, up } = useP();
  const projetos = useStore((s) => s.projetos);
  const [imp, setImp] = useState<{ pid: string; ed: string } | null>(null);
  const ed = p.edificios.find((e) => e.id === eid)!;
  const pl = p.sinaletica!;
  const soSinal = p.modo === 'sinaletica';
  const pisos = pl.pisos.filter((s) => s.edificio === eid).sort((a, b) => (a.piso ?? 999) - (b.piso ?? 999));
  const upPiso = (id: string, fn: (s: SinalPiso) => void) => up((q) => { const s = q.sinaletica!.pisos.find((z) => z.id === id); if (s) fn(s); });
  const livres = PISOS.filter((n) => !pisos.some((s) => s.piso === n));
  const fontes = projetos.filter((x) => x.id !== p.id && (x.modo === 'extintores' || x.modo === 'manutencao' || !x.modo));
  const importar = () => {
    const src = projetos.find((x) => x.id === imp!.pid)!;
    const lista: ExtintorInv[] = src.modo === 'manutencao' ? (src.manutencao?.extintores ?? []) : inventarioDoMapa(src).novos;
    const doEd = lista.filter((e) => e.edificio === imp!.ed);
    const porPiso = new Map<number, number>();
    let semPiso = 0;
    for (const e of doEd) if (e.piso === null) semPiso++; else porPiso.set(e.piso, (porPiso.get(e.piso) ?? 0) + 1);
    up((q) => {
      for (const [n, k] of porPiso) {
        let s = q.sinaletica!.pisos.find((z) => z.edificio === eid && z.piso === n);
        if (!s) { s = novoSinalPiso(eid, n); q.sinaletica!.pisos.push(s); }
        s.extintores = k;
      }
    });
    alert(`Importados ${doEd.length - semPiso} extintores em ${porPiso.size} piso(s).${semPiso ? ` ${semPiso} sem piso indicado não entraram.` : ''}`);
    setImp(null);
  };

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-ink pb-2">
        <Building2 size={17} className="shrink-0" />
        {soSinal
          ? <input className="input h-9 max-w-[320px] flex-1 font-display text-[16px] font-bold" value={ed.nome} onChange={(e) => up((q) => { const x = q.edificios.find((z) => z.id === eid); if (x) x.nome = e.target.value; })} />
          : <span className="font-display text-[17px] font-bold">{ed.nome}</span>}
        {fontes.length > 0 && <button className="ml-auto flex items-center gap-1 text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => setImp(imp ? null : { pid: fontes[0].id, ed: fontes[0].edificios[0]?.id ?? '' })}><Download size={14} /> Importar extintores de outro projeto</button>}
        {soSinal && p.edificios.length > 1 && <button className="btn-icon" title="Apagar edifício" onClick={() => {
          if (pisos.length) return alert('Apague primeiro os pisos deste edifício.');
          if (confirm(`Apagar o edifício «${ed.nome}»?`)) up((q) => { q.edificios = q.edificios.filter((z) => z.id !== eid); });
        }}><Trash2 size={15} /></button>}
      </div>
      {imp && (() => {
        const src = projetos.find((x) => x.id === imp.pid);
        return (
          <div className="mb-4 grid gap-3 border border-ink bg-paper p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="Projeto"><select className="input" value={imp.pid} onChange={(e) => { const s = projetos.find((x) => x.id === e.target.value); setImp({ pid: e.target.value, ed: s?.edificios[0]?.id ?? '' }); }}>{fontes.map((x) => <option key={x.id} value={x.id}>{x.nome}{x.referencia ? ` (${x.referencia})` : ''}</option>)}</select></Field>
            <Field label="Edifício de origem"><select className="input" value={imp.ed} onChange={(e) => setImp({ ...imp, ed: e.target.value })}>{src?.edificios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></Field>
            <div className="flex items-end"><button className="btn-fire h-10 w-full px-4" onClick={importar}>Importar</button></div>
            <p className="text-[11.5px] text-ink-3 sm:col-span-3">Conta os extintores de cada piso (do mapa de extintores ou do inventário de manutenção) e põe esse número nas placas «Extintor» do mesmo piso deste edifício.</p>
          </div>
        );
      })()}

      <div className="flex flex-col gap-3">
        {pisos.map((s) => <CartaoPiso key={s.id} s={s} upS={(fn) => upPiso(s.id, fn)} apagar={() => confirm(`Apagar ${rotuloPisoInv(s.piso)}?`) && up((q) => { q.sinaletica!.pisos = q.sinaletica!.pisos.filter((z) => z.id !== s.id); })} />)}
      </div>
      {!pisos.length && <p className="mb-2 text-[12.5px] text-ink-3">Sem pisos indicados.</p>}
      <select className="input mt-3 h-9 w-auto py-0 text-[12.5px]" value="" onChange={(e) => e.target.value !== '' && up((q) => { q.sinaletica!.pisos.push(novoSinalPiso(eid, Number(e.target.value))); })}>
        <option value="">+ Acrescentar piso…</option>{livres.map((n) => <option key={n} value={n}>{rotuloPisoInv(n)}</option>)}
      </select>
    </div>
  );
}

function CartaoPiso({ s, upS, apagar }: { s: SinalPiso; upS: (fn: (s: SinalPiso) => void) => void; apagar: () => void }) {
  const fp = faltaPiso(s);
  const fc = (c: string) => (fp.some((f) => f[0] === c) ? 'falta' : '');
  const placas = placasPiso(s);
  const tam = s.dist && s.dist > 0 ? areaPlaca(s.dist) : null;
  const n = (label: string, v: number, set: (v: number) => void, cls = '') => <Field label={label} className={cls}><Num value={v || undefined} placeholder="0" onChange={(x) => set(Math.max(0, Math.round(x)))} /></Field>;
  return (
    <div className={`border bg-white ${fp.length ? 'border-alerta' : 'border-ink'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-paper-3 px-3 py-2">
        <span className="font-mono text-[13px] font-bold">{rotuloPisoInv(s.piso)}</span>
        <button className="btn-icon" title="Apagar piso" onClick={apagar}><Trash2 size={15} /></button>
      </div>
      <div className="grid gap-4 p-3 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Distância de visão" className={fc('Distância de visão')} hint="Maior distância a que uma placa deve ser vista (art. 109.º)."><Num value={s.dist} suffix="m" onChange={(x, t) => upS((z) => { z.dist = t.trim() ? x : undefined; })} /></Field>
            {n('Saídas do piso', s.saidas, (v) => upS((z) => { z.saidas = v; }), fc('Saídas ou escadas'))}
            {n('Escadas', s.escadas, (v) => upS((z) => { z.escadas = v; }), fc('Saídas ou escadas'))}
            {n('Mudanças de direção', s.mudancas, (v) => upS((z) => { z.mudancas = v; }))}
            {n('Extintores', s.extintores, (v) => upS((z) => { z.extintores = v; }))}
            {n('Carretéis', s.carreteis, (v) => upS((z) => { z.carreteis = v; }))}
            {n('Botões de alarme', s.botoes, (v) => upS((z) => { z.botoes = v; }))}
          </div>
          <p className="label mt-4">Vias horizontais de evacuação (corredores)</p>
          <div className="mt-1 flex flex-col gap-2">
            {s.corredores.map((c, i) => (
              <div key={c.id} className="flex items-end gap-2">
                <div className="flex-1"><Text value={c.nome} placeholder={`Via ${i + 1} (ex.: corredor norte)`} onChange={(v) => upS((z) => { z.corredores[i].nome = v; })} /></div>
                <div className={`w-[120px] ${c.comp > 0 ? '' : 'falta'}`}><Num value={c.comp || undefined} suffix="m" placeholder="comp." onChange={(v) => upS((z) => { z.corredores[i].comp = v; })} /></div>
                <button className="btn-icon" title="Apagar" onClick={() => upS((z) => { z.corredores.splice(i, 1); })}><Trash2 size={14} /></button>
              </div>
            ))}
            <button className="flex items-center gap-1 self-start text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => upS((z) => { z.corredores.push({ id: uid(), nome: '', comp: 0 }); })}><Plus size={13} /> Acrescentar via</button>
          </div>
          <p className="label mt-4">Outras placas (opcional)</p>
          <div className="mt-1 flex flex-col gap-2">
            {s.outros.map((o, i) => (
              <div key={o.id} className="flex items-end gap-2">
                <div className="flex-1"><Text value={o.texto} placeholder="ex.: corte geral de energia" onChange={(v) => upS((z) => { z.outros[i].texto = v; })} /></div>
                <div className="w-[90px]"><Num value={o.qtd || undefined} placeholder="qtd." onChange={(v) => upS((z) => { z.outros[i].qtd = Math.max(0, Math.round(v)); })} /></div>
                <button className="btn-icon" title="Apagar" onClick={() => upS((z) => { z.outros.splice(i, 1); })}><Trash2 size={14} /></button>
              </div>
            ))}
            <button className="flex items-center gap-1 self-start text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => upS((z) => { z.outros.push({ id: uid(), texto: '', qtd: 1 }); })}><Plus size={13} /> Acrescentar outra placa</button>
          </div>
          <Faltas itens={fp} titulo="Falta preencher" />
        </div>
        <div className="border-l-[3px] border-fire bg-fire-soft px-3 py-2.5 text-[12.5px]">
          <p className="mb-1.5 font-semibold">Placas mínimas neste piso</p>
          {placas.length ? (
            <table className="w-full"><tbody>
              {placas.map((i) => <tr key={i.tipo}><td className="py-0.5 pr-2">{i.tipo}<span className="ref block">{i.base}</span></td><td className="py-0.5 text-right align-top font-bold">{i.qtd}</td></tr>)}
              <tr className="border-t border-fire/40 font-semibold"><td className="pt-1">Total</td><td className="pt-1 text-right text-[15px]">{placas.reduce((a, i) => a + i.qtd, 0)}</td></tr>
            </tbody></table>
          ) : <p className="text-ink-3">Preencha os dados do piso.</p>}
          {tam && <p className="mt-2 border-t border-fire/40 pt-2">Tamanho mínimo (art. 109.º, d = {tam.d} m): <b>{tam.cm2.toLocaleString('pt-PT')} cm²</b> — ex.: quadrada {tam.quadrada} × {tam.quadrada} mm ou retangular {tam.retangular[0]} × {tam.retangular[1]} mm{tam.limitada ? '. A lei limita d entre 6 e 50 m.' : '.'}</p>}
        </div>
      </div>
    </div>
  );
}
