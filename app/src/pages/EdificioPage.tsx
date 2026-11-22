import { nomeUT } from '../nome';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import { go } from '../router';
import { Area, CatBadge, Empty, Field, Note, Num, Section, Text, Toggle } from '../ui/primitives';
import { classeAltura } from '../data/rtscie';
import { ROMANO, utInfo } from '../data/rjscie';
import { classificar, efetivoUT, fmt } from '../engine/calc';

export default function EdificioPage({ eid }: { eid: string }) {
  const { p, up, pedirUT } = useP();
  const e = p.edificios.find((x) => x.id === eid);
  if (!e) return <div className="p-8">Edifício não encontrado.</div>;
  const ue = (fn: (x: NonNullable<typeof e>) => void) => up((pp) => { const x = pp.edificios.find((y) => y.id === eid); if (x) fn(x); });

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-8 flex items-end justify-between border-b-2 border-ink pb-5">
        <div>
          <p className="label !text-fire-ink">Edifício / recinto</p>
          <h1 className="h-display mt-2 text-[40px]">{e.nome}</h1>
        </div>
        {p.edificios.length > 1 && (
          <button className="btn" onClick={() => {
            if (!confirm(`Apagar «${e.nome}» e as suas UT?`)) return;
            up((pp) => { pp.edificios = pp.edificios.filter((x) => x.id !== eid); });
            go(`/p/${p.id}`);
          }}><Trash2 size={14} /> Apagar edifício</button>
        )}
      </div>

      <Section n="01" title="Caracterização" sub="Anexo IV, I-3: caracterização e descrição do edifício.">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Designação" className="md:col-span-2"><Text value={e.nome} onChange={(v) => ue((x) => { x.nome = v; })} /></Field>
          <Field label="Altura do edifício" legal="RT-SCIE, anexo I, n.º 1" hint={`Classe: ${classeAltura(e.altura)} altura`}>
            <Num value={e.altura} onChange={(v) => ue((x) => { x.altura = v; })} suffix="m" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pisos acima"><Num value={e.pisosAcima} onChange={(v) => ue((x) => { x.pisosAcima = v; })} /></Field>
            <Field label="Pisos abaixo"><Num value={e.pisosAbaixo} onChange={(v) => ue((x) => { x.pisosAbaixo = v; })} /></Field>
          </div>
          <Field label="Descrição funcional" className="md:col-span-4" hint="Sistema construtivo, envolvente, acessos, ocupação. Entra na memória descritiva.">
            <Area value={e.descricao} onChange={(v) => ue((x) => { x.descricao = v; })} rows={4} />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle checked={e.independente} onChange={(v) => ue((x) => { x.independente = v; })} label="Edifício independente" legal="RJ-SCIE, art. 2.º j) e art. 13.º n.º 4" hint="Estrutura independente, sem comunicação interior ou apenas por câmara corta-fogo. Em estabelecimentos com vários edifícios independentes a categoria é atribuída a cada edifício." />
          <Toggle checked={e.comunicacoesComuns} onChange={(v) => ue((x) => { x.comunicacoesComuns = v; })} label="Utilização mista com comunicações interiores comuns" legal="RJ-SCIE, art. 13.º n.º 5; RT-SCIE, art. 130.º" hint="Afeta a configuração do alarme e as exigências mais gravosas nos espaços comuns." />
        </div>
        <p className="mt-3 text-[12px] text-ink-3">Altura do edifício = diferença de cota entre o piso mais desfavorável suscetível de ocupação e o plano de referência. Não contam o último piso só com instalações técnicas nem pisos de arrecadações com visitas episódicas.</p>
      </Section>

      <Section n="02" title="Utilizações-tipo do edifício" right={<button className="btn-fire" onClick={() => pedirUT(e.id)}><Plus size={15} /> Adicionar UT</button>}>
        {e.uts.length === 0 ? (
          <Empty title="Sem utilizações-tipo." action={<button className="btn-fire" onClick={() => pedirUT(e.id)}>Escolher UT</button>}>
            Comece por escolher a UT. A partir daí só lhe são pedidos os dados que essa UT exige.
          </Empty>
        ) : (
          <div className="grid gap-px border border-ink bg-ink md:grid-cols-2">
            {e.uts.map((u) => {
              const ef = efetivoUT(u);
              const c = classificar(u, ef);
              return (
                <button key={u.id} onClick={() => go(`/p/${p.id}/e/${e.id}/u/${u.id}/fatores`)} className="group flex items-center gap-4 bg-white p-4 text-left hover:bg-paper">
                  <span className="w-16 font-display text-[36px] font-extrabold leading-none text-fire-ink">{ROMANO[u.tipo]}</span>
                  <span className="flex-1">
                    <span className="block font-semibold">{nomeUT(u).nome}</span>
                    <span className="ref">{utInfo(u.tipo).quadro} · efetivo {fmt(ef.total)} · H {fmt(u.altura, 1)} m</span>
                  </span>
                  <CatBadge cat={c.cat} size="sm" />
                  <ArrowRight size={16} className="text-ink-4 group-hover:text-ink" />
                </button>
              );
            })}
          </div>
        )}
        {e.uts.length > 1 && (
          <div className="mt-4"><Note>Edifício de utilização mista: cada UT tem a sua categoria (art. 12.º). Aplicam-se as exigências mais gravosas nos espaços comuns, na estrutura e compartimentação comuns e no controlo de fumo das vias comuns (art. 13.º n.º 5).</Note></div>
        )}
      </Section>
    </main>
  );
}
