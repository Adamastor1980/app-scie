import { nomeUT } from '../nome';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useP } from './ProjetoShell';
import { go } from '../router';
import { Area, CatBadge, Empty, Faltas, Field, Note, Num, Section, Text, Toggle } from '../ui/primitives';
import { classeAltura } from '../data/rtscie';
import { ROMANO, utInfo } from '../data/rjscie';
import { classificar, efetivoUT, faltaCaracterizacao, faltaEdificio, fmt, maiorAlturaUT } from '../engine/calc';

export default function EdificioPage({ eid }: { eid: string }) {
  const { p, up, pedirUT } = useP();
  const e = p.edificios.find((x) => x.id === eid);
  if (!e) return <div className="p-8">Edifício não encontrado.</div>;
  const fAlt = faltaEdificio(e);
  const faltaP = (k: string) => faltaCaracterizacao(e).some(([x]) => x === k);
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
        <div className="grid gap-4 md:grid-cols-4 md:[&>.field>span:first-child]:min-h-[30px] md:[&>.field>span:first-child]:items-end md:[&>div>.field>span:first-child]:min-h-[30px] md:[&>div>.field>span:first-child]:items-end md:[&>div>.field>span:first-child]:flex">
          <Field label="Designação" className="md:col-span-2"><Text value={e.nome} onChange={(v) => ue((x) => { x.nome = v; })} /></Field>
          <Field label="Altura do edifício" legal="RT-SCIE" className={fAlt.length ? 'falta' : ''} hint={fAlt.length ? undefined : `Classe: ${classeAltura(e.altura)} altura`}>
            <Num value={e.altura} mostrarZero={!!e.alturaIndicada} onChange={(v, t) => ue((x) => { x.altura = v; x.alturaIndicada = t.trim() !== ''; })} suffix="m" />
            {fAlt.length > 0 && !(e.altura > 0) && <button type="button" className="self-start text-[11.5px] font-semibold text-fire-ink hover:underline" onClick={(ev) => { ev.preventDefault(); ue((x) => { x.altura = maiorAlturaUT(x); x.alturaIndicada = true; }); }}>{maiorAlturaUT(e) > 0 ? `Usar ${fmt(maiorAlturaUT(e), 1)} m (maior altura das UT)` : 'Confirmar 0 m (só piso térreo)'}</button>}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pisos acima do solo (inclui o r/c)" className={faltaP('Pisos acima') ? 'falta' : ''} hint={e.pisosAcimaIndicado && e.pisosAcima === 1 && e.altura > 0 ? `Só o piso 0: confirme a altura de ${fmt(e.altura, 2)} m (só é possível se o piso 0 estiver acima do plano de referência)` : 'O r/c é o piso 0 (plano de referência)'}><Num value={e.pisosAcima} mostrarZero={!!e.pisosAcimaIndicado} onChange={(v, t) => ue((x) => { x.pisosAcima = Math.round(v); x.pisosAcimaIndicado = t.trim() !== ''; })} /></Field>
            <Field label="Pisos abaixo do solo (caves)" className={faltaP('Pisos abaixo') ? 'falta' : ''} hint="Caves: pisos −1, −2…"><Num value={e.pisosAbaixo} mostrarZero={!!e.pisosAbaixoIndicado} onChange={(v, t) => ue((x) => { x.pisosAbaixo = Math.round(v); x.pisosAbaixoIndicado = t.trim() !== ''; })} /></Field>
          </div>
          <Field label="Descrição funcional" className="md:col-span-4" hint="Sistema construtivo, envolvente, acessos, ocupação. Entra na memória descritiva.">
            <Area value={e.descricao} onChange={(v) => ue((x) => { x.descricao = v; })} rows={4} />
          </Field>
        </div>
        <Faltas itens={faltaCaracterizacao(e)} titulo="Falta preencher" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle checked={e.independente} onChange={(v) => ue((x) => { x.independente = v; })} label="Edifício independente" legal="RJ-SCIE, art. 2.º j) e RJ-SCIE, art. 13.º n.º 4" hint="Estrutura independente, sem comunicação interior ou apenas por câmara corta-fogo. Em estabelecimentos com vários edifícios independentes a categoria é atribuída a cada edifício." />
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
                  <CatBadge cat={c.falta.length ? null : c.cat} size="sm" />
                  <ArrowRight size={16} className="text-ink-4 group-hover:text-ink" />
                </button>
              );
            })}
          </div>
        )}
        {e.uts.length > 1 && (
          <div className="mt-4"><Note>Edifício de utilização mista: cada UT tem a sua categoria (RJ-SCIE, art. 12.º). Aplicam-se as exigências mais gravosas nos espaços comuns, na estrutura e compartimentação comuns e no controlo de fumo das vias comuns (RJ-SCIE, art. 13.º n.º 5).</Note></div>
        )}
      </Section>
    </main>
  );
}
