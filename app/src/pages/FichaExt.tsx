import { useState } from 'react';
import { ArrowLeft, Check, ScanLine, Search, Undo2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import type { ExtintorInv, RegistoManut } from '../data/types';
import { novoPlanoManut } from '../store';
import { go } from '../router';
import { Faltas, Field, Text } from '../ui/primitives';
import LerQR from '../ui/LerQR';
import VideoExtintor from '../ui/VideoExtintor';
import ContactoAnomalia from '../ui/ContactoAnomalia';
import MensagemEpoca from '../ui/MensagemEpoca';
import { ChipEstado, LinhaExt } from './Manutencao';
import { periodoDe, TIPO_MANUT, dataPt, descExt, estadoExt, faltaEmpresa, hojeISO, lerUrlExt, procurarExt, registoOK, rotuloPisoInv } from '../engine/manutencao';

/** Histórico de intervenções de um extintor (do mais recente para o mais antigo) */
export function Historico({ registos }: { registos: (Omit<RegistoManut, 'id' | 'tecnico'> & { tecnico?: string })[] }) {
  const regs = [...registos].sort((a, b) => b.data.localeCompare(a.data));
  if (!regs.length) return <p className="text-[13px] text-ink-3">Ainda sem intervenções registadas.</p>;
  return (
    <ol className="flex flex-col">
      {regs.map((r, i) => (
        <li key={i} className="border-l-[3px] border-ink-4 py-2 pl-3 text-[13px]">
          <p><b>{dataPt(r.data)}</b> · {TIPO_MANUT[r.tipo]} · <span className={r.resultado === 'nao_conforme' ? 'font-semibold text-alerta' : r.resultado === 'conforme' ? 'font-semibold text-ok' : ''}>{r.resultado === 'conforme' ? 'Conforme' : r.resultado === 'nao_conforme' ? 'Não conforme' : 'resultado por indicar'}</span></p>
          <p className="text-[12px] text-ink-3">{[r.empresa && `${r.empresa}${r.registoAnepc ? ` (registo ANEPC ${r.registoAnepc})` : ''}`, r.tecnico].filter(Boolean).join(' · ')}</p>
          {r.obs && <p className="text-[12.5px] text-ink-2">{r.obs}</p>}
        </li>
      ))}
    </ol>
  );
}

/** Caixa de pesquisa pelo número escrito no extintor (também pelo local ou n.º de série) */
export function PesquisaExt({ lista, abrir, sub, autoFocus }: { lista: ExtintorInv[]; abrir: (e: ExtintorInv) => void; sub?: (e: ExtintorInv) => string; autoFocus?: boolean }) {
  const [q, setQ] = useState('');
  const res = procurarExt(lista, q).slice(0, 8);
  return (
    <div>
      <label className="relative block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input className="input h-11 pl-9 text-[15px]" inputMode="search" autoFocus={autoFocus} placeholder="Procurar pelo n.º do extintor (ex.: 7 ou EXT-07)" value={q}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && res[0]) abrir(res[0]); }} />
      </label>
      {q.trim() && (
        <div className="mt-1 border border-ink bg-white">
          {res.length ? res.map((e) => (
            <button key={e.id} className="flex w-full items-baseline gap-3 border-b border-paper-3 px-3 py-2.5 text-left text-[13px] last:border-0 hover:bg-paper" onClick={() => abrir(e)}>
              <span className="w-[70px] shrink-0 font-mono font-bold">{e.num}</span>
              <span className="min-w-0 flex-1 truncate">{sub ? sub(e) : `${rotuloPisoInv(e.piso)} · ${e.local || '—'}`}</span>
            </button>
          )) : <p className="px-3 py-2.5 text-[13px] text-ink-3">Nenhum extintor com «{q}».</p>}
        </div>
      )}
    </div>
  );
}

/** Ficha do extintor (aberta pelo QR ou pela pesquisa): histórico e registo rápido «tudo OK» */
export default function FichaExt({ eid }: { eid: string }) {
  const { p, up } = useP();
  const [qr, setQr] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [feito, setFeito] = useState<string | null>(null);
  const pl = p.manutencao;
  const e = pl?.extintores.find((x) => x.id === eid);
  const base = `/p/${p.id}`;
  if (!pl || !e) return (
    <main className="mx-auto max-w-[720px] px-4 py-10">
      <p className="mb-4 font-display text-[20px] font-bold">Extintor não encontrado neste projeto.</p>
      <button className="btn" onClick={() => go(`${base}/manutencao`)}>Plano de manutenção</button>
    </main>
  );
  const s = estadoExt(e, periodoDe(pl, e));
  const hoje = hojeISO();
  const jaHoje = e.registos.find((r) => r.data === hoje && r.tipo === 'manutencao' && r.resultado === 'conforme');
  const fe = faltaEmpresa(pl.empresa);
  const fc = (c: string) => (fe.some((f) => f[0] === c) ? 'falta' : '');
  const nomeEd = p.edificios.find((z) => z.id === e.edificio)?.nome ?? '';
  const upPl = (fn: (x: NonNullable<typeof pl>) => void) => up((q) => { fn(q.manutencao ??= novoPlanoManut()); });
  const upExt = (fn: (x: ExtintorInv) => void) => upPl((x) => { const z = x.extintores.find((k) => k.id === eid); if (z) fn(z); });
  const ok = () => { const r = registoOK(pl.empresa); upExt((x) => { x.registos.unshift(r); }); setFeito(r.id); navigator.vibrate?.(40); };
  const anular = () => { if (feito) upExt((x) => { x.registos = x.registos.filter((k) => k.id !== feito); }); setFeito(null); };
  const lido = (t: string) => {
    setQr(false);
    const u = lerUrlExt(t);
    if (u) go(u.pid === p.id ? `${base}/ext/${u.eid}` : `/x/${u.pid}/${u.eid}`);
    else alert('Este QR não é de um extintor da Cautela.');
  };

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-24 pt-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button className="btn-ghost" onClick={() => go(`${base}/manutencao`)}><ArrowLeft size={15} /> Plano de manutenção</button>
        <button className="btn h-10 px-3" onClick={() => setQr(true)}><ScanLine size={16} /> Ler outro QR</button>
      </div>

      <div className="border border-ink bg-white p-4 sm:p-5">
        <p className="font-mono text-[34px] font-extrabold leading-none tracking-tight">{e.num}</p>
        <p className="mt-2 text-[16px] font-semibold">{e.local || <span className="text-alerta">local por indicar</span>}</p>
        <p className="text-[13px] text-ink-3">{[nomeEd, rotuloPisoInv(e.piso)].filter(Boolean).join(' · ')}</p>
        <p className="mt-1 text-[13px]">{descExt(e) === '—' ? 'Tipo por indicar' : descExt(e)}{e.eficacia ? ` · eficácia ${e.eficacia}` : ''}{[e.fabricante, e.serie && `n.º série ${e.serie}`, e.ano && `fabrico ${e.ano}`].filter(Boolean).map((z) => ` · ${z}`).join('')}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
          <ChipEstado s={s} />
          {s.naoConforme && <span className="border border-alerta px-1.5 py-0.5 font-mono text-[11px] font-semibold text-alerta">ÚLTIMA: NÃO CONFORME</span>}
          {s.ultima && <span className="text-ink-3">última {dataPt(s.ultima.data)} · próxima {dataPt(s.proxima)}</span>}
        </div>
      </div>

      <div className="mt-4 border-l-[3px] border-ok bg-white p-4">
        {feito ? (
          <div>
            <p className="text-[15px] font-semibold text-ok">✓ Registado: manutenção de {dataPt(hoje)}, conforme.</p>
            <p className="mt-1 text-[13px]">Próxima manutenção: <b>{dataPt(estadoExt(e, periodoDe(pl, e)).proxima)}</b></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-fire h-11 px-4" onClick={() => setQr(true)}><ScanLine size={16} /> Ler o próximo</button>
              <button className="btn-ghost" onClick={anular}><Undo2 size={14} /> Anular</button>
            </div>
          </div>
        ) : jaHoje ? (
          <p className="text-[14px] font-semibold text-ok">✓ A manutenção de hoje já está registada (conforme).</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Empresa" className={fc('Empresa')}><Text value={pl.empresa.nome} onChange={(v) => upPl((x) => { x.empresa.nome = v; })} /></Field>
              <Field label="N.º de registo ANEPC" className={fc('N.º de registo ANEPC')}><Text value={pl.empresa.registoAnepc} onChange={(v) => upPl((x) => { x.empresa.registoAnepc = v; })} /></Field>
              <Field label="Técnico" className={fc('Técnico')}><Text value={pl.empresa.tecnico} onChange={(v) => upPl((x) => { x.empresa.tecnico = v; })} /></Field>
            </div>
            <Faltas itens={fe} titulo="Falta preencher" />
            <button className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 bg-ok px-4 text-[16px] font-bold text-white disabled:opacity-40" disabled={fe.length > 0} onClick={ok}>
              <Check size={20} /> Manutenção efetuada — está tudo OK
            </button>
            <p className="mt-1.5 text-[12px] text-ink-3">Regista hoje ({dataPt(hoje)}) uma manutenção periódica conforme; a próxima passa a contar daqui a {periodoDe(pl, e)} meses.</p>
          </>
        )}
        <button className="mt-3 text-[13px] font-semibold text-fire-ink hover:underline" onClick={() => setAberto(!aberto)}>{aberto ? 'Fechar' : 'Registar com observações, não conforme, recarga ou outra intervenção'}</button>
      </div>
      {aberto && (
        <div className="mt-3">
          <LinhaExt e={e} pl={pl} aberto alternar={() => setAberto(false)} upExt={upExt}
            duplicar={() => go(`${base}/manutencao`)}
            apagar={() => { if (confirm(`Apagar ${e.num} e o seu registo de manutenções?`)) { upPl((x) => { x.extintores = x.extintores.filter((z) => z.id !== e.id); }); go(`${base}/manutencao`); } }} />
        </div>
      )}

      <div className="mt-4"><MensagemEpoca /></div>

      <div className="mt-4"><ContactoAnomalia nome={p.autoprotecao?.rs?.nome} telefone={p.autoprotecao?.rs?.telefone} empresa={pl.empresa.nome} carretel={e.equip === 'carretel'} /></div>
      {e.equip !== 'carretel' && <div className="mt-4"><VideoExtintor /></div>}

      <h2 className="mb-2 mt-6 font-display text-[18px] font-bold">Histórico</h2>
      <Historico registos={e.registos} />

      {qr && (
        <LerQR onLido={lido} onFechar={() => setQr(false)}>
          <PesquisaExt lista={pl.extintores} abrir={(x) => { setQr(false); go(`${base}/ext/${x.id}`); }} />
        </LerQR>
      )}
    </main>
  );
}
