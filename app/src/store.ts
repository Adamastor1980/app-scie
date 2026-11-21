import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { Autoprotecao, Compartimento, Edificio, Espaco, Piso, Projeto, UT, UTNum } from './data/types';
import { utInfo } from './data/rjscie';
import { normalizarLocal } from './engine/calc';

/** Local A com efetivo > 100 ou público > 50 passa sempre a B (RJ-SCIE art. 10.º n.º 1 b)), seja qual for o ecrã onde se editou. */
const locaisCoerentes = (p: Projeto) => p.edificios.forEach((ed) => ed.uts.forEach((u) => u.espacos.forEach((e) => normalizarLocal(e))));

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const idbStorage: StateStorage = {
  getItem: async (k) => (await get(k)) ?? null,
  setItem: async (k, v) => set(k, v),
  removeItem: async (k) => del(k),
};

export const novaUT = (tipo: UTNum): UT => ({
  id: uid(),
  tipo,
  designacao: `UT ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][tipo - 1]} — ${utInfo(tipo).nome}`,
  descricao: '',
  altura: 0,
  pisosAbaixo: 0,
  areaBruta: 0,
  arLivre: false,
  exclusivoArmazem: false,
  saidaIndependenteD: false,
  usarEfetivoManual: false,
  pisos: [],
  espacos: [],
  compartimentos: [],
  observacoes: '',
  casoXII: tipo === 12 ? 3 : undefined,
});

export const novoEdificio = (n: number): Edificio => ({
  id: uid(),
  nome: `Edifício ${n}`,
  descricao: '',
  altura: 0,
  pisosAcima: 1,
  pisosAbaixo: 0,
  independente: true,
  comunicacoesComuns: false,
  uts: [],
});

export const novoEspaco = (tipo?: UTNum): Espaco =>
  tipo === 12
    ? { id: uid(), nome: '', piso: 'Piso 0', local: 'A', criterio: 'declarado', n: 0, area: 0 }
    : { id: uid(), nome: '', piso: 'Piso 0', local: 'A', criterio: 'indice', indiceId: 'sala-escritorio', area: 0 };

export const novoPiso = (i: number): Piso => ({ id: uid(), nome: `Piso ${i}`, cota: i * 3, area: 0 });

export const novoCompartimento = (n: number): Compartimento => ({
  id: uid(), nome: `Compartimento corta-fogo ${n}`, area: 0, metodo: 'probabilistico', itens: [], atividades: [], armazens: [], regraRai: true,
});

export const novaAutoprotecao = (): Autoprotecao => ({
  rs: { nome: '', cargo: '', telefone: '', email: '' },
  delegado: { nome: '', cargo: '', telefone: '', email: '' },
  equipa: [],
  fundamentacaoEquipa: '',
  postoSeguranca: '',
  horario: '',
  contactos: [
    { id: uid(), entidade: 'Número Europeu de Emergência', telefone: '112' },
    { id: uid(), entidade: 'Corpo de bombeiros da área', telefone: '' },
    { id: uid(), entidade: 'Serviço municipal de proteção civil', telefone: '' },
  ],
  registos: [],
});

export const novoProjeto = (): Projeto => ({
  id: uid(),
  nome: 'Novo projeto',
  referencia: '',
  cliente: '',
  morada: '',
  concelho: '',
  distrito: '',
  coordenadas: '',
  tipoIntervencao: 'Edifício existente — avaliação das condições de SCIE',
  objetivo: '',
  data: new Date().toISOString().slice(0, 10),
  versao: '1.0',
  autor: { nome: '', qualificacao: '', ordem: '', numero: '', registoAnepc: '', email: '' },
  empresa: { nome: '', nif: '', morada: '', telefone: '', email: '', website: '', alvara: '', apresentacao: '' },
  edificios: [novoEdificio(1)],
  plantas: [],
  conclusoes: '',
  criadoEm: Date.now(),
  atualizadoEm: Date.now(),
});

interface State {
  projetos: Projeto[];
  empresaPadrao: Projeto['empresa'] | null;
  autorPadrao: Projeto['autor'] | null;
  criar: () => string;
  importar: (p: Projeto) => string;
  duplicar: (id: string) => string;
  apagar: (id: string) => void;
  atualizar: (id: string, fn: (p: Projeto) => void) => void;
  guardarPadrao: (p: Projeto) => void;
  /** Perfil de quem faz os projetos (empresa e autor): aplicado a todos os projetos */
  setPerfil: (fn: (e: Projeto['empresa'], a: Projeto['autor']) => void) => void;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export const useStore = create<State>()(
  persist(
    (setS, getS) => ({
      projetos: [],
      empresaPadrao: null,
      autorPadrao: null,
      criar: () => {
        const p = novoProjeto();
        const { empresaPadrao, autorPadrao } = getS();
        if (empresaPadrao) p.empresa = clone(empresaPadrao);
        if (autorPadrao) p.autor = clone(autorPadrao);
        setS((s) => ({ projetos: [p, ...s.projetos] }));
        return p.id;
      },
      importar: (p) => {
        const n = { ...clone(p), id: uid(), atualizadoEm: Date.now() };
        locaisCoerentes(n);
        // perfil «A minha empresa»: completa os campos em falta com os do projeto importado (ex.: logótipo) e aplica-o
        const { empresaPadrao, autorPadrao } = getS();
        const e = { ...(n.empresa ?? {}), ...Object.fromEntries(Object.entries(empresaPadrao ?? {}).filter(([, v]) => v)) } as Projeto['empresa'];
        const a = { ...(n.autor ?? {}), ...Object.fromEntries(Object.entries(autorPadrao ?? {}).filter(([, v]) => v)) } as Projeto['autor'];
        n.empresa = e;
        n.autor = a;
        if (e.nome || a.nome) setS((st) => ({ empresaPadrao: clone(e), autorPadrao: clone(a), projetos: st.projetos.map((p) => ({ ...p, empresa: clone(e), autor: clone(a) })) }));
        setS((s) => ({ projetos: [n, ...s.projetos] }));
        return n.id;
      },
      duplicar: (id) => {
        const o = getS().projetos.find((p) => p.id === id);
        if (!o) return id;
        // não acumula «(cópia) (cópia)…»: usa o nome base e numera (cópia 2, cópia 3…)
        const base = o.nome.replace(/(\s*\(cópia(?: \d+)?\))+$/, '');
        const nomes = new Set(getS().projetos.map((p) => p.nome));
        let nome = `${base} (cópia)`;
        for (let k = 2; nomes.has(nome); k++) nome = `${base} (cópia ${k})`;
        const c = clone(o);
        c.plantas = c.plantas.map((pl) => ({ ...pl, id: uid() }));
        c.edificios.forEach((e) => e.uts.forEach((u) => { u.levantamento = u.levantamento?.map((a) => ({ ...a, id: uid() })); }));
        c.autoprotecao?.registos.forEach((r) => { r.anexos = r.anexos?.map((a) => ({ ...a, id: uid() })); });
        const n = { ...c, id: uid(), nome, criadoEm: Date.now(), atualizadoEm: Date.now() };
        setS((s) => ({ projetos: [n, ...s.projetos] }));
        return n.id;
      },
      apagar: (id) => setS((s) => ({ projetos: s.projetos.filter((p) => p.id !== id) })),
      atualizar: (id, fn) =>
        setS((s) => ({
          projetos: s.projetos.map((p) => {
            if (p.id !== id) return p;
            const c = clone(p);
            fn(c);
            locaisCoerentes(c);
            c.atualizadoEm = Date.now();
            return c;
          }),
        })),
      guardarPadrao: (p) => setS({ empresaPadrao: clone(p.empresa), autorPadrao: clone(p.autor) }),
      setPerfil: (fn) =>
        setS((s) => {
          const e = clone(s.empresaPadrao ?? novoProjeto().empresa);
          const a = clone(s.autorPadrao ?? novoProjeto().autor);
          fn(e, a);
          return { empresaPadrao: e, autorPadrao: a, projetos: s.projetos.map((p) => ({ ...p, empresa: clone(e), autor: clone(a) })) };
        }),
    }),
    {
      name: 'scie-app-v1',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (st) => {
        if (!st || st.empresaPadrao?.nome || st.autorPadrao?.nome) return;
        const fonte = [...st.projetos].sort((a, b) => b.atualizadoEm - a.atualizadoEm).find((p) => p.empresa?.nome || p.autor?.nome);
        if (fonte) setTimeout(() => useStore.getState().setPerfil((e, a) => { Object.assign(e, fonte.empresa); Object.assign(a, fonte.autor); }), 0);
      },
    },
  ),
);
