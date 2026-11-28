import { ClipboardCheck, Copy, Plus, Trash2 } from 'lucide-react';
import { useRiscos } from '../store';
import { useStore } from '../../store';
import { go } from '../../router';
import { painel } from '../motor';
import type { VersaoSSARA } from '../tipos';
import { BadgeVersao, dataPt } from './comum';
import { NIVEIS } from '../motor';

export default function Lista() {
  const { avaliacoes, criar, atualizar, apagar, duplicar } = useRiscos();
  const novo = (v: VersaoSSARA) => {
    const id = criar(v);
    // dados comuns: «A minha empresa» é quem executa a avaliação; o autor é quem a elabora
    const { empresaPadrao: e, autorPadrao: au } = useStore.getState();
    atualizar(id, (a) => {
      if (e) Object.assign(a.executante, { designacao: e.nome || '', nipc: e.nif || '', morada: e.morada || '', contacto: [e.telefone, e.email].filter(Boolean).join(' · ') });
      if (au) {
        a.executante.responsavelTecnico = au.nome || '';
        a.executante.habilitacoes = [au.qualificacao, au.ordem && `${au.ordem} n.º ${au.numero || '—'}`].filter(Boolean).join(' · ');
        a.equipa.elaborado = { nome: au.nome || '', funcao: au.qualificacao || '', data: a.metodo.dataAvaliacao };
      }
    });
    go(`/riscos/a/${id}`);
  };
  const Escolha = ({ v, titulo, linhas }: { v: VersaoSSARA; titulo: string; linhas: string[] }) => (
    <button onClick={() => novo(v)} className="flex flex-col border border-ink bg-white p-5 text-left hover:bg-paper">
      <span className="mb-2 flex items-center justify-between"><BadgeVersao v={v} /><Plus size={18} /></span>
      <span className="font-display text-[19px] font-bold">{titulo}</span>
      <ul className="mt-2 space-y-0.5 text-[12.5px] text-ink-3">{linhas.map((l) => <li key={l}>· {l}</li>)}</ul>
    </button>
  );
  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-6">
      <div className="mb-6 border-b-2 border-ink pb-5">
        <p className="label !text-fire-ink">Segurança e saúde no trabalho · Lei n.º 102/2009</p>
        <h1 className="h-display mt-1 text-[38px]">Avaliação de riscos</h1>
        <p className="mt-2 max-w-[720px] text-[13.5px] text-ink-3">Método SSARA (NTP 330 do INSST): NR = ND × NE × NC. Escolha a versão no início de cada avaliação; pode mudar depois.</p>
      </div>
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <Escolha v="light" titulo="Nova avaliação Light" linhas={['Identificação essencial', 'Perigos, riscos e nível de risco', 'Medidas e risco residual', 'Relatório final']} />
        <Escolha v="completa" titulo="Nova avaliação Completa" linhas={['Todos os campos da matriz (áreas, expostos, medidas existentes)', 'Plano de ação com hierarquia, responsáveis, prazos e custos', 'Reavaliação, eficácia das medidas e painel', 'Relatório final']} />
      </div>
      <h2 className="mb-3 font-display text-[18px] font-bold">As minhas avaliações</h2>
      {!avaliacoes.length ? (
        <div className="border border-dashed border-ink-4 p-8 text-center text-[13.5px] text-ink-3"><ClipboardCheck className="mx-auto mb-2" />Ainda não há avaliações. Comece por escolher Light ou Completa.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {[...avaliacoes].sort((a, b) => b.atualizadoEm - a.atualizadoEm).map((a) => {
            const pn = painel(a);
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-3 border border-paper-3 bg-white p-3 sm:p-4">
                <button className="min-w-0 flex-1 text-left" onClick={() => go(`/riscos/a/${a.id}`)}>
                  <span className="flex flex-wrap items-center gap-2"><BadgeVersao v={a.versao} /><span className="font-semibold">{a.entidade.designacao || 'Entidade por indicar'}</span>{a.codigo && <span className="font-mono text-[11px] text-ink-3">{a.codigo} · rev. {a.revisao}</span>}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{[a.trabalho.local, a.trabalho.atividade].filter(Boolean).join(' · ') || 'Local e atividade por indicar'} · {dataPt(a.metodo.dataAvaliacao)}</span>
                </button>
                <span className="flex items-center gap-1" title="Riscos por nível de intervenção (I a IV)">
                  {pn.distInicial.map((q, i) => <span key={i} className="min-w-[26px] px-1 text-center font-mono text-[11px] font-bold text-white" style={{ background: q ? NIVEIS[i].cor : '#D8D5CC' }}>{q}</span>)}
                </span>
                <button className="btn-ghost" title="Duplicar" onClick={() => duplicar(a.id)}><Copy size={14} /></button>
                <button className="btn-ghost hover:!text-alerta" title="Apagar" onClick={() => { if (confirm(`Apagar a avaliação de «${a.entidade.designacao || 'entidade por indicar'}»?`)) apagar(a.id); }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
