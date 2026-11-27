import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { lerPublico, useNuvem } from '../cloud/sync';
import { nuvemDisponivel } from '../cloud/firebase';
import { estadoExt, rotuloPisoInv, type FichaPublicaDoc } from '../engine/manutencao';
import type { ExtintorInv } from '../data/types';
import { ChipEstado } from './Manutencao';
import { Historico } from './FichaExt';
import VideoExtintor from '../ui/VideoExtintor';
import ContactoAnomalia from '../ui/ContactoAnomalia';
import MensagemEpoca from '../ui/MensagemEpoca';
import { NomeApp, Simbolo } from '../ui/Marca';

/**
 * Endereço do QR de um extintor (#/x/projeto/extintor).
 * Quem tem o projeto (dono, com sessão ou neste aparelho) vai para a ficha completa;
 * os outros (cliente) veem a ficha pública só de leitura, se o técnico a partilhou.
 */
export default function AbrirQR({ pid, eid }: { pid: string; eid: string }) {
  const tem = useStore((s) => s.projetos.some((p) => p.id === pid && p.manutencao?.extintores.some((e) => e.id === eid)));
  const { user, estado, verificado } = useNuvem();
  const aSincronizar = !!user && (estado === 'a_ligar' || estado === 'a_sincronizar');
  const [pub, setPub] = useState<FichaPublicaDoc | null | 'a_ler' | 'erro'>('a_ler');

  useEffect(() => { if (tem) go(`/p/${pid}/ext/${eid}`); }, [tem, pid, eid]);
  useEffect(() => {
    if (tem || aSincronizar || (nuvemDisponivel() && !verificado)) return;
    if (!nuvemDisponivel()) { setPub(null); return; }
    lerPublico(pid, eid).then(setPub).catch(() => setPub('erro'));
  }, [tem, aSincronizar, verificado, pid, eid]);

  const quadro = (c: React.ReactNode) => (
    <div className="min-h-[100dvh] bg-paper">
      <header className="flex h-14 items-center gap-2.5 border-b border-black bg-ink px-4"><Simbolo className="h-8 w-8" c="#F9F8F3" /><NomeApp claro className="text-[16px]" /></header>
      <main className="mx-auto max-w-[640px] px-4 pb-16 pt-6">{c}</main>
    </div>
  );
  if (tem || pub === 'a_ler') return quadro(<p className="font-mono text-sm text-ink-3">A abrir o extintor…</p>);
  if (pub === 'erro') return quadro(<p className="text-[14px]">Não foi possível ler a ficha (sem rede?). Tente de novo com ligação à internet.</p>);
  const e = pub?.extintor;
  if (!pub || !e) return quadro(
    <div>
      <p className="font-display text-[20px] font-bold">Ficha não disponível</p>
      <p className="mt-2 text-[14px] text-ink-2">Este extintor não tem ficha partilhada. Se é o técnico responsável, entre na app com a sua conta para ver o histórico e registar a manutenção.</p>
      <button className="btn mt-4" onClick={() => go('/')}>Entrar na app</button>
    </div>,
  );
  const s = estadoExt({ ...(e as unknown as ExtintorInv), registos: e.registos.map((r, i) => ({ ...r, tecnico: '', id: String(i) })) }, pub.periodoMeses);
  return quadro(
    <div>
      <p className="label !text-fire-ink">Ficha do extintor · só leitura</p>
      <div className="mt-2 border border-ink bg-white p-4">
        <p className="font-mono text-[32px] font-extrabold leading-none">{e.num}</p>
        <p className="mt-2 text-[16px] font-semibold">{e.local}</p>
        <p className="text-[13px] text-ink-3">{[pub.projeto, e.edificio, rotuloPisoInv(e.piso)].filter(Boolean).join(' · ')}</p>
        <p className="mt-1 text-[13px]">{e.desc}{e.eficacia ? ` · eficácia ${e.eficacia}` : ''}{e.ano ? ` · fabrico ${e.ano}` : ''}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2"><ChipEstado s={s} />{s.naoConforme && <span className="border border-alerta px-1.5 py-0.5 font-mono text-[11px] font-semibold text-alerta">ÚLTIMA: NÃO CONFORME</span>}</div>
      </div>
      <div className="mt-4"><MensagemEpoca /></div>
      <div className="mt-4"><ContactoAnomalia nome={pub.contacto?.nome} telefone={pub.contacto?.telefone} empresa={pub.manutencao} carretel={e.equip === 'carretel'} /></div>
      {e.equip !== 'carretel' && <div className="mt-4"><VideoExtintor /></div>}
      <h2 className="mb-2 mt-6 font-display text-[18px] font-bold">Histórico de manutenção</h2>
      <Historico registos={e.registos} />
      {pub.empresa.nome && <p className="mt-6 border-t border-paper-3 pt-3 text-[12.5px] text-ink-3">Plano de manutenção gerido por <b className="text-ink">{pub.empresa.nome}</b>{[pub.empresa.telefone, pub.empresa.email].filter(Boolean).map((x) => ` · ${x}`).join('')}.</p>}
    </div>,
  );
}
