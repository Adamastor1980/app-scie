import { ArrowRight, Building, ClipboardCheck, Flame } from 'lucide-react';
import { useStore } from '../store';
import { useRiscos } from '../riscos/store';
import { go } from '../router';

/** Entrada da Cautela: escolher o caminho (módulos independentes) */
export default function Portal() {
  const nScie = useStore((s) => s.projetos.length);
  const nRiscos = useRiscos((s) => s.avaliacoes.length);
  const empresa = useStore((s) => s.empresaPadrao);
  const autor = useStore((s) => s.autorPadrao);
  const Cartao = ({ to, icone, titulo, sub, linhas, n }: { to: string; icone: React.ReactNode; titulo: string; sub: string; linhas: string[]; n: number }) => (
    <button onClick={() => go(to)} className="group flex flex-col border border-ink bg-white p-6 text-left transition-colors hover:bg-paper">
      <div className="mb-4 flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center bg-ink text-fire">{icone}</span>
        <span className="font-mono text-[11px] text-ink-3">{n} {n === 1 ? 'trabalho' : 'trabalhos'}</span>
      </div>
      <h2 className="font-display text-[26px] font-extrabold tracking-tight">{titulo}</h2>
      <p className="mt-1 text-[13px] text-ink-3">{sub}</p>
      <ul className="mt-4 flex-1 space-y-1 text-[13px] text-ink-2">{linhas.map((l) => <li key={l}>· {l}</li>)}</ul>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fire-ink group-hover:underline">Entrar <ArrowRight size={15} /></span>
    </button>
  );
  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-10">
      <div className="mb-8 border-b-2 border-ink pb-6">
        <h1 className="h-display text-[44px]">Para onde vamos hoje?</h1>
        <p className="mt-2 text-[14px] text-ink-3">Escolha o caminho. Os dados da sua empresa e do autor são comuns a todos.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Cartao to="/scie" icone={<Flame size={24} />} titulo="Segurança contra incêndio" sub="SCIE · Lei n.º 123/2019, Portaria n.º 135/2020, Despacho n.º 8954/2020" n={nScie}
          linhas={['Projetos SCIE, categoria de risco e medidas', 'Extintores, carretéis e manutenção com QR', 'Sinalética, MAP e relatórios']} />
        <Cartao to="/riscos" icone={<ClipboardCheck size={24} />} titulo="Avaliação de riscos" sub="SST · Lei n.º 102/2009 · método SSARA (NTP 330)" n={nRiscos}
          linhas={['Versão Light ou Completa', 'Biblioteca de perigos e medidas (sugestões)', 'Plano de ação, reavaliação e relatório']} />
      </div>
      <a href="#/empresa" className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-paper-3 bg-white p-4 hover:bg-paper">
        <span className="flex items-center gap-3"><Building size={18} className="text-ink-3" /><span><span className="block text-[13.5px] font-semibold">{empresa?.nome || 'A minha empresa'}</span><span className="block text-[12px] text-ink-3">{[autor?.nome, autor?.qualificacao].filter(Boolean).join(' · ') || 'Dados da empresa e do autor, comuns a todos os caminhos'}</span></span></span>
        <span className="text-[12.5px] font-semibold text-fire-ink">Editar</span>
      </a>
    </main>
  );
}
