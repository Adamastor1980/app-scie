import type { UTProps } from '../UTPage';
import { precisaCarga, precisaEfetivo } from '../UTPage';
import { Faltas, Field, Num, Section, Toggle } from '../../ui/primitives';
import { NOTA_PISOS_TECNICOS, utInfo } from '../../data/rjscie';
import { classificar, efetivoUT, fmt, porConfirmar } from '../../engine/calc';
import ClassPanel from './ClassPanel';
import { novaUT } from '../../store';

export default function UTFatores({ ut, upU }: UTProps) {
  const semNome = !ut.designacao.trim() || ut.designacao === novaUT(ut.tipo).designacao;
  const t = ut.tipo;
  const info = utInfo(t);
  const ef = efetivoUT(ut);
  const cls = classificar(ut, ef);
  const temArLivre = t === 2 || t === 6 || t === 9 || t === 12;
  const usaAltura = !(ut.arLivre && temArLivre) && t !== 12;
  const usaPisos = [1, 2, 6, 8, 9, 11, 12].includes(t) && !(ut.arLivre && temArLivre);
  const cargaV = precisaCarga(t) ? ((cls.fatores.find((f) => f.id === 'carga')?.valor as number) ?? 0) : 1;
  const faltas: [string, string][] = [];
  const fAlt = usaAltura && porConfirmar(ut, 'altura');
  const fPis = usaPisos && porConfirmar(ut, 'pisos');
  if (fAlt) faltas.push(['Altura da UT', 'diferença de cota entre o plano de referência e o pavimento do último piso acima do solo ocupado pela UT, em m (art. 2.º a) do RJ-SCIE); se for 0, confirme']);
  if (fPis) faltas.push(['N.º de pisos abaixo do plano de referência', `pisos ocupados pela UT abaixo do plano de referência (${info.quadro}); se não houver, confirme 0`]);
  if (t === 2 && !ut.arLivre && !(ut.areaBruta > 0)) faltas.push(['Área bruta', 'área total ocupada pela UT II, em m² (art. 2.º b) do RJ-SCIE)']);
  if (precisaEfetivo(t) && !(ef.total > 0)) faltas.push(['Efetivo', 'n.º de pessoas da UT, calculado no passo «Efetivo» (art. 51.º do RT-SCIE)']);
  if (precisaCarga(t) && !(cargaV > 0)) faltas.push(['Carga de incêndio', 'densidade de carga de incêndio modificada, calculada no passo «Carga de incêndio» (Despacho n.º 8954/2020)']);


  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
      <div>
        <div className={`mb-8 border p-4 ${semNome ? 'border-alerta bg-alerta-soft' : 'border-ink bg-white'}`}>
          <Field label="Nome da utilização-tipo (obrigatório)" hint={semNome ? 'Atribua um nome a esta UT: é o nome usado no menu lateral, no painel e no relatório.' : undefined}>
            <input className="input h-11 text-[15px] font-semibold" value={semNome ? '' : ut.designacao} placeholder="ex.: Parque de estacionamento piso -1"
              onChange={(e) => upU((u) => { u.designacao = e.target.value.trim() ? e.target.value : novaUT(u.tipo).designacao; })} />
          </Field>
        </div>
        <Section n="1.1" title="Fatores de risco" sub={info.fatores}>
          <div className="grid gap-4 md:grid-cols-2">
            {temArLivre && (
              <div className="md:col-span-2">
                <Toggle checked={ut.arLivre} onChange={(v) => upU((u) => { u.arLivre = v; })} label="Espaço ao ar livre" legal={`RJ-SCIE, art. 12.º n.º 2; ${info.quadro}`}
                  hint={t === 2 ? 'Recinto ao ar livre: o quadro II só admite a 1.ª categoria.' : t === 12 ? 'Ao ar livre: só conta a densidade de carga de incêndio modificada (coluna «ao ar livre» do quadro X).' : 'Ao ar livre: só conta o efetivo (coluna «ao ar livre» do quadro V).'} />
              </div>
            )}
            {usaAltura && (
              <Field label={`Altura da UT ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][t - 1]}`} legal="RJ-SCIE, art. 2.º a)"
                className={fAlt ? 'falta' : ''}
                hint="Diferença de cota entre o plano de referência e o pavimento do último piso acima do solo ocupado pela UT. Não conta o último piso só técnico nem pisos de arrecadações com visitas episódicas.">
                <Num value={ut.altura} mostrarZero={!!ut.indicados?.altura} onChange={(v, t) => upU((u) => { u.altura = v; u.indicados = { ...u.indicados, altura: t.trim() !== '' }; })} suffix="m" />
                {fAlt && <button type="button" className="self-start text-[11.5px] font-semibold text-fire-ink hover:underline" onClick={(e) => { e.preventDefault(); upU((u) => { u.altura = 0; u.indicados = { ...u.indicados, altura: true }; }); }}>Confirmar 0 m (só piso térreo)</button>}
              </Field>
            )}
            {usaPisos && (
              <Field label="N.º de pisos abaixo do plano de referência" legal={info.quadro} className={fPis ? 'falta' : ''} hint={NOTA_PISOS_TECNICOS.replace('(*) ', '')}>
                <Num value={ut.pisosAbaixo} mostrarZero={!!ut.indicados?.pisos} onChange={(v, t) => upU((u) => { u.pisosAbaixo = Math.round(v); u.indicados = { ...u.indicados, pisos: t.trim() !== '' }; })} />
                {fPis && <button type="button" className="self-start text-[11.5px] font-semibold text-fire-ink hover:underline" onClick={(e) => { e.preventDefault(); upU((u) => { u.pisosAbaixo = 0; u.indicados = { ...u.indicados, pisos: true }; }); }}>Confirmar 0 (nenhum piso abaixo)</button>}
              </Field>
            )}
            {t === 2 && !ut.arLivre && (
              <Field label="Área bruta ocupada pela UT II" legal="RJ-SCIE, art. 2.º b); quadro II" className={ut.areaBruta > 0 ? '' : 'falta'} hint="Superfície total delimitada pelo perímetro exterior das paredes exteriores e eixos das paredes interiores separadoras.">
                <Num value={ut.areaBruta} onChange={(v) => upU((u) => { u.areaBruta = v; })} suffix="m²" />
              </Field>
            )}
            {(t === 11 || t === 12) && (
              <div className="md:col-span-2">
                <Toggle checked={ut.exclusivoArmazem} onChange={(v) => upU((u) => { u.exclusivoArmazem = v; })} label="Destinada exclusivamente a armazém" legal={`Nota (**) do ${info.quadro}`} hint="Os limites da densidade de carga de incêndio modificada passam a ser 10 vezes superiores." />
              </div>
            )}
            {((t === 4 || t === 5) && ef.temD || t === 7 && ef.temE) && (
              <div className="md:col-span-2">
                <Toggle checked={ut.saidaIndependenteD} onChange={(v) => upU((u) => { u.saidaIndependenteD = v; })}
                  label={t === 7 ? 'Todos os locais de risco E com saídas independentes diretas ao exterior, no plano de referência' : 'Todos os locais de risco D com saídas independentes diretas ao exterior, no plano de referência'}
                  legal={`RJ-SCIE, art. 12.º n.º 2 d); ${info.quadro}`} hint="Condição exigida apenas para a 1.ª categoria (art. 12.º n.º 2 d))." />
              </div>
            )}
          </div>

          {(precisaEfetivo(t) || precisaCarga(t)) && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {precisaEfetivo(t) && (
                <div className={`flex items-center justify-between border p-4 ${ef.total > 0 ? 'border-ink bg-white' : 'border-warn bg-warn-soft'}`}>
                  <div>
                    <p className="label">Efetivo da UT {t === 4 || t === 5 ? '· em locais D/E' : t === 7 ? '· em locais E' : ''}</p>
                    <p className="mt-1 font-display text-[28px] font-extrabold num">{fmt(ef.total)}{(t === 4 || t === 5) && <span className="text-ink-4"> · {fmt(ef.emDE)}</span>}{t === 7 && <span className="text-ink-4"> · {fmt(ef.emE)}</span>}</p>
                    <p className="ref">Calculado no passo 02 (art. 51.º RT-SCIE)</p>
                  </div>
                  <a className="btn" href={`${location.hash.replace(/\/fatores$/, '')}/efetivo`}>Calcular →</a>
                </div>
              )}
              {precisaCarga(t) && (
                <div className={`flex items-center justify-between border p-4 ${cargaV > 0 ? 'border-ink bg-white' : 'border-warn bg-warn-soft'}`}>
                  <div>
                    <p className="label">Densidade de carga modificada</p>
                    <p className="mt-1 font-display text-[28px] font-extrabold num">{fmt(cls.fatores.find((f) => f.id === 'carga')?.valor as number)} <span className="font-mono text-[12px] text-ink-3">MJ/m²</span></p>
                    <p className="ref">Calculada no passo 03 (Despacho n.º 8954/2020)</p>
                  </div>
                  <a className="btn" href={`${location.hash.replace(/\/fatores$/, '')}/carga`}>Calcular →</a>
                </div>
              )}
            </div>
          )}
          <Faltas itens={faltas} titulo="Falta preencher para classificar a UT" />
        </Section>

      </div>
      <ClassPanel ut={ut} />
    </div>
  );
}
