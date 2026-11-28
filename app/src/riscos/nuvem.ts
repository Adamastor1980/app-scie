import { useEffect } from 'react';
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { fb } from '../cloud/firebase';
import { useNuvem } from '../cloud/sync';
import { useRiscos } from './store';
import type { AvaliacaoRiscos } from './tipos';

/**
 * Sincronização do módulo de riscos com a conta (coleção própria users/{uid}/riscos) — independente da do SCIE.
 * Usa apenas a sessão comum (useNuvem.user). As regras da Firebase já cobrem users/{uid}/**.
 */
const limpo = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let parar: (() => void)[] = [];
const enviados = new Map<string, number>();
let remoto = false;
let timer: ReturnType<typeof setTimeout> | null = null;

async function iniciar(uid: string) {
  const f = fb();
  if (!f) return;
  const col = collection(f.db, 'users', uid, 'riscos');
  const snap = await getDocs(col);
  const st = useRiscos.getState();
  const locais = new Map(st.avaliacoes.map((a) => [a.id, a]));
  for (const d of snap.docs) {
    const r = d.data() as AvaliacaoRiscos;
    if (st.apagadas[r.id]) continue;
    const l = locais.get(r.id);
    if (!l || r.atualizadoEm >= l.atualizadoEm) locais.set(r.id, r);
    enviados.set(r.id, r.atualizadoEm);
  }
  remoto = true;
  useRiscos.setState({ avaliacoes: [...locais.values()].sort((a, b) => b.atualizadoEm - a.atualizadoEm) });
  remoto = false;
  await enviar(uid);
  const u1: Unsubscribe = onSnapshot(col, (s) => {
    if (s.metadata.hasPendingWrites) return;
    const atual = useRiscos.getState();
    let mudou = false;
    const lista = [...atual.avaliacoes];
    s.docChanges().forEach((c) => {
      const r = c.doc.data() as AvaliacaoRiscos;
      const i = lista.findIndex((a) => a.id === c.doc.id);
      if (c.type === 'removed') { if (i >= 0) { lista.splice(i, 1); mudou = true; } enviados.delete(c.doc.id); return; }
      if (atual.apagadas[r.id]) return;
      enviados.set(r.id, r.atualizadoEm);
      if (i < 0) { lista.unshift(r); mudou = true; } else if (r.atualizadoEm > lista[i].atualizadoEm) { lista[i] = r; mudou = true; }
    });
    if (mudou) { remoto = true; useRiscos.setState({ avaliacoes: lista }); remoto = false; }
  });
  const u2 = useRiscos.subscribe(() => {
    if (remoto) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { enviar(uid).catch(() => undefined); }, 1200);
  });
  parar = [u1, u2];
}

async function enviar(uid: string) {
  const f = fb();
  if (!f) return;
  const st = useRiscos.getState();
  const tarefas: Promise<unknown>[] = [];
  for (const a of st.avaliacoes) {
    if (enviados.get(a.id) === a.atualizadoEm) continue;
    enviados.set(a.id, a.atualizadoEm);
    tarefas.push(setDoc(doc(f.db, 'users', uid, 'riscos', a.id), limpo(a)).catch(() => enviados.delete(a.id)));
  }
  for (const id of Object.keys(st.apagadas)) {
    tarefas.push(deleteDoc(doc(f.db, 'users', uid, 'riscos', id)).then(() => {
      const ap = { ...useRiscos.getState().apagadas }; delete ap[id]; remoto = true; useRiscos.setState({ apagadas: ap }); remoto = false; enviados.delete(id);
    }).catch(() => undefined));
  }
  await Promise.all(tarefas);
}

function terminar(limparLocal: boolean) {
  parar.forEach((p) => p()); parar = []; enviados.clear();
  if (limparLocal) { remoto = true; useRiscos.setState({ avaliacoes: [], apagadas: {} }); remoto = false; }
}

/** Liga a sincronização do módulo de riscos à sessão comum (chamado uma vez na raiz da app) */
export function useLigacaoRiscos() {
  useEffect(() => {
    let atual: string | null = null;
    const ver = (uid: string | null) => {
      if (uid === atual) return;
      if (atual) terminar(!uid); // terminou a sessão: os dados ficam na nuvem e saem deste aparelho, como no SCIE
      atual = uid;
      if (uid) iniciar(uid).catch(() => undefined);
    };
    ver(useNuvem.getState().user?.uid ?? null);
    return useNuvem.subscribe((s) => ver(s.user?.uid ?? null));
  }, []);
}
