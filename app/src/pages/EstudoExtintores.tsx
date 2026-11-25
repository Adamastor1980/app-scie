import { Loader2, Printer } from 'lucide-react';
import { useP } from './ProjetoShell';
import { Sheet, H1, H2, P, useDocumento } from './doc';
import { QuadroExtintores } from './ExtintoresQuadro';
import { classificar, fmt, pisosUT } from '../engine/calc';
import { dimensionarExtintores } from '../engine/extintores';
import { tituloUT } from '../nome';
import { baseLegalDoc, notaVersao } from '../versao';

/** Estudo de dimensionamento de extintores — documento próprio (também em projetos só de extintores). Passos pela ordem do RT-SCIE, art. 163.º. */
export default function EstudoExtintores() {
  const { p } = useP();
  const { zoom, aGerar, imprimir } = useDocumento(p, 'Estudo de dimensionamento de extintores', 'ext-folhas');
  const uts = p.edificios.flatMap((ed) => ed.uts.map((ut) => ({ ed, ut, cat: classificar(ut).cat })));
  const dataPt = p.data ? new Date(p.data + 'T00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const res = uts.map((x) => ({ ...x, r: dimensionarExtintores(x.ut, x.cat) }));
  const falta = res.flatMap((x) => x.r.falta.map((f) => `${tituloUT(x.ut)}: ${f}`));
  // total geral por tipo
  const tot = new Map<string, number>();
  for (const x of res) for (const t of x.r.totais) tot.set(t.descricao, (tot.get(t.descricao) ?? 0) + t.qtd);
  let n = 0; const S = () => String(++n);

  return (
    <div id="ext-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-auto">
            <p className="label">Documento</p>
            <p className="font-display text-[17px] font-bold">Estudo de dimensionamento de extintores</p>
            <p className={`text-[12px] ${falta.length ? 'text-alerta' : 'text-ok'}`}>{falta.length ? `Falta preencher: ${falta.length} ${falta.length === 1 ? 'dado' : 'dados'} (ver no fim)` : 'Dados completos'}</p>
          </div>
          <button className="btn-fire h-11 px-5" disabled={!!aGerar} onClick={() => imprimir()}>
            {aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}
          </button>
        </div>
      </div>

      <Sheet>
        <p className="label !text-fire-ink">RT-SCIE · art. 163.º · meios portáteis e móveis de extinção</p>
        <h1 className="h-display mb-1 mt-2 text-[34px]">Estudo de dimensionamento de extintores</h1>
        <p className="font-display text-[18px] font-bold text-ink-2">{p.nome}</p>
        <p className="mb-6 text-[12px] text-ink-3">{[p.morada, p.concelho].filter(Boolean).join(', ')}{p.cliente ? ` · ${p.cliente}` : ''}{dataPt ? ` · ${dataPt}` : ''}</p>

        <H1 n={S()}>Aplicabilidade</H1>
        <P>Todas as utilizações-tipo são equipadas com extintores, exceto a UT I das 1.ª e 2.ª categorias de risco; nos recintos ao ar livre só os locais de risco C (RT-SCIE, art. 163.º n.os 1 e 8).</P>
        <table className="tbl mb-4"><tbody>
          {res.map(({ ed, ut, r }) => <tr key={ut.id}><td className="w-[40%] text-[11.5px] font-semibold">{ed.nome} · {tituloUT(ut)}</td><td className="text-[11.5px]">{r.motivo}</td></tr>)}
        </tbody></table>

        <H1 n={S()}>Áreas dos pisos</H1>
        <table className="tbl mb-4"><thead><tr><th>Utilização-tipo</th><th>Pisos e áreas (m²)</th></tr></thead><tbody>
          {res.filter((x) => x.r.geral).map(({ ed, ut }) => <tr key={ut.id}><td className="text-[11.5px]">{ed.nome} · {tituloUT(ut)}</td><td className="text-[11.5px]">{pisosUT(ut).map((q) => `${q.nome}: ${q.area > 0 ? fmt(q.area, 2) : '—'}`).join(' · ') || '—'}</td></tr>)}
        </tbody></table>

        <H1 n={S()}>Critérios de dimensionamento</H1>
        <P>Por piso, aplicam-se os dois critérios do art. 163.º n.º 2 e prevalece o mais exigente:</P>
        <ul className="mb-3 ml-5 list-disc text-[12px] leading-[1.6] text-ink-2">
          <li><b>a)</b> 18 L de agente extintor padrão por 500 m² ou fração de área do piso; o agente extintor padrão é a água (anexo I, art. 8.º n.º 2);</li>
          <li><b>b)</b> um extintor por 200 m² ou fração, com o mínimo de dois por piso.</li>
        </ul>
        <P>Quando se usa pó químico, a equivalência ao agente padrão segue o critério técnico justificado admitido pelo n.º 2: kg de pó = litros de água ÷ 2. Os extintores de CO₂ são complemento (quadros elétricos, locais técnicos) e não contam para a alínea a), por não terem eficácia em fogos da classe A.</P>

        <H1 n={S()}>Dimensionamento por utilização-tipo</H1>
        <P>Inclui os extintores dos locais e situações específicas: locais de risco C e F (n.º 4), cozinhas e laboratórios (n.º 5), centrais térmicas (n.º 6), tendas e insufláveis (n.º 7) e as condições específicas da UT (arts. 209.º a 211.º, 226.º, 273.º, 286.º e 307.º).</P>
        {res.map(({ ed, ut, cat }, i) => (
          <div key={ut.id} className="avoid-break">
            <H2 n={`${n}.${i + 1}`}>{ed.nome} · {tituloUT(ut)}</H2>
            <QuadroExtintores ut={ut} cat={cat} />
          </div>
        ))}

        <H1 n={S()}>Localização e instalação</H1>
        <ul className="mb-3 ml-5 list-disc text-[12px] leading-[1.6] text-ink-2">
          <li>Distância a percorrer de qualquer saída de um local de risco até ao extintor mais próximo ≤ 15 m (art. 163.º n.º 1).</li>
          <li>Convenientemente distribuídos e sinalizados, em suporte ou nicho próprio, em locais desimpedidos e de fácil acesso, com o manípulo a ≤ 1,2 m do pavimento (n.º 3).</li>
          <li>De preferência nas comunicações horizontais ou no interior das câmaras corta-fogo, e no interior dos grandes espaços junto às saídas (n.º 3 a) e b)).</li>
          <li>Extintores conformes com as normas EN 3, EN 1866 e NP 4413 (anexo I, art. 8.º n.º 9).</li>
        </ul>

        <H1 n={S()}>Quadro-resumo</H1>
        {tot.size ? (
          <table className="tbl mb-2"><thead><tr><th>Extintor</th><th className="w-24 text-right">Quantidade</th></tr></thead>
            <tbody>{[...tot.entries()].map(([d, q]) => <tr key={d}><td>{d}</td><td className="num text-right font-semibold">{q}</td></tr>)}</tbody></table>
        ) : <P>Sem extintores portáteis calculados por piso.</P>}
        {res.some((x) => x.r.extras.length) && <p className="text-[11.5px] text-ink-2">Acrescem os meios indicados nas situações específicas de cada UT (secção 4).</p>}

        {falta.length > 0 && (
          <div className="no-print mt-6 border-l-[3px] border-alerta bg-alerta-soft px-4 py-3 text-[12px]">
            <p className="mb-1 font-semibold text-alerta">Falta preencher:</p>
            <ul className="ml-4 list-disc">{falta.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
        )}

        <div className="avoid-break mt-12 grid grid-cols-2 gap-10 text-[11.5px]">
          <div><div className="mb-1 h-14 border-b border-ink" /><p className="font-semibold">{p.autor.nome || 'Autor'}</p><p className="text-ink-3">{p.autor.qualificacao}</p></div>
        </div>
        <p className="mt-6 border-t border-paper-3 pt-2 text-[10.5px] leading-relaxed text-ink-3">{baseLegalDoc(dataPt)} {notaVersao()}</p>
      </Sheet>
    </div>
  );
}
