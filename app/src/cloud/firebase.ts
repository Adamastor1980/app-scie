import { initializeApp, type FirebaseApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type Auth, type User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';

/**
 * Configuração do projeto Firebase (consola Firebase → Definições do projeto → As suas apps → Web).
 * Estes valores não são secretos: a proteção dos dados é feita pelas regras de segurança do Firestore.
 * Enquanto estiver vazio, a app funciona só com armazenamento local (como até aqui).
 */
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const nuvemDisponivel = () => !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function fb() {
  if (!nuvemDisponivel()) return null;
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    // cache local persistente: a app continua a funcionar sem internet e sincroniza quando a ligação volta
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  }
  return { app: app!, auth: auth!, db: db! };
}

export async function entrar() {
  const f = fb();
  if (!f) return;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(f.auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    // telemóveis e browsers que bloqueiam janelas: usa o redirecionamento
    if (code.includes('popup-blocked') || code.includes('operation-not-supported')) await signInWithRedirect(f.auth, provider);
    else throw e;
  }
}

export async function sair() {
  const f = fb();
  if (f) await signOut(f.auth);
}

export function aoMudarUtilizador(cb: (u: User | null) => void) {
  const f = fb();
  if (!f) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(f.auth, cb);
}
