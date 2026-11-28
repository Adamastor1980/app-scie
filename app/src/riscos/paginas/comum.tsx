import type { ReactNode } from 'react';
import { nivel, nivelNP } from '../motor';
import type { AvaliacaoRiscos, VersaoSSARA } from '../tipos';

/** Chip do nível de intervenção (Quadro 8), com a cor da matriz */
export function ChipNivel({ nr, pequeno }: { nr?: number; pequeno?: boolean }) {
  const n = nivel(nr);
  if (!n) return <span className={`inline-flex items-center border border-dashed border-ink-4 px-1.5 font-mono text-ink-4 ${pequeno ? 'text-[10.5px]' : 'text-[12px]'}`}>—</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 font-mono font-bold text-white ${pequeno ? 'py-0 text-[10.5px]' : 'py-0.5 text-[12px]'}`} style={{ background: n.cor }}>
      {n.n}<span className="font-medium opacity-90">· {nr}</span>
    </span>
  );
}

export const textoNP = (v?: number) => { const n = nivelNP(v); return n ? `${v} (${n.sigla})` : '—'; };

export function BadgeVersao({ v }: { v: VersaoSSARA }) {
  return <span className={`inline-flex items-center px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wider ${v === 'completa' ? 'bg-ink text-fire' : 'border border-ink text-ink'}`}>{v === 'completa' ? 'Completa' : 'Light'}</span>;
}

/** Campos de identificação obrigatórios por preencher: [campo, para que serve] */
export function faltaIdent(a: AvaliacaoRiscos): [string, string][] {
  const f: [string, string][] = [];
  if (!a.entidade.designacao.trim()) f.push(['Entidade avaliada', 'empresa ou estabelecimento onde se faz a avaliação (Lei n.º 102/2009, art. 15.º n.º 2 c))']);
  if (!a.trabalho.local.trim()) f.push(['Local avaliado', 'instalação, setor ou posto de trabalho a que a avaliação se refere']);
  if (!a.trabalho.atividade.trim()) f.push(['Atividade', 'trabalho ou processo avaliado']);
  if (!a.metodo.dataAvaliacao) f.push(['Data da avaliação', 'data a que se reporta a avaliação (o documento deve manter-se atualizado — art. 98.º n.º 2 a))']);
  if (!a.equipa.elaborado.nome.trim()) f.push(['Elaborado por', 'técnico que fez a avaliação e assina o relatório (art. 98.º n.º 1 b))']);
  if (!a.sensiveis) f.push(['Grupos sensíveis', 'indicar se há trabalhadores particularmente sensíveis expostos, ou «Nenhum identificado» (art. 18.º n.º 1 a))']);
  if (a.versao === 'completa' && !a.executante.designacao.trim()) f.push(['Entidade executante', 'quem realiza a avaliação (serviço interno ou externo de SST)']);
  return f;
}

export const dataPt = (iso?: string) => (iso ? new Date(iso + 'T00:00').toLocaleDateString('pt-PT') : '—');
export const dataLonga = (iso?: string) => (iso ? new Date(iso + 'T00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '');

export function Caixa({ titulo, children, direita }: { titulo: string; children: ReactNode; direita?: ReactNode }) {
  return (
    <section className="mb-5 border border-paper-3 bg-white p-4 sm:p-5">
      <header className="mb-3 flex items-baseline justify-between gap-3"><h3 className="font-display text-[16px] font-bold">{titulo}</h3>{direita}</header>
      {children}
    </section>
  );
}

export const refR = (i: number) => `R${String(i + 1).padStart(2, '0')}`;
