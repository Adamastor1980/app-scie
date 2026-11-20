import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CalendarClock, Camera, CheckCircle2, Clock, FileText, Plus, Printer, Trash2, X } from 'lucide-react';
import { useP } from './ProjetoShell';
import { novaAutoprotecao, uid } from '../store';
import type { Autoprotecao as AP, Pessoa, Registo, TipoRegisto } from '../data/types';
import { MAP_INFO } from '../data/rtscie';
import { ROMANO } from '../data/rjscie';
import { exigencias, prazos, INSPECAO_REGULAR, TIPOS_OCORRENCIA, TIPOS_REGISTO, TIPOS_RELATORIO, type EstadoPrazo } from '../engine/autoprotecao';
import { nomeUT } from '../nome';
import { Area, CatBadge, Empty, Field, Note, Section, Text, caberNaNuvem, compressImage, readFile } from '../ui/primitives';

type Aba = 'exigencias' | 'organizacao' | 'registos' | 'prazos';

const dataPt = (d?: string) => (d ? new Date(d + 'T00:00').toLocaleDateString('pt-PT') : '—');

export default function Autoprotecao() {
  const { p, up } = useP();
  const [aba, setAba] = useState<Aba>('exigencias');
  const ap = p.autoprotecao ?? novaAutoprotecao();
  const upA = (fn: (a: AP) => void) => up((x) => { x.autoprotecao ??= novaAutoprotecao(); fn(x.autoprotecao); });
  const pz = prazos(p);
  const alertas = pz.filter((x) => x.estado === 'atrasado' || x.estado === 'sem_registo').length;

  const ABAS: { k: Aba; t: string; s: string }[] = [
    { k: 'exigencias', t: 'Exigências', s: 'quadro XXXIX' },
    { k: 'organizacao', t: 'Organização', s: 'RS, delegado, equipa' },
    { k: 'registos', t: 'Registos', s: `${ap.registos.length} registo${ap.registos.length === 1 ? '' : 's'}` },
    { k: 'prazos', t: 'Prazos', s: alertas ? `${alertas} a tratar` : 'em dia' },
  ];

  return (
    <main className="pb-24">
      <div className="no-print border-b border-ink bg-white">
        <div className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-8">
          <p className="label !text-fire">Medidas de autoproteção</p>
          <h1 className="h-display mb-1 mt-2 text-[40px]">Autoproteção</h1>
          <a href={`#/p/${p.id}/map`} className="btn-primary float-right ml-4 mt-1"><FileText size={15} /> Documento MAP</a>
          <p className="mb-4 max-w-3xl text-[13px] text-ink-3">Organização da segurança, registos de segurança e prazos (RT-SCIE, título VII; RJ-SCIE, arts. 19.º e 21.º). Os registos devem ser arquivados durante pelo menos 10 anos (art. 201.º n.º 2) e as medidas são auditáveis a qualquer momento (art. 198.º n.º 3).</p>
        </div>
        <nav className="mx-auto flex max-w-[1240px] gap-px overflow-x-auto px-4 sm:px-8">
          {ABAS.map((a, i) => (
            <button key={a.k} onClick={() => setAba(a.k)} className={`flex min-w-[140px] flex-1 flex-col border-t-[3px] px-3 py-2.5 text-left ${aba === a.k ? 'border-fire bg-paper' : 'border-transparent hover:bg-paper/60'}`}>
              <span className="flex items-baseline gap-2">
                <span className={`font-mono text-[11px] font-semibold ${aba === a.k ? 'text-fire' : 'text-ink-4'}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[13.5px] font-bold">{a.t}</span>
              </span>
              <span className={`ref ml-[26px] ${a.k === 'prazos' && alertas ? '!text-fire' : ''}`}>{a.s}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-8 sm:pt-8">
        {aba === 'exigencias' && <Exigencias />}
        {aba === 'organizacao' && <Organizacao ap={ap} upA={upA} />}
        {aba === 'registos' && <Registos ap={ap} upA={upA} />}
        {aba === 'prazos' && <Prazos />}
      </div>
    </main>
  );
}

/* ------------------------------ Exigências ------------------------------ */

function Exigencias() {
  const { p } = useP();
  const ex = exigencias(p);
  if (!ex.length) return <Empty title="Sem utilizações-tipo.">Crie as UT do projeto para ver as medidas de autoproteção exigíveis.</Empty>;
  const todas = Object.keys(MAP_INFO) as (keyof typeof MAP_INFO)[];
  return (
    <Section title="Medidas de autoproteção exigíveis por UT" sub="Quadro XXXIX do RT-SCIE (art. 198.º), em função da UT, da categoria de risco e da existência de locais de risco D ou E.">
      <div className="overflow-x-auto border border-ink bg-white">
        <table className="tbl">
          <thead>
            <tr>
              <th>UT</th>
              <th>Cat.</th>
              {todas.map((m) => <th key={m} className="text-center">{MAP_INFO[m].nome}<br /><span className="ref">art. {MAP_INFO[m].art}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {ex.map((x) => (
              <tr key={x.ut.id}>
                <td className="min-w-[180px]"><span className="font-mono text-[11px]">UT {ROMANO[x.ut.tipo]}</span> {nomeUT(x.ut).nome}<br /><span className="ref">{x.ed.nome}{x.temDE ? ' · com locais D/E' : ''}</span></td>
                <td><CatBadge cat={x.cat} size="sm" /></td>
                {todas.map((m) => <td key={m} className="text-center">{x.medidas?.includes(m) ? <span className="font-bold text-fire">●</span> : <span className="text-ink-4">—</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ex.some((x) => !x.medidas) && <div className="mt-3"><Note>UT I das 1.ª e 2.ª categorias: sem medidas de autoproteção exigíveis pelo quadro XXXIX (nas 3.ª e 4.ª categorias, apenas espaços comuns).</Note></div>}
      <div className="mt-3"><Note tone="warn">Quando é exigível plano de emergência interno, deve ser implementado um Serviço de Segurança contra Incêndio (SSI), constituído por um delegado de segurança com funções de chefe de equipa e pelo número de elementos adequado (art. 200.º n.º 6). Em edifícios existentes com insuficiências de segurança elevadas, o autor das MAP deve elencá-las e propor medidas compensatórias (art. 193.º n.º 3).</Note></div>
    </Section>
  );
}

/* ------------------------------ Organização ------------------------------ */

function PessoaForm({ v, on }: { v: Pessoa; on: (fn: (x: Pessoa) => void) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nome"><Text value={v.nome} onChange={(t) => on((x) => { x.nome = t; })} /></Field>
      <Field label="Cargo / função"><Text value={v.cargo} onChange={(t) => on((x) => { x.cargo = t; })} /></Field>
      <Field label="Telefone"><Text value={v.telefone} onChange={(t) => on((x) => { x.telefone = t; })} /></Field>
      <Field label="Email"><Text value={v.email} onChange={(t) => on((x) => { x.email = t; })} /></Field>
    </div>
  );
}

function Organizacao({ ap, upA }: { ap: AP; upA: (fn: (a: AP) => void) => void }) {
  return (
    <>
      <Section n="01" title="Responsável de segurança (RS)" sub="Pessoa individual ou coletiva definida no quadro XXXVIII (RT-SCIE, art. 194.º; RJ-SCIE, art. 6.º n.os 3 e 4): proprietário, entidade exploradora, administração do condomínio ou entidade gestora dos espaços comuns.">
        <div className="border border-ink bg-white p-4"><PessoaForm v={ap.rs} on={(fn) => upA((a) => fn(a.rs))} /></div>
      </Section>
      <Section n="02" title="Delegado de segurança" sub="Executa as medidas de autoproteção em nome do RS (RT-SCIE, arts. 196.º e 200.º).">
        <div className="border border-ink bg-white p-4"><PessoaForm v={ap.delegado} on={(fn) => upA((a) => fn(a.delegado))} /></div>
      </Section>
      <Section n="03" title="Equipa de segurança" sub="Dimensionada de acordo com as características de exploração (art. 200.º n.º 3). O quadro XL foi revogado: não existe fórmula legal — o dimensionamento deve ser fundamentado e aceite pela ANEPC (art. 200.º n.º 4). A organização é estabelecida pelo RS, que designa o delegado de segurança (arts. 194.º n.º 2 e 200.º n.º 1).">
        <div className="flex flex-col gap-2">
          {ap.equipa.map((e, i) => (
            <div key={e.id} className="grid items-end gap-2 border border-ink bg-white p-3 md:grid-cols-[1.4fr_1.4fr_0.8fr_1fr_auto]">
              <Field label="Nome"><Text value={e.nome} onChange={(t) => upA((a) => { a.equipa[i].nome = t; })} /></Field>
              <Field label="Função"><Text value={e.funcao} placeholder="ex.: 1.ª intervenção, evacuação, alarme e alerta" onChange={(t) => upA((a) => { a.equipa[i].funcao = t; })} /></Field>
              <Field label="Turno"><Text value={e.turno} onChange={(t) => upA((a) => { a.equipa[i].turno = t; })} /></Field>
              <Field label="Telefone"><Text value={e.telefone} onChange={(t) => upA((a) => { a.equipa[i].telefone = t; })} /></Field>
              <button className="btn-icon" title="Remover" onClick={() => upA((a) => { a.equipa.splice(i, 1); })}><Trash2 size={15} /></button>
            </div>
          ))}
          <button className="btn self-start" onClick={() => upA((a) => { a.equipa.push({ id: uid(), nome: '', funcao: '', turno: '', telefone: '' }); })}><Plus size={15} /> Adicionar elemento</button>
          <Field label="Fundamentação do dimensionamento da equipa" legal="art. 200.º n.os 3 e 4 RT-SCIE" className="mt-3">
            <Area rows={4} value={ap.fundamentacaoEquipa} placeholder="Ex.: períodos de funcionamento e turnos, efetivo por piso, locais de risco, meios a operar, tempo de resposta pretendido…" onChange={(t) => upA((a) => { a.fundamentacaoEquipa = t; })} />
          </Field>
        </div>
      </Section>
      <Section n="04" title="Funcionamento e posto de segurança">
        <div className="grid gap-3 border border-ink bg-white p-4 sm:grid-cols-2">
          <Field label="Períodos de funcionamento"><Text value={ap.horario} placeholder="ex.: 2.ª a 6.ª, 08h00–20h00 (3 turnos)" onChange={(t) => upA((a) => { a.horario = t; })} /></Field>
          <Field label="Posto de segurança" legal="art. 200.º n.º 5"><Text value={ap.postoSeguranca} placeholder="ex.: portaria principal, piso 0" onChange={(t) => upA((a) => { a.postoSeguranca = t; })} /></Field>
          <Field label="Data de entrada em funcionamento" legal="art. 203.º n.º 1 a) ii)"><input type="date" className="input" value={ap.dataFuncionamento ?? ''} onChange={(e) => upA((a) => { a.dataFuncionamento = e.target.value || undefined; })} /></Field>
        </div>
      </Section>
      <Section n="05" title="Contactos de emergência">
        <div className="flex flex-col gap-2">
          {ap.contactos.map((c, i) => (
            <div key={c.id} className="grid items-end gap-2 border border-ink bg-white p-3 sm:grid-cols-[2fr_1fr_auto]">
              <Field label="Entidade"><Text value={c.entidade} onChange={(t) => upA((a) => { a.contactos[i].entidade = t; })} /></Field>
              <Field label="Telefone"><Text value={c.telefone} onChange={(t) => upA((a) => { a.contactos[i].telefone = t; })} /></Field>
              <button className="btn-icon" title="Remover" onClick={() => upA((a) => { a.contactos.splice(i, 1); })}><Trash2 size={15} /></button>
            </div>
          ))}
          <button className="btn self-start" onClick={() => upA((a) => { a.contactos.push({ id: uid(), entidade: '', telefone: '' }); })}><Plus size={15} /> Adicionar contacto</button>
        </div>
      </Section>
    </>
  );
}

/* ------------------------------ Registos ------------------------------ */

function Registos({ ap, upA }: { ap: AP; upA: (fn: (a: AP) => void) => void }) {
  const { p } = useP();
  const [filtro, setFiltro] = useState<TipoRegisto | 'todos'>('todos');
  const [edit, setEdit] = useState<Registo | null>(null);
  const [imprimir, setImprimir] = useState(false);
  const uts = p.edificios.flatMap((e) => e.uts.map((u) => ({ e, u })));
  const lista = [...ap.registos].filter((r) => filtro === 'todos' || r.tipo === filtro).sort((a, b) => b.data.localeCompare(a.data));

  const novo = (tipo: TipoRegisto): Registo => ({
    id: uid(), tipo, data: new Date().toISOString().slice(0, 10), uts: [], elemento: '', tipoAcao: tipo === 'ocorrencia' ? TIPOS_OCORRENCIA[0] : tipo === 'relatorio' ? INSPECAO_REGULAR : '', motivo: '', descricao: '', responsavel: '', anexos: [],
  });

  const guardar = (r: Registo) => {
    upA((a) => {
      const i = a.registos.findIndex((x) => x.id === r.id);
      if (i >= 0) a.registos[i] = r;
      else a.registos.push(r);
    });
    setEdit(null);
  };

  const nomeUTs = (r: Registo) => (r.uts.length === 0 ? 'Todo o projeto' : r.uts.map((id) => { const x = uts.find((y) => y.u.id === id); return x ? `UT ${ROMANO[x.u.tipo]} ${nomeUT(x.u).nome}` : ''; }).filter(Boolean).join('; '));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(Object.keys(TIPOS_REGISTO) as TipoRegisto[]).map((t) => (
          <button key={t} className="btn-fire h-10" onClick={() => setEdit(novo(t))}><Plus size={15} /> {TIPOS_REGISTO[t].nome}</button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="label">Mostrar</span>
        <select className="input w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value as TipoRegisto | 'todos')}>
          <option value="todos">Todos os registos</option>
          {(Object.keys(TIPOS_REGISTO) as TipoRegisto[]).map((t) => <option key={t} value={t}>{TIPOS_REGISTO[t].nome}</option>)}
        </select>
        <button className="btn ml-auto" onClick={() => setImprimir(true)}><Printer size={15} /> Folhas de registo</button>
      </div>

      {lista.length === 0 ? (
        <Empty title="Sem registos.">Use os botões acima para registar manutenções, modificações e trabalhos perigosos, ocorrências, ações de formação, simulacros e relatórios de inspeção. No tablet pode juntar fotografias a cada registo.</Empty>
      ) : (
        <div className="overflow-x-auto border border-ink bg-white">
          <table className="tbl">
            <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Âmbito</th><th>Responsável</th><th /></tr></thead>
            <tbody>
              {lista.map((r) => (
                <tr key={r.id} className="cursor-pointer" onClick={() => setEdit(JSON.parse(JSON.stringify(r)))}>
                  <td className="num whitespace-nowrap">{dataPt(r.data)}{r.dataFim ? ` → ${dataPt(r.dataFim)}` : ''}</td>
                  <td className="whitespace-nowrap font-semibold">{TIPOS_REGISTO[r.tipo].nome}</td>
                  <td>{[r.elemento, r.tipoAcao, r.descricao].filter(Boolean).join(' — ') || '—'}{r.anexos?.length ? <span className="ref ml-2">📷 {r.anexos.length}</span> : null}</td>
                  <td className="text-[12px] text-ink-3">{nomeUTs(r)}</td>
                  <td>{r.responsavel || '—'}</td>
                  <td><button className="btn-icon" title="Apagar" onClick={(e) => { e.stopPropagation(); if (confirm('Apagar este registo?')) upA((a) => { a.registos = a.registos.filter((x) => x.id !== r.id); }); }}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><Note>Os registos de segurança devem ser arquivados pelo período mínimo de 10 anos, em papel ou em suporte digital (art. 201.º n.º 2 RT-SCIE).</Note></div>

      {edit && <EditorRegisto r={edit} uts={uts.map((x) => ({ id: x.u.id, nome: `UT ${ROMANO[x.u.tipo]} — ${nomeUT(x.u).nome}` }))} onGuardar={guardar} onFechar={() => setEdit(null)} />}
      {imprimir && <FolhasRegisto onFechar={() => setImprimir(false)} />}
    </>
  );
}

function EditorRegisto({ r: r0, uts, onGuardar, onFechar }: { r: Registo; uts: { id: string; nome: string }[]; onGuardar: (r: Registo) => void; onFechar: () => void }) {
  const [r, setR] = useState<Registo>(r0);
  const camRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const set = (fn: (x: Registo) => void) => setR((x) => { const y = JSON.parse(JSON.stringify(x)) as Registo; fn(y); return y; });
  const info = TIPOS_REGISTO[r.tipo];
  const rotulos: Record<TipoRegisto, { elemento: string; tipoAcao?: string; motivo?: string }> = {
    relatorio: { elemento: 'Entidade', tipoAcao: 'Tipo' },
    anomalia: { elemento: 'Instalação / sistema / equipamento', tipoAcao: 'Impacte', motivo: 'Duração da reparação' },
    manutencao: { elemento: 'Elemento intervencionado', tipoAcao: 'Tipo de ação', motivo: 'Motivo da ação' },
    modificacao: { elemento: 'Local e natureza dos trabalhos', tipoAcao: 'Autorização do RS (art. 197.º n.º 3)', motivo: 'Meios de segurança compensatórios / suplementares' },
    ocorrencia: { elemento: 'Local', tipoAcao: 'Tipo de ocorrência' },
    bombeiros: { elemento: 'Corpo de bombeiros', tipoAcao: 'Tipo de emergência' },
    formacao: { elemento: 'Ação de sensibilização / formação', motivo: 'Destinatários' },
    simulacro: { elemento: 'Cenário', motivo: 'Entidades externas e observadores (art. 207.º n.º 2 c) e d))' },
  };
  const rot = rotulos[r.tipo];

  const fotos = async (files: FileList) => {
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const d = await caberNaNuvem(await compressImage(await readFile(f), 1600, 0.8, true), 700_000);
        set((x) => { (x.anexos ??= []).push({ id: uid(), tipo: 'foto', imagem: d, legenda: '', data: Date.now() }); });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-ink/60 sm:items-center sm:p-6" onClick={onFechar}>
      <div className="flex max-h-full w-full max-w-[760px] flex-col overflow-hidden border border-ink bg-paper" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-ink bg-white px-5 py-4">
          <div>
            <p className="label !text-fire">{info.base}</p>
            <h2 className="font-display text-[22px] font-bold">{info.nome}</h2>
            <p className="mt-1 text-[12.5px] text-ink-3">{info.ajuda}</p>
          </div>
          <button className="btn-icon" onClick={onFechar}><X size={18} /></button>
        </div>
        <div className="grid flex-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          <Field label={r.tipo === 'modificacao' ? 'Data de início' : 'Data'}><input type="date" className="input" value={r.data} onChange={(e) => set((x) => { x.data = e.target.value; })} /></Field>
          {r.tipo === 'modificacao' ? (
            <Field label="Data de finalização"><input type="date" className="input" value={r.dataFim ?? ''} onChange={(e) => set((x) => { x.dataFim = e.target.value || undefined; })} /></Field>
          ) : (
            <Field label="Responsável"><Text value={r.responsavel} onChange={(t) => set((x) => { x.responsavel = t; })} /></Field>
          )}
          <Field label={rot.elemento} className="sm:col-span-2"><Text value={r.elemento} onChange={(t) => set((x) => { x.elemento = t; })} /></Field>
          {rot.tipoAcao && (
            <Field label={rot.tipoAcao}>
              {r.tipo === 'ocorrencia' || r.tipo === 'relatorio' ? (
                <select className="input" value={r.tipoAcao} onChange={(e) => set((x) => { x.tipoAcao = e.target.value; })}>
                  {(r.tipo === 'ocorrencia' ? TIPOS_OCORRENCIA : TIPOS_RELATORIO).map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <Text value={r.tipoAcao} placeholder="ex.: preventiva, corretiva, recarga" onChange={(t) => set((x) => { x.tipoAcao = t; })} />
              )}
            </Field>
          )}
          {rot.motivo && <Field label={rot.motivo} className={rot.tipoAcao ? '' : 'sm:col-span-2'}><Text value={r.motivo} onChange={(t) => set((x) => { x.motivo = t; })} /></Field>}
          {(r.tipo === 'formacao' || r.tipo === 'simulacro') && (
            <Field label="N.º de participantes"><input className="input" inputMode="numeric" value={r.participantes ?? ''} onChange={(e) => set((x) => { const n = parseInt(e.target.value, 10); x.participantes = Number.isFinite(n) ? n : undefined; })} /></Field>
          )}
          {r.tipo === 'modificacao' && <Field label="Responsável"><Text value={r.responsavel} onChange={(t) => set((x) => { x.responsavel = t; })} /></Field>}
          <Field label={r.tipo === 'simulacro' ? 'Planeamento, execução e avaliação' : 'Descrição / observações'} legal={r.tipo === 'simulacro' ? 'art. 207.º n.º 2 c)' : undefined} className="sm:col-span-2">
            <Area rows={4} value={r.descricao} onChange={(t) => set((x) => { x.descricao = t; })} />
          </Field>
          <div className="sm:col-span-2">
            <p className="label mb-1.5">Utilizações-tipo abrangidas</p>
            <div className="flex flex-wrap gap-1.5">
              <button className={`chip h-8 ${r.uts.length === 0 ? 'border-ink bg-ink text-white' : 'border-ink-4'}`} onClick={() => set((x) => { x.uts = []; })}>Todo o projeto</button>
              {uts.map((u) => {
                const on = r.uts.includes(u.id);
                return <button key={u.id} className={`chip h-8 ${on ? 'border-ink bg-ink text-white' : 'border-ink-4'}`} onClick={() => set((x) => { x.uts = on ? x.uts.filter((y) => y !== u.id) : [...x.uts, u.id]; })}>{u.nome}</button>;
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Fotografias</p>
              <button className="btn h-9" disabled={busy} onClick={() => camRef.current?.click()}><Camera size={15} /> {busy ? 'A processar…' : 'Adicionar'}</button>
              <input ref={camRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) fotos(e.target.files); e.target.value = ''; }} />
            </div>
            {r.anexos?.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {r.anexos.map((a) => (
                  <div key={a.id} className="relative aspect-square border border-paper-3 bg-white">
                    {a.imagem && <img src={a.imagem} alt="" className="h-full w-full object-cover" />}
                    <button className="absolute right-1 top-1 grid h-7 w-7 place-items-center bg-ink/80 text-white" onClick={() => set((x) => { x.anexos = x.anexos?.filter((y) => y.id !== a.id); })}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            ) : <p className="text-[12px] text-ink-4">Sem fotografias.</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-ink bg-white px-5 py-3">
          <button className="btn" onClick={onFechar}>Cancelar</button>
          <button className="btn-fire" onClick={() => onGuardar(r)}>Guardar registo</button>
        </div>
      </div>
    </div>
  );
}

/** Folhas de registo para imprimir (registos existentes + linhas em branco) */
function FolhasRegisto({ onFechar }: { onFechar: () => void }) {
  const { p } = useP();
  const regs = p.autoprotecao?.registos ?? [];
  // na impressão só saem as folhas (a app fica escondida)
  useEffect(() => {
    document.body.classList.add('imprimir-folhas');
    return () => document.body.classList.remove('imprimir-folhas');
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-paper-3 print:static print:bg-white">
      <div className="no-print sticky top-0 z-10 flex items-center gap-2 border-b border-ink bg-white px-4 py-3">
        <button className="btn-icon" onClick={onFechar}><X size={18} /></button>
        <span className="font-display text-[16px] font-bold">Folhas de registo de segurança</span>
        <button className="btn-fire ml-auto" onClick={() => window.print()}><Printer size={15} /> Imprimir</button>
      </div>
      {(Object.keys(TIPOS_REGISTO) as TipoRegisto[]).map((t) => {
        const rs = regs.filter((r) => r.tipo === t).sort((a, b) => a.data.localeCompare(b.data));
        const vazias = Math.max(12 - rs.length, 6);
        return (
          <section key={t} className="report-page page-break mx-auto my-6 w-[210mm] max-w-full bg-white p-[14mm] print:my-0">
            <p className="label">{p.nome}{p.referencia ? ` · ${p.referencia}` : ''}</p>
            <h2 className="mt-1 border-b-[3px] border-ink pb-2 font-display text-[20px] font-extrabold">Registo de segurança — {TIPOS_REGISTO[t].nome}</h2>
            <p className="mb-3 mt-1 text-[10.5px] text-ink-3">{TIPOS_REGISTO[t].base} · {TIPOS_REGISTO[t].ajuda}</p>
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-paper">
                  {['Data', 'Descrição', 'Âmbito', 'Responsável', 'Rubrica'].map((h) => <th key={h} className="border border-ink px-1.5 py-1 text-left font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rs.map((r) => (
                  <tr key={r.id}>
                    <td className="w-[22mm] border border-ink px-1.5 py-1 align-top">{dataPt(r.data)}{r.dataFim ? ` a ${dataPt(r.dataFim)}` : ''}</td>
                    <td className="border border-ink px-1.5 py-1 align-top">{[r.elemento, r.tipoAcao, r.motivo, r.descricao].filter(Boolean).join(' — ')}</td>
                    <td className="w-[30mm] border border-ink px-1.5 py-1 align-top">{r.uts.length ? `${r.uts.length} UT` : 'Projeto'}</td>
                    <td className="w-[30mm] border border-ink px-1.5 py-1 align-top">{r.responsavel}</td>
                    <td className="w-[22mm] border border-ink px-1.5 py-1" />
                  </tr>
                ))}
                {Array.from({ length: vazias }).map((_, i) => (
                  <tr key={'v' + i} className="h-[9mm]">{[0, 1, 2, 3, 4].map((k) => <td key={k} className="border border-ink" />)}</tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>,
    document.body,
  );
}

/* ------------------------------ Prazos ------------------------------ */

const COR: Record<EstadoPrazo, string> = { ok: 'text-ok', proximo: 'text-warn', atrasado: 'text-fire', sem_registo: 'text-ink-3' };
const ROT: Record<EstadoPrazo, string> = { ok: 'Em dia', proximo: 'A vencer (≤ 90 dias)', atrasado: 'Ultrapassado', sem_registo: 'Sem registo anterior' };
const ICO: Record<EstadoPrazo, typeof Clock> = { ok: CheckCircle2, proximo: Clock, atrasado: AlertTriangle, sem_registo: CalendarClock };

function Prazos() {
  const { p } = useP();
  const pz = prazos(p).sort((a, b) => ['atrasado', 'sem_registo', 'proximo', 'ok'].indexOf(a.estado) - ['atrasado', 'sem_registo', 'proximo', 'ok'].indexOf(b.estado));
  if (!pz.length) return <Empty title="Sem prazos periódicos exigíveis.">Nenhuma UT deste projeto exige simulacros (quadro XLI) nem inspeções regulares (art. 19.º n.os 4 e 5 do RJ-SCIE).</Empty>;
  return (
    <Section title="Prazos periódicos" sub="Calculados a partir dos registos: a próxima data é a última registada mais o período máximo legal. Registe simulacros e inspeções no separador «Registos».">
      <div className="flex flex-col gap-2">
        {pz.map((x) => {
          const I = ICO[x.estado];
          return (
            <div key={x.id} className="grid items-center gap-3 border border-ink bg-white p-4 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
              <div>
                <p className="font-display text-[16px] font-bold">{x.titulo}</p>
                <p className="text-[12.5px] text-ink-3">UT {ROMANO[x.ut.tipo]} — {nomeUT(x.ut).nome} · {x.ed.nome}</p>
                <p className="ref mt-0.5">{x.base} · máximo {x.periodoAnos} {x.periodoAnos === 1 ? 'ano' : 'anos'}</p>
              </div>
              <div><p className="label">Último</p><p className="num">{dataPt(x.ultima)}</p></div>
              <div><p className="label">Próximo até</p><p className="num font-semibold">{dataPt(x.proxima)}</p></div>
              <div className={`flex items-center gap-2 text-[13px] font-semibold ${COR[x.estado]}`}><I size={17} /> {ROT[x.estado]}</div>
              {x.nota && <p className="text-[11.5px] text-ink-3 md:col-span-4">{x.nota}</p>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
