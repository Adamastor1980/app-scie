import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { FPS } from './tipos';
import { fid, novaFPS } from './dados';

/** Armazenamento próprio do módulo FPS (independente dos outros módulos) */
const idb: StateStorage = { getItem: async (k) => (await get(k)) ?? null, setItem: async (k, v) => set(k, v), removeItem: async (k) => del(k) };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

interface EstadoFPS {
  fichas: FPS[];
  apagadas: Record<string, number>;
  criar: () => string;
  atualizar: (id: string, fn: (f: FPS) => void) => void;
  apagar: (id: string) => void;
  duplicar: (id: string) => void;
}

export const useFPS = create<EstadoFPS>()(
  persist(
    (setS) => ({
      fichas: [], apagadas: {},
      criar: () => { const f = novaFPS(); setS((s) => ({ fichas: [f, ...s.fichas] })); return f.id; },
      atualizar: (id, fn) => setS((s) => ({ fichas: s.fichas.map((f) => { if (f.id !== id) return f; const c = clone(f); fn(c); c.atualizadoEm = Date.now(); return c; }) })),
      apagar: (id) => setS((s) => ({ fichas: s.fichas.filter((f) => f.id !== id), apagadas: { ...s.apagadas, [id]: Date.now() } })),
      duplicar: (id) => setS((s) => { const o = s.fichas.find((f) => f.id === id); if (!o) return s; return { fichas: [{ ...clone(o), id: fid(), titulo: `${o.titulo} (cópia)`, criadoEm: Date.now(), atualizadoEm: Date.now() }, ...s.fichas] }; }),
    }),
    { name: 'cautela-fps-v1', storage: createJSONStorage(() => idb) },
  ),
);
