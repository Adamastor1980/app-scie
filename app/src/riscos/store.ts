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
  /** fotografias: id → imagem (dataURL). Na nuvem cada uma vai num documento próprio (limite de 1 MiB por documento) */
  fotos: Record<string, string>;
  juntarFoto: (aid: string, lid: string, imagem: string) => void;
  tirarFoto: (aid: string, lid: string, fid: string) => void;
  criar: (versao: VersaoSSARA) => string;
  atualizar: (id: string, fn: (a: AvaliacaoRiscos) => void) => void;
  apagar: (id: string) => void;
  duplicar: (id: string) => void;
}
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
/** tira as fotografias que nenhuma avaliação usa */
const semOrfas = (fotos: Record<string, string>, avs: AvaliacaoRiscos[]) => { const u = new Set(avs.flatMap((a) => a.riscos.flatMap((l) => (l.fotos ?? []).map((f) => f.id)))); return Object.fromEntries(Object.entries(fotos).filter(([id]) => u.has(id))); };

export const useRiscos = create<EstadoRiscos>()(
  persist(
    (setS) => ({
      avaliacoes: [],
      apagadas: {},
      fotos: {},
      juntarFoto: (aid, lid, imagem) => setS((s) => {
        const id = rid();
        return {
          fotos: { ...s.fotos, [id]: imagem },
          avaliacoes: s.avaliacoes.map((a) => { if (a.id !== aid) return a; const c = clone(a); const l = c.riscos.find((x) => x.id === lid); if (l) (l.fotos ??= []).push({ id, legenda: '' }); c.atualizadoEm = Date.now(); return c; }),
        };
      }),
      tirarFoto: (aid, lid, fid) => setS((s) => {
        const avaliacoes = s.avaliacoes.map((a) => { if (a.id !== aid) return a; const c = clone(a); const l = c.riscos.find((x) => x.id === lid); if (l) l.fotos = (l.fotos ?? []).filter((f) => f.id !== fid); c.atualizadoEm = Date.now(); return c; });
        return { avaliacoes, fotos: semOrfas(s.fotos, avaliacoes) };
      }),
      criar: (versao) => { const a = novaAvaliacao(versao); setS((s) => ({ avaliacoes: [a, ...s.avaliacoes] })); return a.id; },
      atualizar: (id, fn) => setS((s) => ({ avaliacoes: s.avaliacoes.map((a) => { if (a.id !== id) return a; const c = clone(a); fn(c); c.atualizadoEm = Date.now(); return c; }) })),
      apagar: (id) => setS((s) => { const avaliacoes = s.avaliacoes.filter((a) => a.id !== id); return { avaliacoes, fotos: semOrfas(s.fotos, avaliacoes), apagadas: { ...s.apagadas, [id]: Date.now() } }; }),
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
