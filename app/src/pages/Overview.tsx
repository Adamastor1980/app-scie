import { nomeUT } from '../nome';
import { ArrowRight, CheckCircle2, Circle, FileText } from 'lucide-react';
import { useP } from './ProjetoShell';
import { PercursoProjeto } from './Percurso';
import { dimensionarExtintores } from '../engine/extintores';
import { classificar, efetivoUT, CAT_NOME, fmt, faltaCaracterizacao } from '../engine/calc';
import { ROMANO } from '../data/rjscie';
import { CatBadge, Stat, Empty } from '../ui/primitives';
import { go } from '../router';
import type { Cat } from '../data/types';

export default function Overview() {
  const { p, up, pedirUT } = useP();
  const base = `/p/${p.id}`;
  const linhas = p.edificios.flatMap((e) => e.uts.map((u) => {
    const ef = efetivoUT(u);
    const c = classificar(u, ef);
    return { e, u, ef, c };
  }));
  const completas = linhas.length > 0 && linhas.every((l) => !l.c.falta.length);
  const max = completas ? (Math.max(...linhas.map((l) => l.c.cat)) as Cat) : null;
  const efTotal = linhas.reduce((s, l) => s + l.ef.total, 0);

  const checks = [
    { ok: !!(p.nome && p.morada && p.cliente), t: 'Identificação do projeto (nome, cliente, morada)', to: '/dados' },
    { ok: !!p.empresa.nome, t: 'Dados da empresa («A minha empresa»)', to: '#/empresa' },
    { ok: !!p.autor.nome, t: 'Autor técnico («A minha empresa»)', to: '#/empresa' },
    { ok: linhas.length > 0, t: 'Pelo menos uma utilização-tipo', to: '' },
    { ok: linhas.length > 0 && linhas.every((l) => l.c.falta.length === 0), t: 'Fatores de risco completos em todas as UT', to: '' },
    { ok: p.edificios.length > 0 && p.edificios.every((e) => !faltaCaracterizacao(e).length), t: 'Caracterização de todos os edifícios (altura e pisos acima)', to: p.edificios.find((e) => faltaCaracterizacao(e).length) ? `/e/${p.edificios.find((e) => faltaCaracterizacao(e).length)!.id}` : '' },
    { ok: p.plantas.length > 0, t: 'Peças desenhadas (plantas)', to: '/plantas' },
  ];

  if (p.modo === 'extintores') {
    const res = linhas.map((l) => ({ ...l, r: dimensionarExtintores(l.u, l.c.cat) }));
    return (
      <main className="mx-auto max-w-[1000px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-6 border-b-2 border-ink pb-5">
          <p className="label !text-fire-ink">Projeto só de dimensionamento de extintores · RT-SCIE, art. 163.º</p>
          <h1 className="h-display mt-2 text-[40px]">{p.nome}</h1>
          <p className="mt-2 text-[13px] text-ink-3">{[p.cliente, p.morada, p.concelho].filter(Boolean).join(' · ') || 'Preencha os dados do projeto.'}</p>
        </div>
        <ol className="mb-8 border border-ink bg-white text-[13.5px]">
          <li className="border-b border-paper-3 px-4 py-3"><b className="mr-2 font-mono text-fire-ink">1.</b>Dados do projeto (cliente, morada) — <button className="font-semibold text-fire-ink hover:underline" onClick={() => go(`${base}/dados`)}>abrir</button></li>
          <li className="border-b border-paper-3 px-4 py-3"><b className="mr-2 font-mono text-fire-ink">2.</b>Utilização-tipo de cada espaço {linhas.length === 0 ? <button className="ml-2 font-semibold text-fire-ink hover:underline" onClick={() => pedirUT(p.edificios[0].id)}>escolher UT</button> : <span className="text-ink-3">({linhas.length})</span>}</li>
          <li className="border-b border-paper-3 px-4 py-3"><b className="mr-2 font-mono text-fire-ink">3.</b>Em cada UT, o passo «Extintores»: área de cada piso e situações próprias</li>
          <li className="px-4 py-3"><b className="mr-2 font-mono text-fire-ink">4.</b>Estudo de dimensionamento — <button className="font-semibold text-fire-ink hover:underline" onClick={() => go(`${base}/extintores`)}>abrir e descarregar PDF</button></li>
        </ol>
        {res.length > 0 && (
          <div className="mb-8 border border-ink bg-white">
            {res.map(({ e, u, r }) => (
              <button key={u.id} onClick={() => go(`${base}/e/${e.id}/u/${u.id}/extintores`)} className="flex w-full items-center justify-between gap-3 border-b border-paper-3 px-4 py-3 text-left last:border-0 hover:bg-paper">
                <span><b className="font-mono">UT {ROMANO[u.tipo]}</b> {nomeUT(u).nome} <span className="ref block">{e.nome}</span></span>
                <span className={`text-[12.5px] ${r.falta.length ? 'text-alerta' : 'text-ink-2'}`}>{r.falta.length ? 'Falta preencher' : r.totais.map((t) => `${t.qtd} × ${t.descricao}`).join(' · ') || (r.extras.length ? 'situações próprias' : 'não exigidos')}</span>
              </button>
            ))}
          </div>
        )}
        <button className="text-[12px] text-ink-3 hover:text-ink hover:underline" onClick={() => { if (confirm('Passar a projeto SCIE completo? Os dados já introduzidos mantêm-se e passam a aparecer todos os passos (fatores, efetivo, medidas, relatório, MAP).')) up((q) => { delete q.modo; }); }}>Passar a projeto SCIE completo</button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-6">
        <div>
          <p className="label !text-fire-ink">Painel do projeto</p>
          <h1 className="h-display mt-2 text-[44px]">{p.nome}</h1>
          <p className="mt-2 text-[13px] text-ink-3">{[p.cliente, p.morada, p.concelho].filter(Boolean).join(' · ') || 'Preencha os dados do projeto.'}</p>
        </div>
        <button className="btn-primary h-11 px-5" onClick={() => go(`${base}/relatorio`)}><FileText size={16} /> Gerar relatório</button>
      </div>

      <div className="mb-10 grid gap-3 md:grid-cols-4">
        <Stat label="Edifícios" value={p.edificios.length} />
        <Stat label="Utilizações-tipo" value={linhas.length} />
        <Stat label="Efetivo total" value={fmt(efTotal)} unit="pessoas" />
        <Stat label="Categoria mais gravosa" value={max ? `${max}.ª` : '—'} sub={max ? CAT_NOME[max] : linhas.length ? 'Por atribuir (faltam critérios)' : 'Sem UT'} accent />
      </div>

      <PercursoProjeto p={p} atualizar={up} />

      <section className="mb-10">
        <h2 className="section-title mb-3">Utilizações-tipo</h2>
        {linhas.length === 0 ? (
          <Empty title="Comece por escolher a utilização-tipo." action={<button className="btn-fire" onClick={() => pedirUT(p.edificios[0].id)}>Escolher UT</button>}>
            Cada UT tem apenas os campos que o anexo III do RJ-SCIE exige para a sua classificação. O efetivo e a carga de incêndio são calculados na própria UT.
          </Empty>
        ) : (
          <div className="border border-ink bg-white">
            <table className="tbl">
              <thead>
                <tr><th>Edifício</th><th>UT</th><th>Designação</th><th className="text-right">Efetivo</th><th>Fator determinante</th><th>Categoria</th><th /></tr>
              </thead>
              <tbody>
                {linhas.map(({ e, u, ef, c }) => (
                  <tr key={u.id} className="cursor-pointer" onClick={() => go(`${base}/e/${e.id}/u/${u.id}/fatores`)}>
                    <td>{e.nome}</td>
                    <td className="num font-semibold">{ROMANO[u.tipo]}</td>
                    <td>{nomeUT(u).nome}</td>
                    <td className="num text-right">{fmt(ef.total)}</td>
                    <td className="text-ink-3">{c.falta.length ? <span className="text-warn">Falta: {c.falta.join(', ')}</span> : c.determinantes.join('; ') || 'Todos os fatores na 1.ª categoria'}</td>
                    <td><CatBadge cat={c.falta.length ? null : c.cat} size="sm" /></td>
                    <td className="text-right"><ArrowRight size={15} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title mb-3">Estado do relatório</h2>
        <div className="grid gap-px border border-ink bg-ink md:grid-cols-2">
          {checks.map((c) => (
            <button key={c.t} onClick={() => (c.to.startsWith('#') ? go(c.to.slice(1)) : go(`${base}${c.to}`))} className="flex items-center gap-3 bg-white p-3.5 text-left text-[13px] hover:bg-paper">
              {c.ok ? <CheckCircle2 size={18} className="text-ok" /> : <Circle size={18} className="text-ink-4" />}
              <span className={c.ok ? '' : 'text-ink-3'}>{c.t}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
