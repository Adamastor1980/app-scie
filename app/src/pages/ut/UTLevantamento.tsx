import { useRef, useState } from 'react';
import { Camera, ImagePlus, PenLine, PencilRuler, Trash2, X } from 'lucide-react';
import type { UTProps } from '../UTPage';
import type { Anexo } from '../../data/types';
import { uid } from '../../store';
import { Empty, Note, caberNaNuvem, compressImage, readFile } from '../../ui/primitives';
import Desenho from '../../ui/Desenho';
import { useNuvem } from '../../cloud/sync';

/** Fotografias e desenhos do levantamento no local, guardados com a UT (apoio ao técnico; não entram nos cálculos nem no relatório). */
export default function UTLevantamento({ ut, upU }: UTProps) {
  const lista = ut.levantamento ?? [];
  const estadoNuvem = useNuvem((x) => x.estado);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [editor, setEditor] = useState<{ fundo?: string; id?: string } | null>(null);
  const [ver, setVer] = useState<Anexo | null>(null);
  const [busy, setBusy] = useState(false);

  const juntar = (a: Omit<Anexo, 'id' | 'data'>) => upU((u) => { (u.levantamento ??= []).push({ ...a, id: uid(), data: Date.now() }); });

  const fotos = async (files: FileList) => {
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const d = await caberNaNuvem(await compressImage(await readFile(f), 1800, 0.82, true), 800_000);
        juntar({ tipo: 'foto', imagem: d, legenda: '' });
      }
    } catch (e) {
      alert('Não foi possível ler a imagem: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const guardarDesenho = async (img: string) => {
    const id = editor?.id;
    setEditor(null);
    const imagem = await caberNaNuvem(img, 800_000);
    // editar: altera a própria imagem (não cria outra); novo desenho: acrescenta
    if (id) upU((u) => { const x = u.levantamento?.find((y) => y.id === id); if (x) { x.imagem = imagem; x.data = Date.now(); } });
    else juntar({ tipo: 'desenho', imagem, legenda: '' });
  };

  const dataPt = (t: number) => new Date(t).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-2">
        <div>
          <h2 className="section-title">Levantamento no local</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-3">Fotografias e desenhos de apoio, guardados com esta UT para consultar ao fazer os cálculos. São só para si: não entram nos cálculos nem no relatório.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <button className="btn-fire h-12 justify-center text-[14px]" disabled={busy} onClick={() => camRef.current?.click()}><Camera size={18} /> {busy ? 'A processar…' : 'Tirar fotografia'}</button>
        <button className="btn h-12 justify-center text-[14px]" disabled={busy} onClick={() => galRef.current?.click()}><ImagePlus size={18} /> Carregar imagens</button>
        <button className="btn-primary h-12 justify-center text-[14px]" onClick={() => setEditor({})}><PencilRuler size={18} /> Novo desenho</button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files?.length) fotos(e.target.files); e.target.value = ''; }} />
        <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) fotos(e.target.files); e.target.value = ''; }} />
      </div>

      {lista.length === 0 ? (
        <Empty title="Ainda sem fotografias nem desenhos.">
          No local, use «Tirar fotografia» (abre a câmara do tablet/telemóvel) ou «Novo desenho» para um esboço à mão — com o dedo ou caneta. Pode também desenhar por cima de uma fotografia (seta, cotas, notas).
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((a, i) => (
            <figure key={a.id} className="flex flex-col border border-ink bg-white">
              <button className="relative block aspect-[4/3] w-full overflow-hidden bg-paper" onClick={() => setVer(a)} title="Ver em grande">
                {a.imagem ? <img src={a.imagem} alt="" className="h-full w-full object-contain" /> : (
                  <span className="grid h-full place-items-center px-4 text-center text-[12px] text-ink-4">
                    {estadoNuvem === 'sincronizado' ? 'Imagem não disponível: não chegou à nuvem. Abra a app, com rede, no aparelho onde foi criada para a enviar; se já não existir, apague-a.' : 'A carregar da nuvem…'}
                  </span>
                )}
                <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">{a.tipo === 'foto' ? 'Foto' : 'Desenho'} {String(i + 1).padStart(2, '0')}</span>
              </button>
              <figcaption className="flex flex-col gap-2 border-t border-ink p-3">
                <input className="input" placeholder="Legenda (ex.: quadro elétrico piso 0, porta corta-fogo…)" value={a.legenda} onChange={(e) => upU((u) => { const x = u.levantamento?.find((y) => y.id === a.id); if (x) x.legenda = e.target.value; })} />
                <div className="flex items-center justify-between">
                  <span className="ref">{dataPt(a.data)}</span>
                  <span className="flex">
                    {a.imagem && <button className="btn-icon" title="Editar (desenhar por cima)" onClick={() => setEditor({ fundo: a.imagem, id: a.id })}><PenLine size={16} /></button>}
                    <button className="btn-icon" title="Apagar" onClick={() => confirm('Apagar esta imagem do levantamento?') && upU((u) => { u.levantamento = (u.levantamento ?? []).filter((y) => y.id !== a.id); })}><Trash2 size={16} /></button>
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="mt-6"><Note>As imagens ficam sincronizadas na nuvem com o projeto. As fotografias são reduzidas automaticamente (cerca de 1800 px) para não ocuparem demasiado espaço.</Note></div>

      {editor && <Desenho fundo={editor.fundo} onFechar={() => setEditor(null)} onGuardar={guardarDesenho} />}

      {ver && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-ink/95" onClick={() => setVer(null)}>
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-[14px] font-semibold">{ver.legenda || (ver.tipo === 'foto' ? 'Fotografia' : 'Desenho')}</span>
            <button className="grid h-10 w-10 place-items-center text-white/80 hover:text-white"><X size={22} /></button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-3">
            <img src={ver.imagem} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
