import { Copy, HardHat, Plus, Trash2 } from 'lucide-react';
import { useFPS } from '../store';
import { useStore } from '../../store';
import { go } from '../../router';
import { enquadramento } from '../regras';

export const ROT_ENQ: Record<string, [string, string]> = { por_responder: ['Por enquadrar', 'border-ink-4 text-ink-3'], fps: ['FPS obrigatória', 'border-ok text-ok'], pss: ['Exige PSS', 'border-alerta text-alerta'], nenhum: ['FPS não obrigatória', 'border-ink-4 text-ink-3'], fora: ['Fora do DL 273/2003', 'border-ink-4 text-ink-3'] };

export default function Lista() {
  const { fichas, criar, atualizar, apagar, duplicar } = useFPS();
  const novo = () => {
    const id = criar();
    const { empresaPadrao: e, autorPadrao: au } = useStore.getState();
    atualizar(id, (f) => {
      if (e) f.executante = { nome: e.nome || '', funcao: 'Entidade executante', contacto: [e.telefone, e.email].filter(Boolean).join(' · ') };
      if (au) f.tecnicoSST = { nome: au.nome || '', funcao: au.qualificacao || 'Técnico de SST', contacto: au.email || '' };
    });
    go(`/fps/f/${id}`);
  };
  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-6">
      <div className="mb-6 border-b-2 border-ink pb-5">
        <p className="label !text-fire-ink">Estaleiros temporários ou móveis · Decreto-Lei n.º 273/2003</p>
        <h1 className="h-display mt-1 text-[38px]">Fichas de procedimentos de segurança</h1>
        <p className="mt-2 max-w-[720px] text-[13.5px] text-ink-3">Para trabalhos de construção ou engenharia civil com riscos especiais em que o plano de segurança e saúde não é obrigatório (art. 14.º). A app começa por confirmar se a FPS é a peça certa.</p>
      </div>
      <button onClick={novo} className="mb-10 flex w-full items-center justify-between border border-ink bg-white p-5 text-left hover:bg-paper md:w-[420px]">
        <span><span className="block font-display text-[19px] font-bold">Nova FPS</span><span className="text-[12.5px] text-ink-3">Enquadramento, obra, trabalhos e emergência</span></span><Plus size={20} />
      </button>
      <h2 className="mb-3 font-display text-[18px] font-bold">As minhas fichas</h2>
      {!fichas.length ? <div className="border border-dashed border-ink-4 p-8 text-center text-[13.5px] text-ink-3"><HardHat className="mx-auto mb-2" />Ainda não há fichas.</div> : (
        <div className="flex flex-col gap-2">
          {[...fichas].sort((a, b) => b.atualizadoEm - a.atualizadoEm).map((f) => { const [t, cls] = ROT_ENQ[enquadramento(f).estado]; return (
            <div key={f.id} className="flex flex-wrap items-center gap-3 border border-paper-3 bg-white p-3 sm:p-4">
              <button className="min-w-0 flex-1 text-left" onClick={() => go(`/fps/f/${f.id}`)}>
                <span className="flex flex-wrap items-center gap-2"><span className={`border px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase ${cls}`}>{t}</span><span className="font-semibold">{f.obra.designacao || 'Obra por indicar'}</span></span>
                <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{[f.donoObra.nome, f.obra.localizacao].filter(Boolean).join(' · ') || 'Dono da obra e local por indicar'} · rev. {f.revisao}</span>
              </button>
              <button className="btn-ghost" title="Duplicar" onClick={() => duplicar(f.id)}><Copy size={14} /></button>
              <button className="btn-ghost hover:!text-alerta" title="Apagar" onClick={() => { if (confirm(`Apagar a FPS «${f.obra.designacao || 'obra por indicar'}»?`)) apagar(f.id); }}><Trash2 size={14} /></button>
            </div>
          ); })}
        </div>
      )}
    </main>
  );
}
