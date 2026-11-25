import { Fragment, useState, type ReactNode } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { useP } from './ProjetoShell';
import { Sheet, P, useDocumento } from './doc';
import { fichaSeguranca, type SNA } from '../engine/ficha';
import { classificar } from '../engine/calc';
import { nomeUT } from '../nome';
import { ROMANO } from '../data/rjscie';
import { baseLegalDoc, notaVersao } from '../versao';

const COR: Record<SNA, string> = { S: 'text-ok', N: 'text-alerta', NA: 'text-ink-3', '?': 'text-warn' };
const Sna = ({ v }: { v: SNA }) => <b className={`font-mono ${COR[v]}`}>{v === '?' ? '? (por verificar)' : v}</b>;
const VAZIO = <span className="text-alerta">a preencher</span>;
const val = (s?: string) => (s && s !== '—' ? s : VAZIO);

function Q({ n, t, children }: { n: string; t: string; children: ReactNode }) {
  return (
    <div className="avoid-break mb-4">
      <p className="mb-1.5 border-b-2 border-ink pb-1 font-display text-[13.5px] font-bold"><span className="mr-2 font-mono text-fire-ink">{n}</span>{t}</p>
      {children}
    </div>
  );
}
const Linha = ({ l, children }: { l: string; children: ReactNode }) => (
  <tr><td className="w-[48%] text-[11.5px] font-semibold">{l}</td><td className="text-[11.5px]">{children}</td></tr>
);

/** Dados para a ficha de segurança da 1.ª categoria, pela numeração do modelo da ANEPC, para transcrever para o modelo oficial. */
export default function FichaSeguranca() {
  const { p } = useP();
  const uts = p.edificios.flatMap((ed) => ed.uts.map((ut) => { const c = classificar(ut); return { ed, ut, cat: c.falta.length ? null : c.cat }; }));
  const [sel, setSel] = useState((uts.find((u) => u.cat === 1) ?? uts[0])?.ut.id ?? '');
  const { zoom, aGerar, imprimir } = useDocumento(p, 'Ficha de segurança — dados', 'ficha-folhas');
  const x = uts.find((u) => u.ut.id === sel) ?? uts[0];
  if (!x) return <main className="mx-auto max-w-[900px] px-4 py-10"><P>Ainda não há utilizações-tipo neste projeto.</P></main>;
  const f = fichaSeguranca(p, x.ed, x.ut);
  const dataPt = p.data ? new Date(p.data + 'T00:00').toLocaleDateString('pt-PT') : '';

  return (
    <div id="ficha-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-auto min-w-[220px]">
            <p className="label">Ficha de segurança — 1.ª categoria</p>
            <select className="input mt-1 h-10 py-0" value={x.ut.id} onChange={(e) => setSel(e.target.value)}>
              {uts.map(({ ed, ut, cat }) => <option key={ut.id} value={ut.id}>{ed.nome} · UT {ROMANO[ut.tipo]} — {nomeUT(ut).nome} · {cat ? `${cat}.ª cat.` : 'categoria por atribuir'}</option>)}
            </select>
          </div>
          <button className="btn-fire h-11 px-5" disabled={!!aGerar} onClick={() => imprimir()}>
            {aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}
          </button>
        </div>
        <div className={`mx-auto max-w-[1100px] px-4 pb-3 text-[12.5px] sm:px-6 ${f.aplicavel.ok ? 'text-ink-2' : 'font-semibold text-alerta'}`}>
          {f.aplicavel.motivo} Estes são os dados para transcrever para o <b>modelo oficial da ANEPC</b> (RJ-SCIE, anexo V, art. 1.º), pela mesma numeração; não substituem o modelo. Confirme a versão em vigor em prociv.gov.pt.
          {f.falta.length > 0 && <span className="mt-1 block font-semibold text-alerta">Falta preencher: {f.falta.join('; ')}.</span>}
        </div>
      </div>

      <Sheet>
        <p className="label !text-fire-ink">Dados para a ficha de segurança contra incêndio — modelo ANEPC</p>
        <h1 className="h-display mb-1 mt-2 text-[28px]">{p.nome}</h1>
        <p className="mb-5 text-[12px] text-ink-3">{x.ed.nome} · UT {ROMANO[x.ut.tipo]} — {nomeUT(x.ut).nome} · {f.cat}.ª categoria · {dataPt}</p>

        <Q n="1" t="Identificação">
          <table className="tbl"><tbody>
            <Linha l="1.1 Prédio urbano — morada">{val(f.q1.morada)}</Linha>
            <Linha l="Concelho / distrito">{val([f.q1.concelho, f.q1.distrito].filter(Boolean).join(' / '))}</Linha>
            <Linha l="Matriz, registo predial, licenças e alvará">{VAZIO}</Linha>
            <Linha l="1.2 Requerente">{val(f.q1.requerente)} <span className="text-ink-3">(NIF e morada a preencher)</span></Linha>
          </tbody></table>
        </Q>

        <Q n="2" t="Caracterização do edifício e das utilizações-tipo (RJ-SCIE, arts. 8.º, 12.º e 13.º)">
          <p className="mb-1 text-[11.5px] font-semibold">2.1 UT objeto da operação urbanística</p>
          <table className="tbl mb-3"><thead><tr><th>UT</th><th className="text-right">Altura (m)</th><th className="text-right">N.º pisos</th><th>Pisos</th><th className="text-right">Área bruta (m²)</th></tr></thead>
            <tbody><tr><td>{f.q21.ut}{f.q21.nota ? <span className="ref block">{f.q21.nota}</span> : null}</td><td className="num text-right">{val(f.q21.altura)}</td><td className="num text-right">{val(f.q21.nPisos)}</td><td className="num">{val(f.q21.pisos)}</td><td className="num text-right">{val(f.q21.area)}</td></tr></tbody></table>
          <p className="mb-1 text-[11.5px] font-semibold">2.2 Caracterização global do edifício</p>
          <table className="tbl mb-2"><tbody>
            <Linha l="Área bruta total">{f.q22.areaTotal !== '—' ? `${f.q22.areaTotal} m²` : VAZIO}</Linha>
            <Linha l="N.º de pisos acima / abaixo do solo">{val(f.q22.pisosAcima)} / {val(f.q22.pisosAbaixo)}</Linha>
            <Linha l="Altura do edifício">{f.q22.altura !== '—' ? `${f.q22.altura} m` : VAZIO}</Linha>
            <Linha l="N.º de frações, escadas e ascensores">{VAZIO}{f.q22.ascensores !== '—' ? <span className="text-ink-3"> (ascensores: {f.q22.ascensores})</span> : null}</Linha>
          </tbody></table>
          <table className="tbl"><thead><tr><th>UT existentes no edifício</th><th className="text-right">N.º pisos</th><th>Pisos</th><th className="text-right">Área bruta (m²)</th></tr></thead>
            <tbody>{f.q22.uts.map((u, i) => <tr key={i}><td>{u.ut}{u.nota ? <span className="ref block">{u.nota}</span> : null}</td><td className="num text-right">{u.nPisos}</td><td className="num">{u.pisos}</td><td className="num text-right">{u.area}</td></tr>)}</tbody></table>
        </Q>

        <Q n="3" t="Condições exteriores (RT-SCIE, título II)">
          <table className="tbl"><tbody>
            <Linha l="Cumpre os artigos aplicáveis do título II"><Sna v={f.q3.cumpre} /></Linha>
            <Linha l="Via de acesso (valores medidos no local)">{VAZIO}<span className="ref block">{f.q3.via}</span></Linha>
            <Linha l="Distância da saída ao marco / boca de incêndio">{VAZIO}<span className="ref block">{f.q3.hidrante}</span></Linha>
          </tbody></table>
        </Q>

        <Q n="4" t="Resistência ao fogo dos elementos de construção">
          <p className="mb-1 text-[11.5px] font-semibold">4.1 Elementos estruturais e incorporados (arts. 14.º a 19.º) — cumpre: <Sna v={f.q41.cumpre} /></p>
          <table className="tbl mb-3"><tbody>
            <Linha l="Só suporte de cargas">{f.q41.suporte}</Linha>
            <Linha l="Suporte e compartimentação">{f.q41.suporteComp}</Linha>
            <Linha l="Isolamento entre UT distintas">{f.q41.entreUT}</Linha>
          </tbody></table>
          <p className="mb-1 text-[11.5px] font-semibold">4.2 Vias de evacuação e locais de risco (arts. 20.º a 37.º) — cumpre: <Sna v={f.q42.cumpre} /></p>
          <table className="tbl"><thead><tr><th>Zona</th><th>Paredes / pavimentos (EI / REI)</th><th>Portas</th></tr></thead>
            <tbody>{f.q42.linhas.map(([z, a, b]) => <tr key={z}><td>{z}</td><td className="num">{a}</td><td className="num">{b}</td></tr>)}</tbody></table>
          <p className="ref mt-1">Valores mínimos exigidos (quadros XIII a XXII do RT-SCIE).</p>
        </Q>

        <Q n="5" t="Reação ao fogo dos materiais (arts. 38.º a 49.º)">
          <p className="mb-1 text-[11.5px]">Cumpre: <Sna v={f.q5.cumpre} /></p>
          <table className="tbl"><thead><tr><th>Zona</th><th>Pavimentos</th><th>Paredes e tetos</th></tr></thead>
            <tbody>{f.q5.linhas.map(([z, a, b]) => <tr key={z}><td>{z}</td><td className="num">{a}</td><td className="num">{b}</td></tr>)}</tbody></table>
          <p className="ref mt-1">Classes mínimas (quadros XXIII a XXV do RT-SCIE).</p>
        </Q>

        <Q n="6" t="Condições de evacuação (arts. 51.º a 67.º)">
          <table className="tbl"><tbody>
            <Linha l="Efetivo total (art. 51.º)">{f.q6.efTotal} pessoas</Linha>
            <Linha l="Efetivo por local de risco">{f.q6.porLocal.length ? f.q6.porLocal.map(([k, v]) => `${k}: ${v}`).join(' · ') : VAZIO}</Linha>
            <Linha l="Cumpre arts. 52.º a 60.º (saídas, UP, larguras)"><Sna v={f.q6.cumpreSaidas} /></Linha>
            <Linha l="Cumpre arts. 61.º a 67.º (vias horizontais e verticais)"><Sna v={f.q6.cumpreVias} /></Linha>
            <Linha l="Portas abrem no sentido da saída">{x.ut.tipo === 1 ? <span className="text-ink-3">NA (UT I dispensada, art. 62.º n.º 3)</span> : <Sna v={f.q6.portas} />}</Linha>
          </tbody></table>
        </Q>

        <Q n="7" t="Instalações técnicas">
          <table className="tbl"><tbody>{f.q7.map(([l, , v]) => <Linha key={l} l={l}><Sna v={v} /></Linha>)}</tbody></table>
        </Q>

        <Q n="8" t="Equipamentos e sistemas de segurança">
          <table className="tbl"><tbody>
            <Linha l="8.1 Sinalização (arts. 108.º a 112.º)"><Sna v={f.q8.sinalizacao} /></Linha>
            <Linha l="8.2 Iluminação de emergência (arts. 113.º a 115.º)"><Sna v={f.q8.iluminacao} /> · blocos autónomos: {f.q8.blocos}</Linha>
            <Linha l="8.3 Deteção, alarme e alerta (arts. 116.º a 132.º)"><Sna v={f.q8.alarme} /> · {f.q8.configuracao}</Linha>
            <Linha l="8.4 Controlo de fumo (arts. 133.º a 161.º)"><Sna v={f.q8.fumo} /><span className="ref block">Exigido em: {f.q8.espacosFumo}</span></Linha>
            <Linha l="8.5 Meios de 1.ª e 2.ª intervenção (arts. 163.º a 171.º)"><Sna v={f.q8.intervencao} /><span className="block">Extintores: {f.q8.extintores}</span><span className="block">Distância máxima: {f.q8.distanciaExtintor}</span><span className="block">Rede de incêndio armada tipo carretel: {f.q8.carretel}</span></Linha>
            <Linha l="8.6 Deteção automática de gás (arts. 184.º e 185.º)"><Sna v={f.q8.gas} /></Linha>
            <Linha l="8.7 Controlo de poluição do ar (arts. 180.º a 183.º)"><Sna v={f.q8.poluicao} /></Linha>
          </tbody></table>
          <p className="ref mt-1">Tipos e capacidades dos extintores a indicar pelo autor.</p>
        </Q>

        <Q n="9" t="Observações">
          <p className="mb-1 text-[11.5px] font-semibold">9.1 Não conformidades e justificações</p>
          {f.q91.length ? <ol className="mb-3 list-[lower-alpha] pl-5 text-[11.5px]">{f.q91.map((l, i) => <li key={i} className="mb-0.5">{l}</li>)}</ol> : <p className="mb-3 text-[11.5px] text-ink-3">Sem não conformidades registadas na verificação.</p>}
          <p className="mb-1 text-[11.5px] font-semibold">9.2 Autoproteção (título VII) — cumpre: <Sna v={f.q92.cumpre} /></p>
          <p className="text-[11.5px]">{f.q92.medidas}</p>
        </Q>

        <Q n="10" t="Autor da ficha">
          <table className="tbl"><tbody>
            <Linha l="Autor">{val(f.q10.autor)}</Linha>
            <Linha l="Data">{val(dataPt)}</Linha>
            <Linha l="Assinatura">{VAZIO}</Linha>
          </tbody></table>
        </Q>

        <Fragment>
          <p className="mt-6 border-t border-paper-3 pt-2 text-[10.5px] leading-relaxed text-ink-3">
            Legenda: S — cumpre; N — não cumpre; NA — não se aplica; ? — por verificar (sem verificação concluída no local). O quadro 11 (fiscalização) é preenchido pela câmara municipal. {baseLegalDoc(dataPt)} {notaVersao()}
          </p>
        </Fragment>
      </Sheet>
    </div>
  );
}
