import { ArrowLeft, FileText, Lightbulb, Plus, X } from 'lucide-react';
import { useFPS } from '../store';
import { go } from '../../router';
import { Area, Faltas, Field, Text } from '../../ui/primitives';
import { RISCOS_ART7, TRABALHOS_ART2, comunicacaoPrevia, enquadramento, faltaFPS } from '../regras';
import { MEDIDAS_ART7, EPI_BASE } from '../sugestoes';
import { fid, novoTrabalho } from '../dados';
import type { FPS, Interveniente, TrabalhoFPS } from '../tipos';
import { ROT_ENQ } from './Lista';

type Up = (fn: (f: FPS) => void) => void;
const SECS = [['enquadramento', 'Enquadramento'], ['obra', 'Obra e intervenientes'], ['trabalhos', 'Trabalhos e medidas'], ['emergencia', 'Condicionantes e emergência']] as const;

/* campos fora dos ecrãs (dentro deles, cada letra recriava a caixa e o cursor saía) */
function Caixa({ titulo, children, direita }: { titulo: string; children: React.ReactNode; direita?: React.ReactNode }) {
  return <section className="mb-5 border border-paper-3 bg-white p-4 sm:p-5"><header className="mb-3 flex items-baseline justify-between gap-3"><h3 className="font-display text-[16px] font-bold">{titulo}</h3>{direita}</header>{children}</section>;
}
function SimNao({ v, set }: { v?: boolean; set: (v: boolean) => void }) {
  const B = (val: boolean, t: string) => <button type="button" className={`h-9 min-w-[64px] border px-3 text-[13px] font-semibold ${v === val ? 'border-ink bg-ink text-white' : 'border-paper-3 bg-white hover:border-ink'}`} onClick={() => set(val)}>{t}</button>;
  return <span className="flex gap-1">{B(true, 'Sim')}{B(false, 'Não')}</span>;
}
function Escolha({ on, falta, children, onClick }: { on: boolean; falta?: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-start gap-2 border px-3 py-2 text-left text-[12.5px] ${on ? 'border-ink bg-ink text-white' : falta ? 'border-alerta bg-alerta-soft' : 'border-paper-3 bg-white hover:border-ink'}`}>{children}</button>;
}
function NumCampo({ l, v, set, hint }: { l: string; v?: number; set: (n?: number) => void; hint?: string }) {
  return <Field label={l} hint={hint}><input className="input-num" inputMode="numeric" placeholder="0" value={v ?? ''} onChange={(e) => { const n = parseInt(e.target.value); set(Number.isFinite(n) ? n : undefined); }} /></Field>;
}
function Pessoa({ l, p, set, cls = '', hint }: { l: string; p: Interveniente; set: (k: keyof Interveniente, v: string) => void; cls?: string; hint?: string }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr] ${cls}`}>
      <Field label={l} hint={hint}><Text value={p.nome} onChange={(v) => set('nome', v)} placeholder="Nome / entidade" /></Field>
      <Field label="Função"><Text value={p.funcao} onChange={(v) => set('funcao', v)} /></Field>
      <Field label="Contacto"><Text value={p.contacto} onChange={(v) => set('contacto', v)} /></Field>
    </div>
  );
}

export default function Editor({ id, sec }: { id: string; sec: string }) {
  const f = useFPS((s) => s.fichas.find((x) => x.id === id));
  const atualizar = useFPS((s) => s.atualizar);
  if (!f) return <main className="mx-auto max-w-[720px] px-4 py-10"><p className="mb-4 font-display text-[20px] font-bold">Ficha não encontrada.</p><button className="btn" onClick={() => go('/fps')}>Voltar</button></main>;
  const up: Up = (fn) => atualizar(id, fn);
  const enq = enquadramento(f);
  const [rot, cls] = ROT_ENQ[enq.estado];
  const atual = SECS.some((s) => s[0] === sec) ? sec : 'enquadramento';
  const falta = faltaFPS(f);
  return (
    <div className="pb-24">
      <div className="border-b border-ink bg-white">
        <div className="mx-auto max-w-[1100px] px-4 pt-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-ghost" onClick={() => go('/fps')}><ArrowLeft size={15} /> Fichas</button>
            <div className="mr-auto min-w-0">
              <p className="flex items-center gap-2"><span className={`border px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase ${cls}`}>{rot}</span><span className="truncate font-display text-[19px] font-bold">{f.obra.designacao || 'Obra por indicar'}</span></p>
              <p className="truncate text-[12.5px] text-ink-3">{[f.donoObra.nome, f.obra.localizacao].filter(Boolean).join(' · ') || 'Dono da obra e local por indicar'}</p>
            </div>
            <button className="btn-fire h-10 px-4" disabled={enq.estado !== 'fps'} title={enq.estado !== 'fps' ? 'O documento só se gera quando a FPS é a peça exigida' : ''} onClick={() => go(`/fps/f/${id}/documento`)}><FileText size={16} /> Documento</button>
          </div>
          <nav className="-mb-px mt-3 flex gap-1 overflow-x-auto">
            {SECS.map(([k, t]) => <a key={k} href={`#/fps/f/${id}/${k}`} className={`shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-semibold ${atual === k ? 'border-fire text-ink' : 'border-transparent text-ink-3 hover:text-ink'}`}>{t}</a>)}
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-[1100px] px-4 pt-6 sm:px-6">
        {atual === 'enquadramento' && <Enquadramento f={f} up={up} />}
        {atual === 'obra' && <Obra f={f} up={up} />}
        {atual === 'trabalhos' && <Trabalhos f={f} up={up} />}
        {atual === 'emergencia' && <Emergencia f={f} up={up} />}
        {atual !== 'enquadramento' && <Faltas itens={falta} titulo="Falta preencher (art. 14.º n.º 2)" />}
      </main>
    </div>
  );
}

function Enquadramento({ f, up }: { f: FPS; up: Up }) {
  const enq = enquadramento(f);
  const cp = comunicacaoPrevia(f);
  const togg = (k: 'tipoTrabalho' | 'riscosEspeciais', l: string) => up((x) => { const s = new Set((x[k] ?? []).filter((v) => v !== 'nenhum')); if (s.has(l)) s.delete(l); else s.add(l); x[k] = [...s]; });
  const cor = enq.estado === 'fps' ? 'border-ok' : enq.estado === 'pss' ? 'border-alerta' : 'border-ink-4';
  return (
    <>
      <div className={`mb-5 border-l-[4px] ${cor} bg-white p-4`}>
        <p className="label mb-1">Resultado</p>
        <p className="text-[14px] font-semibold">{enq.texto}</p>
      </div>
      <Caixa titulo="1. Tipo de trabalho (art. 2.º n.º 2)">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {TRABALHOS_ART2.map(([l, t]) => <Escolha key={l} on={f.tipoTrabalho.includes(l)} falta={!f.tipoTrabalho.length} onClick={() => togg('tipoTrabalho', l)}><b className="font-mono">{l})</b> {t}</Escolha>)}
          <Escolha on={f.tipoTrabalho.includes('nenhum')} falta={!f.tipoTrabalho.length} onClick={() => up((x) => { x.tipoTrabalho = ['nenhum']; })}>Nenhum destes (não é construção nem engenharia civil)</Escolha>
        </div>
      </Caixa>
      {!f.tipoTrabalho.includes('nenhum') && <>
        <Caixa titulo="2. A obra está sujeita a projeto?">
          <SimNao v={f.sujeitaProjeto} set={(v) => up((x) => { x.sujeitaProjeto = v; })} />
          <p className="mt-2 text-[12px] text-ink-3">Com projeto e riscos especiais ou comunicação prévia, a lei exige o plano de segurança e saúde (art. 5.º n.º 4). Manutenção corrente sem projeto não está sujeita.</p>
        </Caixa>
        <Caixa titulo="3. Duração e trabalhadores (comunicação prévia, art. 15.º n.º 1)">
          <div className="grid gap-3 sm:grid-cols-3">
            <NumCampo l="Duração (dias)" v={f.duracaoDias} set={(n) => up((x) => { x.duracaoDias = n; })} />
            <NumCampo l="Máx. trabalhadores em simultâneo" v={f.maxSimultaneos} set={(n) => up((x) => { x.maxSimultaneos = n; })} />
            <NumCampo l="Soma dos dias de trabalho" v={f.diasTrabalho} set={(n) => up((x) => { x.diasTrabalho = n; })} hint="Opcional. Sem ela estima-se duração × trabalhadores." />
          </div>
          <p className="mt-2 text-[12.5px]">{cp === undefined ? 'Indique a duração e os trabalhadores.' : cp ? <b className="text-alerta">Há lugar a comunicação prévia (mais de 30 dias e mais de 20 trabalhadores em simultâneo, ou mais de 500 dias de trabalho).</b> : 'Não há lugar a comunicação prévia.'}</p>
        </Caixa>
        <Caixa titulo="4. Há trabalhos com riscos especiais? (art. 7.º)">
          <div className="grid gap-1.5">
            <Escolha on={!!f.riscosEspeciais && !f.riscosEspeciais.length} falta={f.riscosEspeciais === undefined} onClick={() => up((x) => { x.riscosEspeciais = []; })}>Nenhum risco especial</Escolha>
            {RISCOS_ART7.map(([l, t]) => <Escolha key={l} on={!!f.riscosEspeciais?.includes(l)} falta={f.riscosEspeciais === undefined} onClick={() => togg('riscosEspeciais', l)}><b className="font-mono">{l})</b> {t}</Escolha>)}
          </div>
        </Caixa>
      </>}
    </>
  );
}

function Obra({ f, up }: { f: FPS; up: Up }) {
  const falta = faltaFPS(f).map((x) => x[0]);
  const fc = (k: string) => (falta.includes(k) ? 'falta' : '');
  const setP = (k: 'donoObra' | 'executante' | 'diretorTecnico' | 'tecnicoSST' | 'coordenadorObra') => (c: keyof Interveniente, v: string) => up((x) => { x[k][c] = v; });
  return (
    <>
      <Caixa titulo="a) Identificação, caracterização e duração da obra">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Obra" className={fc('Identificação da obra')}><Text value={f.obra.designacao} onChange={(v) => up((x) => { x.obra.designacao = v; })} placeholder="Ex.: Manutenção e lavagem da central fotovoltaica" /></Field>
          <Field label="Localização" className={fc('Localização')}><Text value={f.obra.localizacao} onChange={(v) => up((x) => { x.obra.localizacao = v; })} /></Field>
          <Field label="Caracterização" className={`sm:col-span-2 ${fc('Caracterização da obra')}`}><Area rows={3} value={f.obra.caracterizacao} onChange={(v) => up((x) => { x.obra.caracterizacao = v; })} placeholder="O que se vai fazer, onde e com que meios" /></Field>
          <Field label="Início previsto" className={fc('Duração da obra')}><input type="date" className="input" value={f.obra.inicio} onChange={(e) => up((x) => { x.obra.inicio = e.target.value; })} /></Field>
          <Field label="Fim previsto"><input type="date" className="input" value={f.obra.fim} onChange={(e) => up((x) => { x.obra.fim = e.target.value; })} /></Field>
          <Field label="Coordenadas (opcional)"><Text value={f.obra.coordenadas} onChange={(v) => up((x) => { x.obra.coordenadas = v; })} /></Field>
        </div>
      </Caixa>
      <Caixa titulo="b) Intervenientes relevantes">
        <div className="flex flex-col gap-4">
          <Pessoa l="Dono da obra" p={f.donoObra} set={setP('donoObra')} cls={fc('Dono da obra')} />
          <Pessoa l="Entidade executante" p={f.executante} set={setP('executante')} cls={fc('Entidade executante')} hint="Elabora a FPS e garante que os trabalhadores a conhecem (art. 14.º n.º 1)" />
          <Pessoa l="Responsável pela direção técnica da obra" p={f.diretorTecnico} set={setP('diretorTecnico')} />
          <Pessoa l="Técnico de segurança da entidade executante" p={f.tecnicoSST} set={setP('tecnicoSST')} />
          <Pessoa l="Coordenador de segurança em obra" p={f.coordenadorObra} set={setP('coordenadorObra')} cls={fc('Coordenador de segurança em obra')} hint="Obrigatório se intervierem duas ou mais empresas (art. 9.º n.º 2); analisa a FPS (art. 14.º n.º 3)" />
        </div>
        <p className="label mb-2 mt-5">Subempreiteiros</p>
        {f.subempreiteiros.map((s, k) => (
          <div key={s.id} className="mb-2 grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_32px]">
            <Text value={s.nome} onChange={(v) => up((x) => { x.subempreiteiros[k].nome = v; })} placeholder="Empresa" />
            <Text value={s.atividade} onChange={(v) => up((x) => { x.subempreiteiros[k].atividade = v; })} placeholder="Atividade" />
            <Text value={s.contacto} onChange={(v) => up((x) => { x.subempreiteiros[k].contacto = v; })} placeholder="Contacto" />
            <button className="btn-ghost justify-center hover:!text-alerta" onClick={() => up((x) => { x.subempreiteiros.splice(k, 1); })}><X size={14} /></button>
          </div>
        ))}
        <button className="text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => up((x) => { x.subempreiteiros.push({ id: fid(), nome: '', atividade: '', contacto: '' }); })}>+ Adicionar subempreiteiro</button>
      </Caixa>
      <Caixa titulo="Documento">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Título" className="sm:col-span-2"><Text value={f.titulo} onChange={(v) => up((x) => { x.titulo = v; })} /></Field>
          <Field label="Código"><Text value={f.codigo} onChange={(v) => up((x) => { x.codigo = v; })} /></Field>
          <Field label="Revisão"><Text value={f.revisao} onChange={(v) => up((x) => { x.revisao = v; })} /></Field>
          <Field label="Data"><input type="date" className="input" value={f.data} onChange={(e) => up((x) => { x.data = e.target.value; })} /></Field>
        </div>
      </Caixa>
    </>
  );
}

function CartaoTrabalho({ f, t, k, up }: { f: FPS; t: TrabalhoFPS; k: number; up: Up }) {
  const upT = (fn: (x: TrabalhoFPS) => void) => up((x) => { const z = x.trabalhos.find((y) => y.id === t.id); if (z) fn(z); });
  const sug = t.riscosEspeciais.flatMap((l) => MEDIDAS_ART7[l] ?? []).filter((m) => !t.medidas.some((x) => x.texto === m));
  return (
    <Caixa titulo={`Trabalho ${k + 1}`} direita={<button className="text-[12px] text-ink-3 hover:text-alerta" onClick={() => { if (confirm(`Apagar o trabalho ${k + 1}?`)) up((x) => { x.trabalhos = x.trabalhos.filter((y) => y.id !== t.id); }); }}>Apagar</button>}>
      <Field label="Trabalho / atividade" className={t.descricao.trim() ? '' : 'falta'}><Text value={t.descricao} onChange={(v) => upT((x) => { x.descricao = v; })} placeholder="Ex.: Acesso e deslocação na cobertura" /></Field>
      {!!f.riscosEspeciais?.length && (
        <div className="mt-3">
          <p className="label mb-1.5">Riscos especiais deste trabalho (art. 7.º)</p>
          <div className="flex flex-wrap gap-1.5">{f.riscosEspeciais.map((l) => { const on = t.riscosEspeciais.includes(l); return <button key={l} type="button" title={RISCOS_ART7.find((r) => r[0] === l)?.[1]} className={`border px-2.5 py-1 text-[12px] font-semibold ${on ? 'border-ink bg-ink text-white' : 'border-paper-3 bg-white'}`} onClick={() => upT((x) => { x.riscosEspeciais = on ? x.riscosEspeciais.filter((y) => y !== l) : [...x.riscosEspeciais, l]; })}>{l}) {RISCOS_ART7.find((r) => r[0] === l)?.[1].split(',')[0]}</button>; })}</div>
        </div>
      )}
      <div className="mt-3"><Field label="Riscos" hint="O que pode correr mal neste trabalho"><Area rows={2} value={t.riscos} onChange={(v) => upT((x) => { x.riscos = v; })} placeholder="Ex.: queda em altura; queda através de superfícies frágeis; queda de objetos" /></Field></div>
      <p className="label mb-1.5 mt-4">Medidas de prevenção</p>
      {t.medidas.map((m) => (
        <div key={m.id} className="mb-2 grid grid-cols-[1fr_32px] gap-2">
          <Area rows={2} value={m.texto} onChange={(v) => upT((x) => { const z = x.medidas.find((y) => y.id === m.id); if (z) z.texto = v; })} />
          <button className="btn-ghost justify-center hover:!text-alerta" onClick={() => upT((x) => { x.medidas = x.medidas.filter((y) => y.id !== m.id); })}><X size={14} /></button>
        </div>
      ))}
      {!t.medidas.some((m) => m.texto.trim()) && <div className="input falta mb-2 flex items-center text-[12.5px] text-alerta">Nenhuma medida indicada</div>}
      <button className="text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => upT((x) => { x.medidas.push({ id: fid(), texto: '' }); })}>+ Adicionar medida</button>
      {sug.length > 0 && (
        <div className="mt-3 border-l-[3px] border-fire bg-paper px-3 py-2">
          <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold"><Lightbulb size={14} /> Sugestões para os riscos especiais escolhidos (boas práticas — confirme)</p>
          {sug.map((m) => <button key={m} className="block py-0.5 text-left text-[12.5px] hover:text-fire-ink" onClick={() => upT((x) => { x.medidas.push({ id: fid(), texto: m }); })}>+ {m}</button>)}
        </div>
      )}
      <div className="mt-3"><Field label="Equipamento de proteção individual"><Text value={t.epi} onChange={(v) => upT((x) => { x.epi = v; })} placeholder={EPI_BASE} /></Field></div>
    </Caixa>
  );
}

function Trabalhos({ f, up }: { f: FPS; up: Up }) {
  return (
    <>
      <p className="mb-4 max-w-[760px] text-[13px] text-ink-3">Um bloco por trabalho que comporte riscos especiais, com as medidas de prevenção a adotar (art. 14.º n.º 1 e n.º 2 c)). As sugestões são de boas práticas: confirme-as e adapte-as ao estaleiro.</p>
      {f.trabalhos.map((t, k) => <CartaoTrabalho key={t.id} f={f} t={t} k={k} up={up} />)}
      <button className="btn h-10 px-4" onClick={() => { up((x) => { const t = novoTrabalho(); t.riscosEspeciais = (x.riscosEspeciais ?? []).length === 1 ? [...x.riscosEspeciais!] : []; t.epi = EPI_BASE; x.trabalhos.push(t); }); }}><Plus size={15} /> Adicionar trabalho</button>
    </>
  );
}

function Emergencia({ f, up }: { f: FPS; up: Up }) {
  const falta = faltaFPS(f).map((x) => x[0]);
  const fc = (k: string) => (falta.includes(k) ? 'falta' : '');
  return (
    <>
      <Caixa titulo="d) Condicionantes do estaleiro e da área envolvente">
        <div className={`grid gap-3 sm:grid-cols-2 ${fc('Condicionantes do estaleiro')}`}>
          <Field label="Terreno" hint="Características geológicas, hidrológicas e geotécnicas"><Area rows={2} value={f.condicionantes.terreno} onChange={(v) => up((x) => { x.condicionantes.terreno = v; })} /></Field>
          <Field label="Redes técnicas aéreas ou subterrâneas"><Area rows={2} value={f.condicionantes.redes} onChange={(v) => up((x) => { x.condicionantes.redes = v; })} placeholder="Ex.: linha de média tensão a 15 m; cabos elétricos na cobertura" /></Field>
          <Field label="Atividades que decorrem no local"><Area rows={2} value={f.condicionantes.atividades} onChange={(v) => up((x) => { x.condicionantes.atividades = v; })} placeholder="Ex.: fábrica em laboração; circulação de empilhadores" /></Field>
          <Field label="Outras condicionantes"><Area rows={2} value={f.condicionantes.outras} onChange={(v) => up((x) => { x.condicionantes.outras = v; })} placeholder="Ex.: claraboias e superfícies frágeis; acesso só pelo exterior" /></Field>
        </div>
      </Caixa>
      <Caixa titulo="e) Procedimentos em situações de emergência">
        <p className="label mb-2">Contactos</p>
        {f.emergencia.contactos.map((c, k) => (
          <div key={c.id} className="mb-2 grid grid-cols-[1fr_150px_32px] gap-2">
            <Text value={c.nome} onChange={(v) => up((x) => { x.emergencia.contactos[k].nome = v; })} placeholder="Quem" />
            <Text value={c.telefone} onChange={(v) => up((x) => { x.emergencia.contactos[k].telefone = v; })} placeholder="Telefone" />
            <button className="btn-ghost justify-center hover:!text-alerta" onClick={() => up((x) => { x.emergencia.contactos.splice(k, 1); })}><X size={14} /></button>
          </div>
        ))}
        {!f.emergencia.contactos.some((c) => c.telefone.trim()) && <div className="input falta mb-2 flex items-center text-[12.5px] text-alerta">Sem contactos</div>}
        <button className="text-[12.5px] font-semibold text-fire-ink hover:underline" onClick={() => up((x) => { x.emergencia.contactos.push({ id: fid(), nome: '', telefone: '' }); })}>+ Adicionar contacto</button>
        <p className="mt-1 text-[11.5px] text-ink-3">Sugestão: dono da obra, responsável da entidade executante, coordenador de segurança, hospital mais próximo.</p>
        <div className="mt-4 grid gap-3">
          <Field label="Ponto de encontro"><Text value={f.emergencia.pontoEncontro} onChange={(v) => up((x) => { x.emergencia.pontoEncontro = v; })} /></Field>
          <Field label="Procedimentos" className={fc('Procedimentos de emergência')} hint="Texto de partida sugerido pela app: adapte ao estaleiro"><Area rows={7} value={f.emergencia.procedimentos} onChange={(v) => up((x) => { x.emergencia.procedimentos = v; })} /></Field>
        </div>
      </Caixa>
      <Caixa titulo="Análise do coordenador de segurança em obra (art. 14.º n.º 3)">
        <div className="grid gap-3 sm:grid-cols-[1.4fr_160px]">
          <Field label="Coordenador"><Text value={f.analiseCSO.nome} onChange={(v) => up((x) => { x.analiseCSO.nome = v; })} /></Field>
          <Field label="Data"><input type="date" className="input" value={f.analiseCSO.data} onChange={(e) => up((x) => { x.analiseCSO.data = e.target.value; })} /></Field>
          <Field label="Alterações propostas / observações" className="sm:col-span-2"><Area rows={2} value={f.analiseCSO.observacoes} onChange={(v) => up((x) => { x.analiseCSO.observacoes = v; })} /></Field>
        </div>
      </Caixa>
    </>
  );
}
