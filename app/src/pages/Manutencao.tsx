import { useEffect, useState } from 'react';
import { Building2, ListPlus, ChevronDown, ChevronRight, Copy, FileText, Plus, QrCode, ScanLine, Sheet, Trash2, Wrench } from 'lucide-react';
import LerQR from '../ui/LerQR';
import { PesquisaExt } from './FichaExt';
import { go } from '../router';
import { apagarPublico, useNuvem } from '../cloud/sync';
import { lerUrlExt } from '../engine/manutencao';
import { useP } from './ProjetoShell';
import VerificacaoExt from './VerificacaoExt';
import { opcoesServe } from '../engine/verificacaoExt';
import type { AgenteInv, ExtintorInv, PlanoManut, RegistoManut, TipoManut } from '../data/types';
import { novoEdificio, novoPlanoManut, uid } from '../store';
import { Area, Faltas, Field, Num, Section, Text, mostrarNovo } from '../ui/primitives';
import {
  NOME_AGENTE_INV, TIPO_MANUT, inventarioDoMapa, UNID_INV, dataPt, descExt, estadoExt, faltaExt, faltaReg, hojeISO, ordenar, proximoNum, resumoManut, rotuloPisoInv, type EstadoExt,
} from '../engine/manutencao';

const CAPS: Record<AgenteInv, number[]> = { agua: [2, 3, 6, 9], espuma: [2, 3, 6, 9], po: [1, 2, 3, 4, 6, 9, 12, 25, 50], co2: [2, 5], outro: [] };
const PISOS = Array.from({ length: 36 }, (_, k) => 30 - k); // 30 … −5

export const COR_NIVEL: Record<EstadoExt['nivel'], string> = {
  ok: 'border-ok bg-ok-soft text-ok', breve: 'border-warn bg-warn-soft text-ink', atraso: 'border-alerta bg-alerta-soft text-alerta', sem: 'border-ink-4 bg-paper text-ink-3',
};
export function ChipEstado({ s, curto }: { s: EstadoExt; curto?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center border px-2 py-0.5 font-mono text-[11px] font-semibold ${COR_NIVEL[s.nivel]}`}>
      {s.texto}{!curto && s.proxima ? ` · ${dataPt(s.proxima)}` : ''}
    </span>
  );
}

/** Painel do plano de manutenção: contagens e o que é urgente */
export function ResumoManut({ pl }: { pl: PlanoManut | undefined }) {
  const r = resumoManut(pl);
  const cx = (n: number, t: string, cls: string) => (
    <div className={`border-l-[3px] bg-white px-3 py-2 ${cls}`}><p className="font-display text-[26px] font-extrabold leading-none">{n}</p><p className="mt-1 text-[11.5px] text-ink-2">{t}</p></div>
  );
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cx(r.atraso, 'em atraso', r.atraso ? 'border-alerta text-alerta' : 'border-paper-3')}
      {cx(r.breve, `nos próximos 60 dias`, r.breve ? 'border-warn' : 'border-paper-3')}
      {cx(r.ok, 'em dia', 'border-ok')}
      {cx(r.sem, 'sem manutenção registada', r.sem ? 'border-ink-4' : 'border-paper-3')}
    </div>
  );
}

const novoExt = (lista: ExtintorInv[], edificio: string, base?: Partial<ExtintorInv>): ExtintorInv => ({
  id: uid(), num: proximoNum(lista), edificio, piso: base?.piso ?? null, local: '', agente: base?.agente ?? '', cap: base?.cap ?? 0, eficacia: base?.eficacia ?? '', fabricante: base?.fabricante ?? '', serie: '', ano: base?.ano, registos: [],
});
const novoReg = (pl: PlanoManut, data = hojeISO()): RegistoManut => ({ id: uid(), data, tipo: 'manutencao', resultado: '', empresa: pl.empresa.nome, registoAnepc: pl.empresa.registoAnepc, tecnico: pl.empresa.tecnico, obs: '' });

export default function Manutencao() {
  const { p, up } = useP();
  const base = `#/p/${p.id}`;
  const pl = p.manutencao;
  useEffect(() => { if (!p.manutencao) up((q) => { q.manutencao = novoPlanoManut(); }); }, [p.manutencao, up]);
  const [aberto, setAberto] = useState<Set<string>>(new Set());
  const [qr, setQr] = useState(false);
  const [etq, setEtq] = useState<{ ed: string; inicio: number } | null>(null);
  const user = useNuvem((n) => n.user);
  const avisoPublico = useNuvem((n) => n.avisoPublico);
  const [lote, setLote] = useState<{ data: string; tipo: TipoManut; ed: string } | null>(null);
  if (!pl) return null;

  const soManut = p.modo === 'manutencao';
  const upPl = (fn: (pl: PlanoManut) => void) => up((q) => { fn(q.manutencao ??= novoPlanoManut()); });
  const upExt = (id: string, fn: (e: ExtintorInv) => void) => upPl((x) => { const e = x.extintores.find((z) => z.id === id); if (e) fn(e); });
  const alternar = (id: string) => setAberto((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const acrescentar = (edificio: string, modelo?: ExtintorInv) => {
    const ultimo = modelo ?? [...pl.extintores].reverse().find((e) => e.edificio === edificio);
    const e = novoExt(pl.extintores, edificio, ultimo ? { piso: ultimo.piso, agente: ultimo.agente, cap: ultimo.cap, eficacia: ultimo.eficacia, fabricante: ultimo.fabricante, ano: modelo?.ano } : undefined);
    if (modelo) e.local = modelo.local;
    upPl((x) => { x.extintores.push(e); });
    setAberto((s) => new Set(s).add(e.id));
    mostrarNovo(e.id);
  };
  const ordemEd = p.edificios.map((e) => e.id);
  const lista = ordenar(pl.extintores, ordemEd);

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-6 border-b-2 border-ink pb-5">
        <p className="label !text-fire-ink">RT-SCIE, arts. 201.º n.º 1 c) e 202.º n.º 4 · RJ-SCIE, art. 23.º</p>
        <h1 className="h-display mt-2 text-[34px] sm:text-[40px]">Plano de manutenção de extintores</h1>
        <p className="mt-2 max-w-3xl text-[13px] text-ink-3">Listagem dos extintores por edifício e por piso, registo de cada intervenção (data, tipo, empresa, técnico e observações) e contagem até à próxima manutenção.</p>
        <div className="mt-4"><ResumoManut pl={pl} /></div>
        {pl.extintores.length > 0 && <div className="mt-4 max-w-[520px]"><PesquisaExt lista={pl.extintores} abrir={(e) => go(`/p/${p.id}/ext/${e.id}`)} sub={(e) => `${p.edificios.find((z) => z.id === e.edificio)?.nome ?? ''} · ${rotuloPisoInv(e.piso)} · ${e.local || '—'}`} /></div>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-fire h-10 px-4" disabled={!pl.extintores.length} onClick={() => setQr(true)}><ScanLine size={16} /> Ler QR do extintor</button>
          <button className="btn h-10 px-4" disabled={!pl.extintores.length} onClick={() => setEtq(etq ? null : { ed: '', inicio: 1 })}><QrCode size={15} /> Etiquetas QR (PDF)</button>
          <a className="btn h-10 px-4" href={`${base}/manutencao/doc`}><FileText size={15} /> Registo de manutenção (PDF)</a>
          <button className="btn h-10 px-4" disabled={!pl.extintores.length} onClick={() => import('../exportarManutencao').then((m) => m.exportarManutencaoExcel(p)).catch((e) => alert('Não foi possível exportar: ' + (e as Error).message))}><Sheet size={15} /> Exportar Excel</button>
        </div>
        {etq && (
          <div className="mt-3 grid gap-3 border border-ink bg-paper p-3 sm:grid-cols-[1fr_160px_auto]">
            <Field label="Extintores"><select className="input" value={etq.ed} onChange={(e) => setEtq({ ...etq, ed: e.target.value })}><option value="">Todos ({pl.extintores.length})</option>{p.edificios.map((z) => <option key={z.id} value={z.id}>{z.nome} ({pl.extintores.filter((e) => e.edificio === z.id).length})</option>)}</select></Field>
            <Field label="Começar na etiqueta n.º" hint="Para aproveitar folhas já usadas (1 a 36)."><Num value={etq.inicio} min={1} onChange={(v) => setEtq({ ...etq, inicio: Math.min(36, Math.max(1, Math.round(v))) })} /></Field>
            <div className="flex items-end"><button className="btn-fire h-10 w-full px-4" onClick={() => import('../exportarEtiquetas').then((m) => m.exportarEtiquetas(p, ordenar(pl.extintores.filter((e) => !etq.ed || e.edificio === etq.ed), ordemEd), etq.inicio)).catch((e) => alert('Não foi possível gerar: ' + (e as Error).message))}>Gerar PDF</button></div>
            <p className="text-[11.5px] text-ink-3 sm:col-span-3">Etiquetas de 50 × 30 mm, 36 por folha A4 (4 × 9), em papel autocolante. Cole junto ao extintor (suporte ou parede), sem tapar a marcação do fabricante nem a etiqueta da empresa de manutenção.</p>
          </div>
        )}
        {qr && (
          <LerQR onLido={(t) => { setQr(false); const u = lerUrlExt(t); if (u) go(u.pid === p.id ? `/p/${p.id}/ext/${u.eid}` : `/x/${u.pid}/${u.eid}`); else alert('Este QR não é de um extintor da Cautela.'); }} onFechar={() => setQr(false)}>
            <PesquisaExt lista={pl.extintores} abrir={(e) => { setQr(false); go(`/p/${p.id}/ext/${e.id}`); }} />
          </LerQR>
        )}
      </div>

      <Section n="01" title="Periodicidade e empresa de manutenção" sub="A empresa indicada aqui preenche sozinha os novos registos; pode alterá-los em cada um.">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Manutenção a cada" hint="12 meses: periodicidade da NP 4413, a norma de manutenção de extintores para que remete o RT-SCIE (anexo I, art. 8.º n.º 9)." className={pl.periodoMeses > 0 ? '' : 'falta'}>
            <Num value={pl.periodoMeses} suffix="meses" min={1} onChange={(v) => upPl((x) => { x.periodoMeses = Math.max(1, Math.round(v)); })} />
          </Field>
          <Field label="Empresa de manutenção"><Text value={pl.empresa.nome} onChange={(v) => upPl((x) => { x.empresa.nome = v; })} /></Field>
          <Field label="N.º de registo ANEPC" hint="Obrigatório para empresas de manutenção (RJ-SCIE, art. 23.º)."><Text value={pl.empresa.registoAnepc} onChange={(v) => upPl((x) => { x.empresa.registoAnepc = v; })} /></Field>
          <Field label="Técnico habitual"><Text value={pl.empresa.tecnico} onChange={(v) => upPl((x) => { x.empresa.tecnico = v; })} /></Field>
        </div>
        <label className={`mt-5 flex max-w-3xl cursor-pointer items-start gap-3 border p-3 ${pl.partilhar ? 'border-ink bg-white' : 'border-paper-3 bg-white/60'}`}>
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#14233A]" disabled={!user && !pl.partilhar} checked={!!pl.partilhar} onChange={(e) => {
            const v = e.target.checked;
            if (!v) apagarPublico(p.id).catch(() => alert('Não foi possível retirar a ficha pública agora (sem rede?). Tente de novo.'));
            upPl((x) => { x.partilhar = v; });
          }} />
          <span className="text-[13px]"><b>Partilhar o histórico com o cliente</b><span className="block text-[12px] text-ink-3">{user
            ? 'Quem ler o QR de um extintor (o cliente, sem conta) vê a ficha desse extintor só de leitura: estado, próxima manutenção e histórico. Só os dados dos extintores; o resto do projeto não é partilhado. Desligar retira a ficha.'
            : 'Exige sessão iniciada com a conta Google: a ficha do cliente fica na nuvem.'}</span></span>
        </label>
        {pl.partilhar && avisoPublico && <p className="mt-2 max-w-3xl border-l-[3px] border-alerta bg-alerta-soft px-3 py-2 text-[12.5px] text-alerta">{avisoPublico}</p>}
      </Section>

      <Section n="02" title="Extintores por edifício e piso" sub="Toque num extintor para ver os dados e o registo das manutenções." right={pl.extintores.length > 1 ? (
        <button className="btn h-9 px-3 text-[12.5px]" onClick={() => setLote(lote ? null : { data: hojeISO(), tipo: 'manutencao', ed: '' })}><Wrench size={14} /> Registar em vários</button>
      ) : undefined}>
        {!soManut && (() => {
          const g = inventarioDoMapa(p, pl.extintores);
          if (!g.novos.length) return <p className="mb-5 text-[12.5px] text-ink-3">Quando o dimensionamento tiver extintores calculados, pode gerar daqui o inventário.</p>;
          const gerar = () => {
            if (pl.extintores.length && !confirm(`Acrescentar ${g.novos.length} extintores do mapa aos ${pl.extintores.length} existentes? Verifique depois se há repetidos.`)) return;
            upPl((x) => { x.extintores.push(...inventarioDoMapa(p, x.extintores).novos); });
            if (g.porContar.length) alert(`Não entram por não terem número fixo (indique-os à mão):\n• ${g.porContar.join('\n• ')}`);
          };
          if (pl.extintores.length) return <button className="mb-5 flex items-center gap-1 text-[12.5px] font-semibold text-ink-3 hover:text-fire-ink hover:underline" onClick={gerar}><ListPlus size={14} /> Acrescentar de novo os {g.novos.length} extintores do mapa</button>;
          return (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-l-[3px] border-fire bg-fire-soft px-4 py-3">
              <p className="min-w-0 flex-1 basis-[260px] text-[13px]">{pl.extintores.length ? <>Já tem {pl.extintores.length} extintores no inventário. Pode <b>acrescentar</b> os {g.novos.length} do mapa de extintores (não apaga os existentes).</> : <>O mapa de extintores tem <b>{g.novos.length} extintores</b>. Gere o inventário e complete só o local exato de cada um.</>}</p>
              <button className="btn-fire h-10 px-4" onClick={gerar}><ListPlus size={16} /> {pl.extintores.length ? 'Acrescentar do mapa' : 'Gerar a partir do mapa'}</button>
            </div>
          );
        })()}
        {lote && (
          <div className="mb-5 border border-ink bg-paper p-4">
            <p className="mb-3 text-[13px] font-semibold">Registar a mesma intervenção em todos os extintores {lote.ed ? 'do edifício escolhido' : 'do projeto'}</p>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Data"><input type="date" className="input" value={lote.data} onChange={(e) => setLote({ ...lote, data: e.target.value })} /></Field>
              <Field label="Tipo"><select className="input" value={lote.tipo} onChange={(e) => setLote({ ...lote, tipo: e.target.value as TipoManut })}>{Object.entries(TIPO_MANUT).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></Field>
              <Field label="Edifício"><select className="input" value={lote.ed} onChange={(e) => setLote({ ...lote, ed: e.target.value })}><option value="">Todos</option>{p.edificios.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></Field>
              <div className="flex items-end"><button className="btn-fire h-10 w-full px-4" disabled={!lote.data} onClick={() => {
                const alvo = pl.extintores.filter((e) => !lote.ed || e.edificio === lote.ed).length;
                if (!confirm(`Registar «${TIPO_MANUT[lote.tipo]}» de ${dataPt(lote.data)} em ${alvo} extintores? O resultado fica por preencher em cada um (conforme ou não conforme).`)) return;
                upPl((x) => { for (const e of x.extintores) if (!lote.ed || e.edificio === lote.ed) e.registos.unshift({ ...novoReg(x, lote.data), tipo: lote.tipo }); });
                setLote(null);
              }}>Registar</button></div>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">Empresa, n.º de registo ANEPC e técnico vêm da secção 01. O resultado de cada extintor tem de ser indicado um a um, como consta do relatório da empresa.</p>
          </div>
        )}

        {p.edificios.map((ed) => {
          const doEd = lista.filter((e) => e.edificio === ed.id);
          const pisos = [...new Set(doEd.map((e) => e.piso))];
          return (
            <div key={ed.id} className="mb-8">
              <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-ink pb-2">
                <Building2 size={17} className="shrink-0" />
                {soManut
                  ? <input className="input h-9 max-w-[320px] flex-1 font-display text-[16px] font-bold" value={ed.nome} onChange={(e) => up((q) => { const x = q.edificios.find((z) => z.id === ed.id); if (x) x.nome = e.target.value; })} />
                  : <span className="font-display text-[17px] font-bold">{ed.nome}</span>}
                <span className="ref">{doEd.length} {doEd.length === 1 ? 'extintor' : 'extintores'}</span>
                <span className="ml-auto flex gap-1">
                  {soManut && p.edificios.length > 1 && <button className="btn-icon" title="Apagar edifício" onClick={() => {
                    if (doEd.length) return alert(`O edifício «${ed.nome}» tem ${doEd.length} extintores. Apague-os ou mude-os de edifício primeiro.`);
                    if (confirm(`Apagar o edifício «${ed.nome}»?`)) up((q) => { q.edificios = q.edificios.filter((z) => z.id !== ed.id); });
                  }}><Trash2 size={15} /></button>}
                </span>
              </div>
              {pisos.map((pi) => (
                <div key={String(pi)} className="mb-4">
                  <p className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-fire-ink">{rotuloPisoInv(pi)} · {doEd.filter((e) => e.piso === pi).length}</p>
                  <div className="flex flex-col gap-1.5">
                    {doEd.filter((e) => e.piso === pi).map((e) => (
                      <LinhaExt key={e.id} e={e} pl={pl} aberto={aberto.has(e.id)} alternar={() => alternar(e.id)} upExt={(fn) => upExt(e.id, fn)}
                        duplicar={() => acrescentar(ed.id, e)}
                        apagar={() => confirm(`Apagar o extintor ${e.num} e o seu registo de manutenções?`) && upPl((x) => { x.extintores = x.extintores.filter((z) => z.id !== e.id); })}
                        edificios={soManut || p.edificios.length > 1 ? p.edificios.map((z) => ({ id: z.id, nome: z.nome })) : undefined} />
                    ))}
                  </div>
                </div>
              ))}
              {!doEd.length && <p className="mb-3 text-[12.5px] text-ink-3">Sem extintores neste edifício.</p>}
              <button className="flex items-center gap-1 text-[13px] font-semibold text-fire-ink hover:underline" onClick={() => acrescentar(ed.id)}><Plus size={14} /> Acrescentar extintor</button>
            </div>
          );
        })}
        {soManut && (
          <button className="btn h-9 px-3 text-[12.5px]" onClick={() => up((q) => { q.edificios.push(novoEdificio(q.edificios.length + 1)); })}><Plus size={14} /> Acrescentar edifício</button>
        )}
      </Section>

      {soManut && <VerificacaoExt />}
    </main>
  );
}


export function LinhaExt({ e, pl, aberto, alternar, upExt, duplicar, apagar, edificios }: {
  e: ExtintorInv; pl: PlanoManut; aberto: boolean; alternar: () => void; upExt: (fn: (e: ExtintorInv) => void) => void; duplicar: () => void; apagar: () => void;
  edificios?: { id: string; nome: string }[];
}) {
  const { p } = useP();
  const edObj = p.edificios.find((z) => z.id === e.edificio);
  const serveOps = p.modo === 'manutencao' && pl.verificar && edObj ? opcoesServe(edObj) : [];
  const s = estadoExt(e, pl.periodoMeses);
  const fe = faltaExt(e);
  const falta = (campo: string) => (fe.some((f) => f[0] === campo) ? 'falta' : '');
  const regs = [...e.registos].sort((a, b) => (b.data || '9').localeCompare(a.data || '9'));
  const faltaRegs = e.registos.some((r) => faltaReg(r).length);
  return (
    <div data-bloco={e.id} className={`border bg-white ${aberto ? 'border-ink' : fe.length || faltaRegs ? 'border-alerta' : 'border-paper-3'}`}>
      <button className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left hover:bg-paper" onClick={alternar}>
        {aberto ? <ChevronDown size={15} className="shrink-0" /> : <ChevronRight size={15} className="shrink-0" />}
        <span className="w-[62px] shrink-0 font-mono text-[12.5px] font-bold">{e.num || '—'}</span>
        <span className="min-w-0 flex-1 basis-[140px] text-[13px]"><span className="font-semibold">{e.local || <span className="text-alerta">local por indicar</span>}</span><span className="text-ink-3"> · {descExt(e)}</span></span>
        {s.naoConforme && <span className="border border-alerta px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-alerta">NÃO CONFORME</span>}
        <ChipEstado s={s} />
      </button>
      {aberto && (
        <div className="border-t border-paper-3 px-3 pb-4 pt-3 sm:px-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label="N.º do extintor"><Text value={e.num} onChange={(v) => upExt((x) => { x.num = v; })} /></Field>
            <Field label="Piso" className={falta('Piso')}>
              <select className="input" value={e.piso ?? ''} onChange={(ev) => upExt((x) => { x.piso = ev.target.value === '' ? null : Number(ev.target.value); })}>
                <option value="">Escolher…</option>{PISOS.map((n) => <option key={n} value={n}>{rotuloPisoInv(n)}</option>)}
              </select>
            </Field>
            <Field label="Local" className={`col-span-2 ${falta('Local')}`}><Text value={e.local} placeholder="ex.: corredor, junto à saída da receção" onChange={(v) => upExt((x) => { x.local = v; })} /></Field>
            {edificios && <Field label="Edifício"><select className="input" value={e.edificio} onChange={(ev) => upExt((x) => { x.edificio = ev.target.value; })}>{edificios.map((z) => <option key={z.id} value={z.id}>{z.nome}</option>)}</select></Field>}
            <Field label="Agente" className={falta('Agente')}>
              <select className="input" value={e.agente} onChange={(ev) => upExt((x) => { x.agente = ev.target.value as AgenteInv; if (x.agente && CAPS[x.agente].length && !CAPS[x.agente].includes(x.cap)) x.cap = CAPS[x.agente].includes(6) ? 6 : CAPS[x.agente][0]; })}>
                <option value="">Escolher…</option>{(Object.keys(NOME_AGENTE_INV) as AgenteInv[]).map((a) => <option key={a} value={a}>{NOME_AGENTE_INV[a]}</option>)}
              </select>
            </Field>
            <Field label="Capacidade" className={falta('Capacidade')}>
              {e.agente && CAPS[e.agente].length
                ? <select className="input" value={e.cap || ''} onChange={(ev) => upExt((x) => { x.cap = Number(ev.target.value); })}><option value="">Escolher…</option>{CAPS[e.agente].map((c) => <option key={c} value={c}>{c} {UNID_INV[e.agente as AgenteInv]}</option>)}</select>
                : <Num value={e.cap} onChange={(v) => upExt((x) => { x.cap = v; })} />}
            </Field>
            <Field label="Eficácia"><Text value={e.eficacia} placeholder="ex.: 27A 183B C" onChange={(v) => upExt((x) => { x.eficacia = v; })} /></Field>
            <Field label="Ano de fabrico"><Num value={e.ano} placeholder="ex.: 2022" onChange={(v, t) => upExt((x) => { x.ano = t.trim() ? Math.round(v) : undefined; })} /></Field>
            <Field label="Fabricante / marca"><Text value={e.fabricante} onChange={(v) => upExt((x) => { x.fabricante = v; })} /></Field>
            <Field label="N.º de série"><Text value={e.serie} onChange={(v) => upExt((x) => { x.serie = v; })} /></Field>
            {serveOps.length > 0 && (
              <Field label="Para que serve" className="col-span-2" hint="Vazio = conta para o piso (art. 163.º n.º 2).">
                <select className="input" value={e.serve ?? ''} onChange={(ev) => upExt((x) => { x.serve = ev.target.value || undefined; })}>
                  <option value="">Geral do piso (art. 163.º n.º 2)</option>{serveOps.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </Field>
            )}
          </div>
          <Faltas itens={fe} titulo="Falta preencher" />
          <div className="mt-3 flex gap-2">
            <button className="btn-ghost" onClick={duplicar}><Copy size={13} /> Duplicar</button>
            <button className="btn-ghost" onClick={apagar}><Trash2 size={13} /> Apagar</button>
          </div>

          <div className="mt-5 border-t border-paper-3 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-[15px] font-bold">Registo de manutenções</p>
              <button className="btn h-9 px-3 text-[12.5px]" onClick={() => upExt((x) => { x.registos.unshift(novoReg(pl)); })}><Wrench size={14} /> Registar manutenção</button>
            </div>
            <p className="mb-3 text-[12.5px]">{s.ultima ? <>Última: <b>{dataPt(s.ultima.data)}</b> ({TIPO_MANUT[s.ultima.tipo].toLowerCase()}) · Próxima: <b>{dataPt(s.proxima)}</b> · </> : null}<ChipEstado s={s} curto /></p>
            {!regs.length && <p className="text-[12.5px] text-ink-3">Ainda sem intervenções registadas.</p>}
            <div className="flex flex-col gap-3">
              {regs.map((r) => {
                const fr = faltaReg(r);
                const fc = (c: string) => (fr.some((f) => f[0] === c) ? 'falta' : '');
                const upR = (fn: (r: RegistoManut) => void) => upExt((x) => { const z = x.registos.find((k) => k.id === r.id); if (z) fn(z); });
                return (
                  <div key={r.id} className="border-l-[3px] border-ink-4 bg-paper/60 p-3">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Field label="Data" className={fc('Data')}><input type="date" className="input" value={r.data} onChange={(ev) => upR((z) => { z.data = ev.target.value; })} /></Field>
                      <Field label="Tipo"><select className="input" value={r.tipo} onChange={(ev) => upR((z) => { z.tipo = ev.target.value as TipoManut; })}>{Object.entries(TIPO_MANUT).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></Field>
                      <Field label="Resultado" className={fc('Resultado')}>
                        <select className="input" value={r.resultado} onChange={(ev) => upR((z) => { z.resultado = ev.target.value as RegistoManut['resultado']; })}><option value="">Escolher…</option><option value="conforme">Conforme</option><option value="nao_conforme">Não conforme</option></select>
                      </Field>
                      <Field label="Técnico" className={fc('Técnico')}><Text value={r.tecnico} onChange={(v) => upR((z) => { z.tecnico = v; })} /></Field>
                      <Field label="Empresa" className={`col-span-2 ${fc('Empresa')}`}><Text value={r.empresa} onChange={(v) => upR((z) => { z.empresa = v; })} /></Field>
                      <Field label="N.º de registo ANEPC" className={`col-span-2 ${fc('N.º de registo ANEPC')}`}><Text value={r.registoAnepc} onChange={(v) => upR((z) => { z.registoAnepc = v; })} /></Field>
                      <Field label="Motivo e observações da empresa" className="col-span-2 md:col-span-4"><Area rows={2} value={r.obs} onChange={(v) => upR((z) => { z.obs = v; })} /></Field>
                    </div>
                    <Faltas itens={fr} titulo="Falta preencher" />
                    <button className="btn-ghost mt-2" onClick={() => confirm('Apagar este registo?') && upExt((x) => { x.registos = x.registos.filter((k) => k.id !== r.id); })}><Trash2 size={13} /> Apagar registo</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
