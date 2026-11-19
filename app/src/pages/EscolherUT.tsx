import { useState } from 'react';
import { X } from 'lucide-react';
import { UTS, ROMANO } from '../data/rjscie';
import type { UTNum } from '../data/types';

export default function EscolherUT({ onClose, onPick }: { onClose: () => void; onPick: (t: UTNum, nome: string) => void }) {
  const [nome, setNome] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 p-4 pt-16 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-[1100px] border border-ink bg-paper" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b-2 border-ink p-5">
          <div>
            <p className="label !text-fire">Passo 1</p>
            <h2 className="h-display mt-1 text-[34px]">Escolher a utilização-tipo</h2>
            <p className="mt-1 text-[12.5px] text-ink-3">Classificação pelo uso dominante — RJ-SCIE, art. 8.º n.º 1. Confirme o art. 8.º n.º 3 antes de criar uma UT autónoma para espaços integrados.</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="border-b border-ink bg-white p-5">
          <label className="field">
            <span className="label">Nome desta utilização-tipo / zona</span>
            <input autoFocus className="input h-11 text-[15px]" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Escritórios piso 1, Armazém de produto acabado, Refeitório…" />
            <span className="text-[11.5px] text-ink-3">É este nome que aparece no menu lateral e no relatório. Pode ser alterado depois.</span>
          </label>
        </div>
        <div className="grid gap-px bg-ink sm:grid-cols-2 lg:grid-cols-3">
          {UTS.map((u) => (
            <button key={u.n} onClick={() => onPick(u.n, nome.trim())} className="group flex min-h-[170px] flex-col bg-white p-5 text-left transition-colors hover:bg-ink hover:text-white">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[44px] font-extrabold leading-none tracking-tight text-fire">{ROMANO[u.n]}</span>
                <span className="ref group-hover:text-white/50">art. 8.º n.º 1 {u.alinea}</span>
              </div>
              <span className="mt-2 font-display text-[17px] font-bold leading-tight">{u.nome}</span>
              <span className="mt-1.5 text-[12px] leading-snug text-ink-3 group-hover:text-white/70">{u.exemplos}</span>
              <span className="mt-auto pt-3 font-mono text-[10.5px] uppercase tracking-wider text-ink-4 group-hover:text-fire">{u.quadro} do anexo III</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
