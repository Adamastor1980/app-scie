import type { UTProps } from '../UTPage';
import { classificar, efetivoUT, cargaUT, CAT_NOME, CAT_RISCO, fmt, justificacaoCategoria } from '../../engine/calc';
import { INSPECOES, NOTA_PISOS_TECNICOS, ROMANO, utInfo } from '../../data/rjscie';
import { MAP_INFO, quadroXLI, quadroXXXIX } from '../../data/rtscie';
import { CAT_COR, Note, Section } from '../../ui/primitives';
import QuadroAnexo from './QuadroAnexo';

export default function UTCategoria({ ut }: UTProps) {
  const ef = efetivoUT(ut);
  const carga = cargaUT(ut);
  const c = classificar(ut, ef, carga);
  const info = utInfo(ut.tipo);
  const temDE = ef.temD || ef.temE;
  const map = quadroXXXIX(ut.tipo, c.cat, temDE);
  const sim = quadroXLI(ut.tipo, c.cat, temDE);
  const inspIsenta = c.cat === 1 && ut.tipo !== 4 && ut.tipo !== 5;

  return (
    <div>
      <div className="mb-10 grid gap-px border border-ink bg-ink lg:grid-cols-[320px_1fr]">
        <div className={`${CAT_COR[c.cat]} flex flex-col justify-between p-6 text-white`}>
          <p className="font-mono text-[11px] uppercase tracking-wider opacity-80">UT {ROMANO[ut.tipo]} · {info.quadro}</p>
          <p className="h-display my-6 text-[110px]">{c.cat}.ª</p>
          <div>
            <p className="font-display text-[22px] font-bold">{CAT_NOME[c.cat]}</p>
            <p className="text-[13px] opacity-90">{CAT_RISCO[c.cat]} (art. 12.º n.º 1)</p>
          </div>
        </div>
        <div className="bg-white p-6">
          <p className="label mb-2">Justificação</p>
          <p className="text-[14px] leading-relaxed">{justificacaoCategoria(c)}</p>
          {c.notas.map((n) => <p key={n} className="mt-2 text-[12.5px] text-ink-3">{n}</p>)}
          {c.falta.length > 0 && <div className="mt-3"><Note tone="warn">Dados em falta: {c.falta.join('; ')}. A categoria apresentada assume o valor zero para esses fatores.</Note></div>}
          <div className={`mt-5 grid gap-px border border-ink bg-ink ${['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4'][Math.min(c.fatores.length, 4)]}`}>
            {c.fatores.map((f) => (
              <div key={f.id} className="bg-white p-3">
                <p className="label">{f.rotulo}</p>
                <p className="num text-[18px] font-semibold">{typeof f.valor === 'number' ? fmt(f.valor, f.unidade === 'm' ? 2 : f.unidade === 'MJ/m²' ? 1 : 0) : f.valor}{typeof f.valor === 'number' && f.unidade ? ` ${f.unidade}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Section n="4.1" title={`${info.quadro} do anexo III — UT ${ROMANO[ut.tipo]}`} sub="Valores máximos por categoria. A célula assinalada é a categoria a que cada fator corresponde.">
        <QuadroAnexo c={c} />
        <p className="mt-2 text-[11.5px] text-ink-3">{NOTA_PISOS_TECNICOS}</p>
      </Section>

      <Section n="4.2" title="Consequências da categoria" sub="Efeitos diretos da categoria de risco no RJ-SCIE e no RT-SCIE.">
        <div className="grid gap-px border border-ink bg-ink md:grid-cols-2">
          <Item t="Entidade competente" v={c.cat === 1 ? 'Câmara municipal' : 'ANEPC'} b="RJ-SCIE, art. 5.º" />
          <Item t="Peça de SCIE" v={c.cat === 1 ? 'Ficha de segurança (anexo V)' : 'Projeto da especialidade (anexo IV)'} b="RJ-SCIE, art. 17.º" />
          <Item t="Inspeções regulares" v={inspIsenta ? 'Excetuada (art. 19.º n.º 5)' : `De ${INSPECOES[c.cat]} em ${INSPECOES[c.cat]} anos (prazo máximo)`} b="RJ-SCIE, art. 19.º n.os 4 e 5" />
          <Item t="Autor do projeto e das MAP" v={c.cat === 1 ? 'Sem exigência de certificação' : 'Técnico com certificação de especialização (OA/OE/OET), registado na ANEPC'} b="RJ-SCIE, art. 15.º-A" />
          <Item t="Medidas de autoproteção (quadro XXXIX)" v={map ? map.map((m) => MAP_INFO[m].nome).join(' · ') : 'Não exigíveis (art. 22.º n.º 1)'} b="RT-SCIE, art. 198.º" />
          <Item t="Simulacros (quadro XLI)" v={map?.includes('simulacros') && sim ? `Período máximo: ${sim}` : 'Não exigidos'} b="RT-SCIE, art. 207.º" />
        </div>
      </Section>
    </div>
  );
}

function Item({ t, v, b }: { t: string; v: string; b: string }) {
  return (
    <div className="bg-white p-4">
      <p className="label">{t}</p>
      <p className="mt-1 text-[14px] font-semibold leading-snug">{v}</p>
      <p className="ref mt-1">{b}</p>
    </div>
  );
}
