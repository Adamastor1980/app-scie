import { useMemo, useRef, useState } from 'react';
import { Camera, Check, MapPin, PenLine, Search, Trash2, X } from 'lucide-react';
import type { Edificio, UT, Verificacao } from '../../data/types';
import type { Planta } from '../../data/types';
import { contexto, gerarMedidas, secRotulo, type Medida } from '../../engine/medidas';
import { opcoesPrazo, verDe } from '../../engine/verificacao';
import { uid } from '../../store';
import { caberNaNuvem, compressImage, readFile } from '../../ui/primitives';
import Desenho from '../../ui/Desenho';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Cláusulas da exigência legal da medida: cada uma pode ser tocada como constatação («Não cumpre: …») */
function clausulas(m: Medida): string[] {
  return m.exigencia
    .split(/;\s+|\.\s+(?=[A-ZÀ-Ú])/)
    .map((x) => x.replace(/\.$/, '').trim())
    .filter((x) => x.length > 6)
    .slice(0, 10);
}

/**
 * Registo rápido de uma não conformidade no local: fotografia (com anotação), medida, constatação por toque e ponto na planta.
 * Grava na verificação da medida (estado «Não cumpre») — a mesma que alimenta a análise regulamentar do relatório e o Excel.
 */
export default function NovaNC({ ed, ut, plantas, upU, medidaKey, onClose }: {
  ed: Edificio; ut: UT; plantas: Planta[]; upU: (fn: (u: UT) => void) => void; medidaKey?: string; onClose: () => void;
}) {
  const medidas = useMemo(() => gerarMedidas(contexto(ed, ut)).filter((m) => m.estado !== 'nao'), [ed, ut]);
  const [key, setKey] = useState<string | undefined>(medidaKey);
  const m = medidas.find((x) => x.key === key);
  const v0: Verificacao = m ? verDe(ut, m) : {};
  const [obs, setObs] = useState(v0.obs ?? '');
  const [corretiva, setCorretiva] = useState(v0.corretiva ?? '');
  const [prazo, setPrazo] = useState(v0.prazo ?? '');
  const [ponto, setPonto] = useState(v0.ponto);
  const [plantaId, setPlantaId] = useState(v0.ponto?.plantaId ?? plantas[0]?.id);
  const existentes = (v0.fotos ?? []).map((id) => ut.levantamento?.find((a) => a.id === id)).filter(Boolean) as { id: string; imagem: string }[];
  const [fotos, setFotos] = useState<{ id: string; imagem: string; nova?: boolean }[]>(existentes);
  const [anotar, setAnotar] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);

  const escolher = (k: string) => {
    const mm = medidas.find((x) => x.key === k)!;
    const v = verDe(ut, mm);
    setKey(k); setObs(v.obs ?? ''); setCorretiva(v.corretiva ?? ''); setPrazo(v.prazo ?? '');
    setPonto((p0) => v.ponto ?? p0);
    // mantém as fotografias tiradas antes de escolher a medida e junta as já associadas
    const assoc = (v.fotos ?? []).map((id) => ut.levantamento?.find((a) => a.id === id)).filter(Boolean) as { id: string; imagem: string }[];
    setFotos((l) => [...assoc, ...l.filter((f) => f.nova && !assoc.some((a) => a.id === f.id))]);
  };

  const fotografar = async (files: FileList) => {
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const d = await caberNaNuvem(await compressImage(await readFile(f), 1800, 0.82, true), 800_000);
        setFotos((l) => [...l, { id: uid(), imagem: d, nova: true }]);
      }
    } finally { setBusy(false); }
  };

  const tocarClausula = (c: string) => {
    const t = `Não cumpre: ${c}`;
    setObs((o) => (o.includes(t) ? o.replace(t, '').replace(/^[\s;]+|[\s;]+$/g, '').replace(/;\s*;/g, ';') : o ? `${o}; ${t}` : t));
  };

  const guardar = () => {
    if (!m) return;
    upU((u) => {
      const lev = (u.levantamento ??= []);
      for (const f of fotos) {
        const a = lev.find((x) => x.id === f.id);
        if (a) a.imagem = f.imagem;
        else lev.push({ id: f.id, tipo: 'foto', imagem: f.imagem, legenda: m.titulo, data: Date.now() });
      }
      const ver = (u.verificacao ??= {});
      ver[m.key] = { ...(ver[m.key] ?? {}), estado: 'nao_cumpre', obs: obs.trim() || undefined, corretiva: corretiva.trim() || undefined, prazo: prazo || undefined, fotos: fotos.map((f) => f.id), ponto };
    });
    onClose();
  };

  const planta = plantas.find((p) => p.id === plantaId);
  const lista = useMemo(() => {
    const n = norm(q.trim());
    return n ? medidas.filter((x) => norm(`${x.titulo} ${x.exigencia} ${secRotulo(x.tema)}`).includes(n)) : medidas;
  }, [q, medidas]);

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-ink/60 sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-[820px] flex-col overflow-hidden border border-ink bg-paper" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink bg-white px-5 py-3">
          <h2 className="font-display text-[20px] font-bold">Não conformidade</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* 1. Fotografias */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button className="btn-fire h-12 px-4 text-[14px]" disabled={busy} onClick={() => camRef.current?.click()}><Camera size={18} /> {busy ? 'A processar…' : 'Fotografia'}</button>
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files?.length) fotografar(e.target.files); e.target.value = ''; }} />
            {fotos.map((f, i) => (
              <div key={f.id} className="relative h-16 w-16 border border-ink bg-white">
                <img src={f.imagem} alt="" className="h-full w-full object-cover" />
                <button className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center bg-ink text-white" title="Anotar (setas, notas)" onClick={() => setAnotar(i)}><PenLine size={12} /></button>
                <button className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center bg-alerta text-white" title="Retirar" onClick={() => setFotos((l) => l.filter((_, k) => k !== i))}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

          {/* 2. Medida */}
          {!m ? (
            <div>
              <p className="label mb-1.5">Que exigência não é cumprida?</p>
              <div className="relative mb-2">
                <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4" />
                <input className="input pl-8" placeholder="Pesquisar (ex.: extintor, porta, sinalização)…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="max-h-[46vh] overflow-y-auto border border-ink bg-white">
                {lista.map((x) => (
                  <button key={x.key} className="block w-full border-b border-paper-3 px-3 py-2.5 text-left hover:bg-paper" onClick={() => escolher(x.key)}>
                    <span className="block text-[13.5px] font-semibold">{x.titulo}</span>
                    <span className="ref">{secRotulo(x.tema)} · {x.base}</span>
                  </button>
                ))}
                {!lista.length && <p className="px-3 py-3 text-[12.5px] text-ink-3">Sem resultados.</p>}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 border border-ink bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-bold">{m.titulo}</p>
                    <p className="ref">{m.base}</p>
                  </div>
                  {!medidaKey && <button className="btn h-8 text-[12px]" onClick={() => setKey(undefined)}>Mudar</button>}
                </div>
                {/* 3. Constatação por toque: cláusulas da própria exigência legal */}
                <p className="label mb-1.5 mt-3">Toque no que não cumpre</p>
                <div className="flex flex-wrap gap-1.5">
                  {clausulas(m).map((c) => {
                    const on = obs.includes(`Não cumpre: ${c}`);
                    return <button key={c} onClick={() => tocarClausula(c)} className={`border px-2.5 py-1.5 text-left text-[12px] leading-snug ${on ? 'border-ink bg-ink text-white' : 'border-paper-3 bg-paper hover:border-ink'}`}>{c}</button>;
                  })}
                </div>
                <textarea className="input mt-2" rows={2} placeholder="Constatação no local (pode ditar pelo microfone do teclado)" value={obs} onChange={(e) => setObs(e.target.value)} />
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_170px]">
                  <input className="input" placeholder="Medida corretiva (opcional)" value={corretiva} onChange={(e) => setCorretiva(e.target.value)} />
                  <select className="input" value={prazo} onChange={(e) => setPrazo(e.target.value)}>
                    <option value="">Prazo…</option>
                    {opcoesPrazo().map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* 4. Ponto na planta */}
              {plantas.length > 0 && (
                <div className="border border-ink bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="label"><MapPin size={12} className="mr-1 inline" />Localização na planta (toque)</span>
                    <select className="input ml-auto w-auto max-w-[60%]" value={plantaId} onChange={(e) => setPlantaId(e.target.value)}>
                      {plantas.map((p) => <option key={p.id} value={p.id}>{p.titulo || 'Planta'}</option>)}
                    </select>
                    {ponto && <button className="btn h-8 text-[12px]" onClick={() => setPonto(undefined)}>Retirar ponto</button>}
                  </div>
                  {planta?.imagem ? (
                    <div className="relative cursor-crosshair touch-manipulation" onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setPonto({ plantaId: planta.id, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
                    }}>
                      <img src={planta.imagem} alt="" className="block w-full select-none" draggable={false} />
                      {ponto?.plantaId === planta.id && (
                        <span className="pointer-events-none absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-alerta text-white shadow" style={{ left: `${ponto.x * 100}%`, top: `${ponto.y * 100}%` }}><MapPin size={14} /></span>
                      )}
                    </div>
                  ) : <p className="text-[12px] text-ink-3">A carregar a planta…</p>}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink bg-white px-5 py-3">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn-fire" disabled={!m} onClick={guardar}><Check size={16} /> Guardar não conformidade</button>
        </div>
      </div>
    </div>
      {anotar !== null && fotos[anotar] && (
        <Desenho fundo={fotos[anotar].imagem} onFechar={() => setAnotar(null)} onGuardar={async (img) => {
          const d = await caberNaNuvem(img, 800_000);
          setFotos((l) => l.map((f, k) => (k === anotar ? { ...f, imagem: d } : f)));
          setAnotar(null);
        }} />
      )}
    </>
  );
}
