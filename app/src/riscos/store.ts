import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { AvaliacaoRiscos, VersaoSSARA } from './tipos';
import { novaAvaliacao, rid } from './dados';

/** Armazenamento próprio do módulo de riscos (independente dos projetos SCIE) */
const idb: StateStorage = { getItem: async (k) => (await get(k)) ?? null, setItem: async (k, v) => set(k, v), removeItem: async (k) => del(k) };

interface EstadoRiscos {
  avaliacoes: AvaliacaoRiscos[];
  /** apagadas neste aparelho e ainda não apagadas na nuvem: id → momento */
  apagadas: Record<string, number>;
  criar: (versao: VersaoSSARA) => string;
  atualizar: (id: string, fn: (a: AvaliacaoRiscos) => void) => void;
  apagar: (id: string) => void;
  duplicar: (id: string) => void;
}
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export const useRiscos = create<EstadoRiscos>()(
  persist(
    (setS) => ({
      avaliacoes: [],
      apagadas: {},
      criar: (versao) => { const a = novaAvaliacao(versao); setS((s) => ({ avaliacoes: [a, ...s.avaliacoes] })); return a.id; },
      atualizar: (id, fn) => setS((s) => ({ avaliacoes: s.avaliacoes.map((a) => { if (a.id !== id) return a; const c = clone(a); fn(c); c.atualizadoEm = Date.now(); return c; }) })),
      apagar: (id) => setS((s) => ({ avaliacoes: s.avaliacoes.filter((a) => a.id !== id), apagadas: { ...s.apagadas, [id]: Date.now() } })),
      duplicar: (id) => setS((s) => {
        const o = s.avaliacoes.find((a) => a.id === id);
        if (!o) return s;
        const c = { ...clone(o), id: rid(), titulo: `${o.titulo} (cópia)`, criadoEm: Date.now(), atualizadoEm: Date.now() };
        return { avaliacoes: [c, ...s.avaliacoes] };
      }),
    }),
    { name: 'cautela-riscos-v1', storage: createJSONStorage(() => idb) },
  ),
);
