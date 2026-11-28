import { useEffect } from 'react';
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { fb } from '../cloud/firebase';
import { useNuvem } from '../cloud/sync';
import { useFPS } from './store';
import type { FPS } from './tipos';

/** Sincronização do módulo FPS (users/{uid}/fps) — usa só a sessão comum */
const limpo = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let parar: (() => void)[] = [];
const enviados = new Map<string, number>();
let remoto = false;
let timer: ReturnType<typeof setTimeout> | null = null;

async function iniciar(uid: string) {
  const f = fb();
  if (!f) return;
  const col = collection(f.db, 'users', uid, 'fps');
  const snap = await getDocs(col);
  const st = useFPS.getState();
  const locais = new Map(st.fichas.map((a) => [a.id, a]));
  for (const d of snap.docs) {
    const r = d.data() as FPS;
    if (st.apagadas[r.id]) continue;
    const l = locais.get(r.id);
    if (!l || r.atualizadoEm >= l.atualizadoEm) locais.set(r.id, r);
    enviados.set(r.id, r.atualizadoEm);
  }
  remoto = true; useFPS.setState({ fichas: [...locais.values()].sort((a, b) => b.atualizadoEm - a.atualizadoEm) }); remoto = false;
  await enviar(uid);
  const u1: Unsubscribe = onSnapshot(col, (s) => {
    if (s.metadata.hasPendingWrites) return;
    const atual = useFPS.getState();
    let mudou = false;
    const lista = [...atual.fichas];
    s.docChanges().forEach((c) => {
      const r = c.doc.data() as FPS;
      const i = lista.findIndex((a) => a.id === c.doc.id);
      if (c.type === 'removed') { if (i >= 0) { lista.splice(i, 1); mudou = true; } enviados.delete(c.doc.id); return; }
      if (atual.apagadas[r.id]) return;
      enviados.set(r.id, r.atualizadoEm);
      if (i < 0) { lista.unshift(r); mudou = true; } else if (r.atualizadoEm > lista[i].atualizadoEm) { lista[i] = r; mudou = true; }
    });
    if (mudou) { remoto = true; useFPS.setState({ fichas: lista }); remoto = false; }
  });
  const u2 = useFPS.subscribe(() => {
    if (remoto) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { enviar(uid).catch(() => undefined); }, 1200);
  });
  parar = [u1, u2];
}

async function enviar(uid: string) {
  const f = fb();
  if (!f) return;
  const st = useFPS.getState();
  const t: Promise<unknown>[] = [];
  for (const a of st.fichas) {
    if (enviados.get(a.id) === a.atualizadoEm) continue;
    enviados.set(a.id, a.atualizadoEm);
    t.push(setDoc(doc(f.db, 'users', uid, 'fps', a.id), limpo(a)).catch(() => enviados.delete(a.id)));
  }
  for (const id of Object.keys(st.apagadas)) {
    t.push(deleteDoc(doc(f.db, 'users', uid, 'fps', id)).then(() => {
      const ap = { ...useFPS.getState().apagadas }; delete ap[id]; remoto = true; useFPS.setState({ apagadas: ap }); remoto = false; enviados.delete(id);
    }).catch(() => undefined));
  }
  await Promise.all(t);
}

function terminar(limparLocal: boolean) {
  parar.forEach((p) => p()); parar = []; enviados.clear();
  if (limparLocal) { remoto = true; useFPS.setState({ fichas: [], apagadas: {} }); remoto = false; }
}

/** Liga a sincronização do módulo FPS à sessão comum (chamado uma vez na raiz da app) */
export function useLigacaoFPS() {
  useEffect(() => {
    let atual: string | null = null;
    const ver = (uid: string | null) => {
      if (uid === atual) return;
      if (atual) terminar(!uid);
      atual = uid;
      if (uid) iniciar(uid).catch(() => undefined);
    };
    ver(useNuvem.getState().user?.uid ?? null);
    return useNuvem.subscribe((s) => ver(s.user?.uid ?? null));
  }, []);
}
