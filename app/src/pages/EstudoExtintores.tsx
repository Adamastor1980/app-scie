import { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { useP } from './ProjetoShell';
import { Sheet, H1, H2, P, useDocumento } from './doc';
import { QuadroRIA, temRIA } from './RiaDoc';
import { MapaExtintores, QuadroExtintores, TotaisExtintores } from './ExtintoresQuadro';
import { ABREVIATURAS, Abreviaturas, BotaoAssinatura, Capa, EmpresaBloco, FichaTecnica, Indice, RevisoesDistribuicao, TabelaLegislacao, TermoAutor, dataPtDe } from './docComum';
import { classificar, fmt, pisosUT } from '../engine/calc';
import { dimensionarExtintores, totaisMapa } from '../engine/extintores';
import { tituloUT } from '../nome';
import { baseLegalDoc, notaVersao } from '../versao';

/** Estudo de dimensionamento de extintores — documento próprio (também em projetos só de extintores). Passos pela ordem do RT-SCIE, art. 163.º. */
export default function EstudoExtintores() {
  const { p } = useP();
  const { zoom, aGerar, imprimir } = useDocumento(p, 'Estudo de dimensionamento de extintores', 'ext-folhas');
  const uts = p.edificios.flatMap((ed) => ed.uts.map((ut) => ({ ed, ut, cat: classificar(ut).cat })));
  const dataPt = dataPtDe(p);
  const [comAss, setComAss] = useState(true);
  const res = uts.map((x) => ({ ...x, r: dimensionarExtintores(x.ut, x.cat) }));
  const falta = res.flatMap((x) => x.r.falta.map((f) => `${tituloUT(x.ut)}: ${f}`));
  const linhas = res.flatMap(({ r }) => r.mapa);
  const tot = totaisMapa(linhas);
  const port = tot.find((g) => g.cat === 'portatil');
  const DOC = 'Estudo de dimensionamento de extintores';
  const comRIA = temRIA(uts, p.modo);
  const CAPS = ['Apresentação da empresa', 'Introdução e enquadramento legal', 'Caracterização e aplicabilidade', 'Critérios de dimensionamento', 'Dimensionamento por utilização-tipo', 'Localização e instalação', 'Mapa de extintores — o quê, onde e quantos', 'Totais de extintores e outros meios', ...(comRIA ? ['Rede de incêndio armada (carretéis)'] : []), 'Conclusões', 'Termo do autor', 'Anexos'];
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
          <BotaoAssinatura p={p} com={comAss} set={setComAss} />
          <button className="btn-fire h-11 px-5" disabled={!!aGerar} onClick={() => imprimir()}>
            {aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}
          </button>
        </div>
      </div>

      <Capa p={p} rotulo="Meios portáteis e móveis de extinção · RT-SCIE, art. 163.º" titulo={DOC} />

      <Sheet className="page-break">
        <H1 n="—">Ficha técnica</H1>
        <FichaTecnica p={p} documento={DOC} />
        <H1 n="—">Índice</H1>
        <Indice itens={CAPS} />
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Apresentação da empresa</H1>
        <EmpresaBloco p={p} />

        <H1 n={S()}>Introdução e enquadramento legal</H1>
        <H2 n={`${n}.1`}>Objetivo</H2>
        <P>{p.objetivo || `O presente estudo dimensiona os extintores e os outros meios de primeira intervenção de ${p.nome}, por piso e por local, nos termos do art. 163.º do RT-SCIE e das condições específicas de cada utilização-tipo, e indica o quê, onde e quantos.`}</P>
        <H2 n={`${n}.2`}>Localização</H2>
        <P>{[p.morada, p.concelho, p.distrito].filter(Boolean).join(', ') || '—'}{p.coordenadas ? ` (coordenadas ${p.coordenadas})` : ''}.</P>
        <H2 n={`${n}.3`}>Legislação aplicada</H2>
        <TabelaLegislacao />
        <P>{baseLegalDoc(dataPt)} {notaVersao()}</P>

        <H1 n={S()}>Caracterização e aplicabilidade</H1>
        <H2 n={`${n}.1`}>Aplicabilidade</H2>
        <P>Todas as utilizações-tipo são equipadas com extintores, exceto a UT I das 1.ª e 2.ª categorias de risco; nos recintos ao ar livre só os locais de risco C (RT-SCIE, art. 163.º n.os 1 e 8).</P>
        <table className="tbl mb-4"><tbody>
          {res.map(({ ed, ut, r }) => <tr key={ut.id}><td className="w-[40%] text-[11.5px] font-semibold">{ed.nome} · {tituloUT(ut)}</td><td className="text-[11.5px]">{r.motivo}</td></tr>)}
        </tbody></table>

        <H2 n={`${n}.2`}>Áreas dos pisos</H2>
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
        <P>Cálculo por piso. Os extintores dos locais e situações específicas — locais de risco C e F (n.º 4), cozinhas e laboratórios (n.º 5), centrais térmicas (n.º 6), tendas e insufláveis (n.º 7) e condições específicas da UT (arts. 209.º a 211.º, 226.º, 273.º, 286.º e 307.º) — estão no mapa final.</P>
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

        <H1 n={S()}>Mapa de extintores — o quê, onde e quantos</H1>
        <MapaExtintores linhas={res.flatMap(({ ed, ut, r }) => r.mapa.map((l) => ({ ut: `${ed.nome} · ${tituloUT(ut)}`, l })))} />
        <H1 n={S()}>Totais de extintores e outros meios</H1>
        <TotaisExtintores linhas={linhas} />

        {comRIA && (<>
          <H1 n={S()}>Rede de incêndio armada (carretéis)</H1>
          <P>Quando exigida, a rede de incêndio armada com bocas do tipo carretel completa os meios de primeira intervenção (RT-SCIE, arts. 164.º a 167.º).</P>
          <QuadroRIA uts={uts} modo={p.modo} />
        </>)}

        {falta.length > 0 && (
          <div className="no-print mt-6 border-l-[3px] border-alerta bg-alerta-soft px-4 py-3 text-[12px]">
            <p className="mb-1 font-semibold text-alerta">Falta preencher:</p>
            <ul className="ml-4 list-disc">{falta.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
        )}

        <H1 n={S()}>Conclusões</H1>
        <P>{port ? <>Ficam previstos <b>{port.total}{port.aberto ? ' ou mais' : ''} extintores portáteis</b>{tot.filter((g) => g.cat !== 'portatil' && g.cat !== 'complemento').map((g) => `, ${g.itens.map((i) => `${i.qtdTxt} × ${i.desc.split(' — ')[0].toLowerCase()}`).join(', ')}`).join('')}, distribuídos conforme o mapa do capítulo 7 e com a exigência legal de cada um no capítulo 8.</> : 'Não resultam extintores do dimensionamento.'}{falta.length ? ' Há dados por preencher: o estudo só fica concluído depois de completos.' : ''}</P>
        {p.conclusoes && <div className="mt-2 whitespace-pre-line text-[12px] leading-[1.65]">{p.conclusoes}</div>}
        <TermoAutor p={p} com={comAss} documento="o presente estudo" titulo={<H1 n={S()}>Termo do autor</H1>} />
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Anexos</H1>
        <RevisoesDistribuicao p={p} />
        <H2 n="C">Lista de abreviaturas</H2>
        <Abreviaturas lista={ABREVIATURAS.filter(([a]) => ['ANEPC', 'RJ-SCIE', 'RT-SCIE', 'SCIE', 'UT', 'PR'].includes(a))} />
      </Sheet>
    </div>
  );
}
