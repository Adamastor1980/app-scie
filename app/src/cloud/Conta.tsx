import { useEffect } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { aoMudarUtilizador, entrar, nuvemDisponivel, sair } from './firebase';
import { iniciarSincronizacao, terminarSessao, useNuvem } from './sync';

/** Liga a sessão Google à sincronização (chamado uma vez na raiz da app) */
export function useLigacaoNuvem() {
  useEffect(() => {
    if (!nuvemDisponivel()) return;
    return aoMudarUtilizador((u) => {
      if (u) iniciarSincronizacao(u);
    });
  }, []);
}

const ESTADOS = {
  local: { t: 'Só neste computador', c: 'text-white/50', I: CloudOff },
  a_ligar: { t: 'A ligar…', c: 'text-white/70', I: RefreshCw },
  a_sincronizar: { t: 'A guardar na nuvem…', c: 'text-amber-300', I: RefreshCw },
  sincronizado: { t: 'Guardado na nuvem', c: 'text-emerald-400', I: Cloud },
  offline: { t: 'Sem ligação — guardado neste computador', c: 'text-amber-300', I: CloudOff },
  erro: { t: 'Erro de sincronização', c: 'text-red-400', I: CloudOff },
} as const;

export default function Conta() {
  const { estado, user, erro } = useNuvem();
  if (!nuvemDisponivel()) return null;
  const e = ESTADOS[estado];
  if (!user) {
    return (
      <button onClick={() => entrar().catch((x) => alert('Não foi possível entrar: ' + (x as Error).message))} className="flex h-9 items-center gap-2 bg-white px-3 text-[13px] font-semibold text-ink hover:bg-fire hover:text-white">
        <LogIn size={15} /> Entrar com Google
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className={`flex items-center gap-1.5 text-[11.5px] ${e.c}`} title={erro}>
        <e.I size={14} className={estado === 'a_sincronizar' || estado === 'a_ligar' ? 'animate-spin' : ''} /> {e.t}
      </span>
      {user.foto ? <img src={user.foto} className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" /> : null}
      <span className="hidden text-[12px] text-white/80 xl:inline">{user.nome}</span>
      <button
        title="Terminar sessão"
        className="flex h-8 items-center gap-1.5 px-2 text-[12px] text-white/60 hover:text-white"
        onClick={async () => {
          if (!confirm('Terminar sessão? Os projetos ficam guardados na nuvem e são removidos deste computador.')) return;
          await terminarSessao();
          await sair();
        }}
      >
        <LogOut size={14} /> Sair
      </button>
    </div>
  );
}
