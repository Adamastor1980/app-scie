import { baseLegalDoc, notaVersao } from '../versao';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Eye, Loader2, PenLine, Printer } from 'lucide-react';
import { useP } from './ProjetoShell';
import { H1, H2, P, Sheet, useDocumento } from './doc';
import { novaAutoprotecao } from '../store';
import { MAP_INFO, type MAP } from '../data/rtscie';
import { ROMANO } from '../data/rjscie';
import { exigencias, TIPOS_REGISTO } from '../engine/autoprotecao';
import { contexto, gerarMedidas } from '../engine/medidas';
import { desconformidades } from '../engine/verificacao';
import { tituloUT } from '../nome';
import type { TipoRegisto } from '../data/types';

/**
 * Documento das medidas de autoproteção (MAP).
 * Estrutura e exigências: RT-SCIE, título VII (arts. 193.º a 207.º), texto republicado pela Portaria n.º 135/2020.
 * Os dados do projeto entram automaticamente; o conteúdo específico do edifício é escrito pelo autor em cada secção.
 */

const ALINEAS_202: [string, string][] = [
  ['a', 'Acessibilidade dos meios de socorro aos espaços da utilização-tipo'],
  ['b', 'Acessibilidade dos veículos de socorro dos bombeiros aos meios de abastecimento de água, designadamente hidrantes exteriores'],
  ['c', 'Praticabilidade dos caminhos de evacuação'],
  ['d', 'Eficácia da resistência ao fogo dos elementos de construção e de outros meios de compartimentação, isolamento e proteção'],
  ['e', 'Acessibilidade aos meios de alarme e de intervenção em caso de emergência'],
  ['f', 'Vigilância dos espaços, em especial os de maior risco de incêndio e os que estão normalmente desocupados'],
  ['g', 'Conservação dos espaços em condições de limpeza e arrumação adequadas'],
  ['h', 'Segurança na produção, na manipulação e no armazenamento de matérias e substâncias perigosas'],
  ['i', 'Segurança em todos os trabalhos de manutenção, recuperação, beneficiação, alteração ou remodelação de sistemas ou das instalações, que impliquem um risco agravado de incêndio, introduzam limitações em sistemas de segurança instalados ou que possam afetar a evacuação dos ocupantes'],
];

const ALINEAS_204: [string, string][] = [
  ['a', 'Procedimentos de alarme, a cumprir em caso de deteção ou perceção de um incêndio'],
  ['b', 'Procedimentos de alerta'],
  ['c', 'Procedimentos a adotar para garantir a evacuação rápida e segura dos espaços em risco'],
  ['d', 'Técnicas de utilização dos meios de primeira intervenção e de outros meios de atuação em caso de incêndio que sirvam os espaços da utilização-tipo'],
  ['e', 'Procedimentos de receção e encaminhamento dos bombeiros'],
];

const ALINEAS_205_4: [string, string][] = [
  ['a', 'Conhecimento prévio dos riscos presentes nos espaços afetos à utilização-tipo, nomeadamente nos locais de risco C, D e F'],
  ['b', 'Procedimentos a adotar em caso de deteção ou perceção de um alarme de incêndio'],
  ['c', 'Planificação da difusão dos alarmes restritos e geral e a transmissão do alerta'],
  ['d', 'Coordenação das operações previstas no plano de evacuação'],
  ['e', 'Ativação dos meios de primeira intervenção que sirvam os espaços da utilização-tipo, apropriados a cada circunstância, incluindo as técnicas de utilização desses meios'],
  ['f', 'Execução da manobra dos dispositivos de segurança, designadamente de corte da alimentação de energia elétrica e de combustíveis, de fecho de portas resistentes ao fogo e das instalações de controlo de fumo'],
  ['g', 'Prestação de primeiros socorros'],
  ['h', 'Proteção de locais de risco e de pontos nevrálgicos da utilização-tipo'],
  ['i', 'Acolhimento, informação, orientação e apoio dos bombeiros'],
  ['j', 'Reposição das condições de segurança após uma situação de emergência'],
];

const ALINEAS_205_5: [string, string][] = [
  ['a', 'Encaminhamento rápido e seguro dos ocupantes para o exterior ou para uma zona segura, mediante referenciação de vias de evacuação, zonas de refúgio e pontos de encontro'],
  ['b', 'Auxílio a pessoas com capacidades limitadas ou em dificuldade, de forma a assegurar que ninguém fique bloqueado'],
  ['c', 'Confirmação da evacuação total dos espaços e garantia de que ninguém a eles regressa'],
];

export default function MapDocumento() {
  const { p, up } = useP();
  const ap = p.autoprotecao ?? novaAutoprotecao();
  const textos = ap.textos ?? {};
  const [editar, setEditar] = useState(true);
  const { zoom, aGerar, imprimir } = useDocumento(p, 'Medidas de Autoproteção', 'map-folhas');

  const setTexto = (k: string, v: string) => up((x) => { x.autoprotecao ??= novaAutoprotecao(); (x.autoprotecao.textos ??= {})[k] = v; });

  const ex = exigencias(p);
  const com = (m: MAP) => ex.filter((x) => x.medidas?.includes(m));
  const tem = (m: MAP) => com(m).length > 0;
  const utsDe = (m: MAP) => com(m).map((x) => `UT ${ROMANO[x.ut.tipo]}`).join(', ');

  // locais de risco C, D, E, F (instruções de segurança, art. 199.º)
  const locaisInstr = ex.flatMap((x) => x.ut.espacos.filter((e) => ['C', 'Cag', 'D', 'E', 'F'].includes(e.local)).map((e) => ({ x, e })));
  // insuficiências (edifícios existentes): desconformidades da análise regulamentar (art. 193.º n.º 3)
  const insuf = useMemo(() => ex.flatMap((x) => desconformidades(x.ut, gerarMedidas(contexto(x.ed, x.ut))).map((d) => ({ x, d }))), [p]); // eslint-disable-line react-hooks/exhaustive-deps

  // chaves de texto efetivamente presentes no documento (para contar o que falta preencher)
  const chaves: string[] = [];
  const T = (k: string, ph?: string, rows = 3) => {
    chaves.push(k);
    const v = textos[k] ?? '';
    if (editar) {
      return <textarea className="input no-print mb-3 text-[12px] leading-relaxed" rows={rows} value={v} placeholder={ph ?? 'Descreva as regras/procedimentos aplicáveis a este edifício…'} onChange={(e) => setTexto(k, e.target.value)} />;
    }
    return v.trim()
      ? <div className="mb-3 whitespace-pre-wrap text-[12px] leading-[1.6] text-ink">{v}</div>
      : <div className="mb-3 border border-dashed border-alerta/60 px-2 py-1.5 text-[11px] text-alerta">[A preencher pelo autor das medidas de autoproteção]</div>;
  };
  const Alinea = (l: string, t: string, children: ReactNode, key?: string) => (
    <div className="avoid-break" key={key ?? l}>
      <p className="mb-1 text-[12px] font-semibold text-ink"><span className="font-mono text-ink-3">{l})</span> {t}</p>
      {children}
    </div>
  );

  const dataPt = p.data ? new Date(p.data + 'T00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const contagem = (t: TipoRegisto) => ap.registos.filter((r) => r.tipo === t).length;
  let n = 0;
  const S = () => String(++n);

  const corpo = (
    <>
      {/* ------------------------------- CAPA ------------------------------- */}
      <Sheet className="flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">{p.empresa.logo ? <img src={p.empresa.logo} className="h-[80px] w-[80px] object-contain" /> : <span className="font-display text-[20px] font-extrabold">{p.empresa.nome || 'Empresa'}</span>}{p.clienteLogo && <><span className="h-12 w-px bg-ink-4" /><img src={p.clienteLogo} className="h-[80px] w-[80px] object-contain" /></>}</div>
          <span className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-wider text-ink-3">{p.referencia || 'S/ ref.'}<br />Versão {p.versao}<br />{dataPt}</span>
        </div>
        <div className="mt-[52mm]">
          <div className="mb-6 h-[6px] w-24 bg-fire" />
          <p className="label mb-3">RT-SCIE · Título VII · arts. 193.º a 207.º</p>
          <h1 className="h-display text-[44px]">Medidas de autoproteção</h1>
          <p className="mt-4 font-display text-[22px] font-bold leading-tight text-ink-2">{p.nome}</p>
          <p className="mt-2 text-[13px] text-ink-3">{[p.morada, p.concelho, p.distrito].filter(Boolean).join(', ')}</p>
        </div>
        <div className="mt-auto border-t-[3px] border-ink pt-5">
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-[11.5px]">
            <div><p className="label">Responsável de segurança</p><p className="font-semibold">{ap.rs.nome || p.cliente || '—'}</p></div>
            <div><p className="label">Elaborado por</p><p className="font-semibold">{p.autor.nome || '—'}</p><p className="text-ink-3">{[p.autor.qualificacao, p.autor.ordem && `${p.autor.ordem} n.º ${p.autor.numero}`].filter(Boolean).join(' · ')}</p></div>
            <div><p className="label">Data</p><p className="font-semibold">{dataPt || '—'}</p><p className="text-ink-3">Versão {p.versao}</p></div>
          </div>
        </div>
      </Sheet>

      {/* -------------------------- ENQUADRAMENTO --------------------------- */}
      <Sheet className="page-break">
        <H1 n={S()}>Enquadramento</H1>
        <P>As medidas de autoproteção são medidas de organização e gestão da segurança, adaptadas às condições reais de exploração de cada utilização-tipo e proporcionadas à sua categoria de risco (RT-SCIE, art. 193.º n.os 1 e 2), e são auditáveis a qualquer momento, devendo o RS fornecer a documentação e facultar o acesso a todos os espaços à entidade competente (art. 198.º n.º 3).</P>
        <P>{baseLegalDoc(dataPt)} {notaVersao()}</P>
        <H2 n={`${n}.1`}>Medidas exigíveis (quadro XXXIX)</H2>
        <table className="tbl mb-3">
          <thead><tr><th>Utilização-tipo</th><th>Cat.</th><th>Medidas de autoproteção exigíveis</th></tr></thead>
          <tbody>
            {ex.map((x) => (
              <tr key={x.ut.id}>
                <td>{tituloUT(x.ut)}<br /><span className="ref">{x.ed.nome}</span></td>
                <td className="whitespace-nowrap">{x.porAtribuir ? 'por atribuir' : `${x.cat}.ª`}</td>
                <td>{x.medidas ? x.medidas.map((m) => `${MAP_INFO[m].nome} (art. ${MAP_INFO[m].art})`).join('; ') : 'Não exigíveis pelo quadro XXXIX'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <H2 n={`${n}.2`}>Identificação</H2>
        <table className="tbl">
          <tbody>
            <tr><td className="w-[55mm] font-semibold">Utilizações-tipo</td><td>{ex.map((x) => tituloUT(x.ut)).join('; ') || '—'}</td></tr>
            <tr><td className="font-semibold">Data de entrada em funcionamento</td><td>{ap.dataFuncionamento ? new Date(ap.dataFuncionamento + 'T00:00').toLocaleDateString('pt-PT') : '—'}</td></tr>
            <tr><td className="font-semibold">Responsável de segurança (RS)</td><td>{[ap.rs.nome, ap.rs.cargo, ap.rs.telefone, ap.rs.email].filter(Boolean).join(' · ') || '—'}</td></tr>
            <tr><td className="font-semibold">Delegado de segurança</td><td>{[ap.delegado.nome, ap.delegado.cargo, ap.delegado.telefone].filter(Boolean).join(' · ') || '—'}</td></tr>
            <tr><td className="font-semibold">Períodos de funcionamento</td><td>{ap.horario || '—'}</td></tr>
          </tbody>
        </table>
        <p className="ref mt-2">art. 203.º n.º 1 a) RT-SCIE · RS conforme quadro XXXVIII (art. 194.º)</p>

        {/* ---------------------- ORGANIZAÇÃO DA SEGURANÇA ---------------------- */}
        <H1 n={S()}>Organização da segurança</H1>
        <P>O RS estabelece a organização necessária à concretização das medidas de autoproteção e designa um delegado de segurança para as executar (arts. 194.º n.º 2 e 200.º n.º 1). Os elementos das equipas de segurança são responsabilizados pelo RS pelo cumprimento das atribuições que lhes forem cometidas (art. 200.º n.º 2).</P>
        <H2 n={`${n}.1`}>Equipa de segurança</H2>
        {ap.equipa.length ? (
          <table className="tbl mb-3">
            <thead><tr><th>Nome</th><th>Função</th><th>Turno</th><th>Contacto</th></tr></thead>
            <tbody>{ap.equipa.map((e) => <tr key={e.id}><td>{e.nome}</td><td>{e.funcao}</td><td>{e.turno}</td><td>{e.telefone}</td></tr>)}</tbody>
          </table>
        ) : <div className="mb-3 border border-dashed border-alerta/60 px-2 py-1.5 text-[11px] text-alerta">[Equipa de segurança por definir — separador «Organização»]</div>}
        <H2 n={`${n}.2`}>Dimensionamento da equipa</H2>
        <P>O dimensionamento das equipas de segurança é estabelecido de acordo com as características de exploração e deve ser fundamentado e aceite pela ANEPC (art. 200.º n.os 3 e 4).</P>
        {ap.fundamentacaoEquipa.trim()
          ? <div className="mb-3 whitespace-pre-wrap text-[12px] leading-[1.6]">{ap.fundamentacaoEquipa}</div>
          : <div className="mb-3 border border-dashed border-alerta/60 px-2 py-1.5 text-[11px] text-alerta">[Fundamentação por preencher — separador «Organização»]</div>}
        <H2 n={`${n}.3`}>Posto de segurança</H2>
        <P>{ap.postoSeguranca ? `Localização: ${ap.postoSeguranca}. ` : ''}Durante os períodos de funcionamento, o posto de segurança deve ser mantido ocupado em permanência, no mínimo, por um elemento da equipa de segurança (art. 200.º n.º 5).{tem('pei') ? ' Deve estar disponível no posto de segurança um exemplar do plano de emergência interno (art. 205.º n.º 9).' : ''}{tem('planoPrevencao') ? ' Deve estar disponível no posto de segurança um exemplar do plano de prevenção (art. 203.º n.º 3).' : ''}</P>
        {tem('pei') && (
          <>
            <H2 n={`${n}.4`}>Serviço de Segurança contra Incêndio (SSI)</H2>
            <P>Sendo exigível plano de emergência interno ({utsDe('pei')}), é implementado um SSI constituído por um delegado de segurança com as funções de chefe de equipa e pelo número de elementos adequado à dimensão da utilização-tipo e categoria de risco (art. 200.º n.º 6), constituído por pessoas de reconhecida competência em matéria de SCIE (art. 200.º n.º 8).</P>
          </>
        )}
        <H2 n={`${n}.${tem('pei') ? 5 : 4}`}>Contactos de emergência</H2>
        <table className="tbl"><tbody>{ap.contactos.map((c) => <tr key={c.id}><td className="w-[100mm]">{c.entidade}</td><td className="num font-semibold">{c.telefone || '—'}</td></tr>)}</tbody></table>
      </Sheet>

      {/* ---------------------- PREVENÇÃO (art. 202.º / 203.º) ---------------------- */}
      {(tem('procPrevencao') || tem('planoPrevencao')) && (
        <Sheet className="page-break">
          <H1 n={S()}>{tem('planoPrevencao') ? 'Plano de prevenção' : 'Procedimentos de prevenção'}</H1>
          <P>Aplicável a: {[...new Set([...com('procPrevencao'), ...com('planoPrevencao')].map((x) => `UT ${ROMANO[x.ut.tipo]}`))].join(', ')}. Para as utilizações-tipo devem ser definidas e cumpridas regras de exploração e de comportamento, que constituem o conjunto de procedimentos de prevenção a adotar pelos ocupantes (art. 202.º n.º 1).</P>
          {tem('planoPrevencao') && (
            <>
              <H2 n={`${n}.1`}>Constituição do plano de prevenção (art. 203.º n.º 1)</H2>
              <P>a) Informações de identificação — ver secção 2.2. b) Plantas à escala 1:100 ou 1:200, com simbologia das normas portuguesas, representando a classificação de risco e efetivo de cada local, as vias horizontais e verticais de evacuação e a localização dos dispositivos e equipamentos de SCIE: {p.plantas.filter((x) => x.tipo === 'piso').length ? `${p.plantas.filter((x) => x.tipo === 'piso').length} planta(s) de piso em anexo.` : 'plantas por anexar (separador «Peças desenhadas»).'} c) Procedimentos de prevenção — secções seguintes. O plano é atualizado sempre que as modificações ou alterações o justifiquem e está sujeito a verificação nas inspeções regulares e extraordinárias (art. 203.º n.º 2).</P>
            </>
          )}
          <H2 n={`${n}.${tem('planoPrevencao') ? 2 : 1}`}>Procedimentos de exploração e utilização dos espaços (art. 202.º n.º 2)</H2>
          <P>Os procedimentos de exploração e utilização dos espaços devem garantir permanentemente:</P>
          {ALINEAS_202.map(([l, t]) => Alinea(l, t, T(`202.2.${l}`)))}
          <H2 n={`${n}.${tem('planoPrevencao') ? 3 : 2}`}>Exploração das instalações técnicas, equipamentos e sistemas (art. 202.º n.º 3)</H2>
          <P>Instruções de funcionamento, procedimentos de segurança, descrição dos comandos e de eventuais alarmes, e sintomas e indicadores de avaria.</P>
          {T("202.3", undefined, 4)}
          <H2 n={`${n}.${tem('planoPrevencao') ? 4 : 3}`}>Programa de conservação e manutenção (art. 202.º n.os 4 e 5)</H2>
          <P>Baseado em programas com estipulação de calendários e listas de testes de verificação periódica das instalações técnicas, dispositivos, equipamentos e sistemas (títulos V e VI do RT-SCIE). Excetuam-se os hidrantes exteriores que não estejam sob a responsabilidade da entidade exploradora.</P>
          {T("202.4", "Ex.: extintores — verificação mensal pelo delegado, manutenção anual por empresa certificada; SADI — teste trimestral…", 5)}
          <H2 n={`${n}.${tem('planoPrevencao') ? 5 : 4}`}>Execução de trabalhos (art. 197.º)</H2>
          <P>Trabalhos que possam prejudicar a evacuação são realizados fora dos períodos de funcionamento ou com meios de evacuação alternativos; trabalhos com risco de incêndio ou explosão (chama nua, faíscas, elementos incandescentes) carecem de autorização expressa do RS, com registo dos locais, natureza das operações e meios, data de início e duração, meios de segurança compensatórios e ajustamentos dos procedimentos de prevenção (art. 197.º n.os 1 a 4).</P>
          {T("197", "Procedimento de autorização de trabalhos a quente neste edifício…")}
        </Sheet>
      )}

      {/* ---------------------- EMERGÊNCIA (art. 204.º / 205.º) ---------------------- */}
      {tem('procEmergencia') && (
        <Sheet className="page-break">
          <H1 n={S()}>Procedimentos em caso de emergência</H1>
          <P>Aplicável a: {utsDe('procEmergencia')}. Procedimentos e técnicas de atuação a adotar pelos ocupantes, contemplando no mínimo (art. 204.º n.º 1):</P>
          {ALINEAS_204.map(([l, t]) => Alinea(l, t, T(`204.1.${l}`)))}
          <P>Os ocupantes que não pertençam ao público devem ser capazes de cumprir, por si só, os procedimentos das alíneas a), c) e d) — esta apenas relativamente aos extintores portáteis —, exceto quando, pela idade ou condições físicas, tal não seja possível (art. 204.º n.º 2).</P>
        </Sheet>
      )}
      {tem('pei') && (
        <Sheet className="page-break">
          <H1 n={S()}>Plano de emergência interno</H1>
          <P>Aplicável a: {utsDe('pei')}. Objetivos: sistematizar a evacuação enquadrada dos ocupantes que se encontrem em risco e limitar a propagação e as consequências dos incêndios, recorrendo a meios próprios (art. 205.º n.º 1).</P>
          <H2 n={`${n}.1`}>Organização em situação de emergência (art. 205.º n.º 3)</H2>
          <P>Organogramas hierárquicos e funcionais do SSI para as várias fases da emergência, e identificação dos delegados e agentes de segurança das equipas de intervenção, com as respetivas missões e responsabilidades.</P>
          {T("205.3", undefined, 5)}
          <H2 n={`${n}.2`}>Entidades a contactar (art. 205.º n.º 2 b))</H2>
          <table className="tbl mb-3"><tbody>{ap.contactos.map((c) => <tr key={c.id}><td className="w-[100mm]">{c.entidade}</td><td className="num font-semibold">{c.telefone || '—'}</td></tr>)}</tbody></table>
          <H2 n={`${n}.3`}>Plano de atuação (art. 205.º n.º 4)</H2>
          {ALINEAS_205_4.map(([l, t]) => Alinea(l, t, T(`205.4.${l}`)))}
          <H2 n={`${n}.4`}>Plano de evacuação (art. 205.º n.º 5)</H2>
          {ALINEAS_205_5.map(([l, t]) => Alinea(l, t, T(`205.5.${l}`)))}
          <H2 n={`${n}.5`}>Plantas de emergência (art. 205.º n.os 6 e 7)</H2>
          <P>Elaboradas para cada piso, em conformidade com a NP 4386, afixadas em posições estratégicas junto aos acessos principais do piso, nos locais de risco D e E e nas zonas de refúgio; disponibilizadas ao corpo de bombeiros quando solicitado. O PEI é atualizado sempre que as modificações o justifiquem e está sujeito a verificação nas inspeções (art. 205.º n.º 8).</P>
        </Sheet>
      )}

      {/* ---------------------- INSTRUÇÕES DE SEGURANÇA (art. 199.º) ---------------------- */}
      <Sheet className="page-break">
        <H1 n={S()}>Instruções de segurança</H1>
        <P>Independentemente da categoria de risco, são elaboradas e afixadas instruções de segurança destinadas aos ocupantes dos locais de risco C, D, E e F, em locais visíveis, designadamente na face interior das portas de acesso; nos locais D e E, acompanhadas de planta de emergência simplificada (art. 199.º n.os 1 e 2).</P>
        {locaisInstr.length ? (
          <table className="tbl mb-3">
            <thead><tr><th>Local</th><th>Risco</th><th>UT</th></tr></thead>
            <tbody>{locaisInstr.map(({ x, e }) => <tr key={e.id}><td>{e.nome || '—'}</td><td>{e.local === 'Cag' ? 'C agravado' : e.local}</td><td>UT {ROMANO[x.ut.tipo]}</td></tr>)}</tbody>
          </table>
        ) : <P>Não foram identificados locais de risco C, D, E ou F nas utilizações-tipo do projeto.</P>}
        {ex.some((x) => x.medidas && !x.medidas.includes('procEmergencia') && !x.medidas.includes('pei')) && (
          <P>Nas utilizações-tipo em que não são exigíveis procedimentos nem plano de emergência interno, são afixadas instruções de segurança simplificadas: procedimentos de alarme, de alerta e técnicas de utilização dos meios de primeira intervenção (art. 199.º n.º 3).</P>
        )}
        {T("199", "Conteúdo das instruções de segurança por local (procedimentos de prevenção e de emergência aplicáveis)…", 4)}

        {/* ---------------------- FORMAÇÃO (art. 206.º) ---------------------- */}
        {tem('formacao') && (
          <>
            <H1 n={S()}>Formação em segurança contra incêndio</H1>
            <P>Aplicável a: {utsDe('formacao')}. Devem possuir formação em SCIE: os funcionários e colaboradores das entidades exploradoras; as pessoas que exerçam atividade profissional por mais de 30 dias por ano nos espaços; os elementos com atribuições nas atividades de autoproteção{ex.some((x) => x.ut.tipo === 1 && x.cat >= 3) ? '; os ocupantes dos fogos da UT I das 3.ª ou 4.ª categorias' : ''}{ex.some((x) => x.ut.tipo === 4) ? '; os alunos e formandos da UT IV que nela permaneçam mais de 30 dias' : ''}{ex.some((x) => x.ut.tipo === 9) ? '; os frequentadores da UT IX que nela permaneçam mais de 30 dias' : ''} (art. 206.º n.º 1).</P>
            <P>Programa estabelecido pelo RS (art. 206.º n.º 2): a) sensibilização para todos os destinatários, frequentada no prazo máximo de 60 dias após a entrada ao serviço (n.º 3); b) formação específica para quem lida com situações de maior risco, nomeadamente nos locais de risco C, D ou F; c) formação específica para os elementos com atribuições especiais em emergência (alerta, evacuação, comandos dos meios de atuação, receção dos bombeiros, direção das operações).</P>
            {T("206", "Programa de formação: ações, destinatários, conteúdos, periodicidade, formador…", 4)}
          </>
        )}

        {/* ---------------------- SIMULACROS (art. 207.º) ---------------------- */}
        {tem('simulacros') && (
          <>
            <H1 n={S()}>Simulacros</H1>
            <P>Nas utilizações-tipo com plano de emergência interno são realizados exercícios para teste do plano e treino dos ocupantes (art. 207.º n.º 1), devidamente planeados, executados e avaliados, acompanhados por observadores e com informação prévia aos ocupantes (art. 207.º n.º 2 c) a e)).</P>
            <table className="tbl mb-3">
              <thead><tr><th>Utilização-tipo</th><th>Período máximo (quadro XLI)</th></tr></thead>
              <tbody>{com('simulacros').map((x) => <tr key={x.ut.id}><td>{tituloUT(x.ut)}</td><td>{x.simulacroAnos === 1 ? 'Um ano' : 'Dois anos'}{x.ut.tipo === 4 ? ' — no início do ano escolar (art. 207.º n.º 2 b))' : ''}</td></tr>)}</tbody>
            </table>
            {T("207", "Planeamento dos exercícios: cenários, calendário, entidades envolvidas, observadores…", 3)}
          </>
        )}
      </Sheet>

      {/* ---------------------- REGISTOS (art. 201.º) + COMPENSATÓRIAS ---------------------- */}
      <Sheet className="page-break">
        <H1 n={S()}>Registos de segurança</H1>
        <P>O RS garante a existência de registos de segurança, arquivados pelo período mínimo de 10 anos, em papel ou suporte digital (art. 201.º n.os 1 e 2). Registos existentes à data deste documento:</P>
        <table className="tbl mb-3">
          <thead><tr><th>Registo</th><th>Base</th><th className="text-right">N.º</th></tr></thead>
          <tbody>{(Object.keys(TIPOS_REGISTO) as TipoRegisto[]).map((t) => <tr key={t}><td>{TIPOS_REGISTO[t].nome}</td><td className="ref">{TIPOS_REGISTO[t].base}</td><td className="num text-right">{contagem(t)}</td></tr>)}</tbody>
        </table>

        {insuf.length > 0 && (
          <>
            <H1 n={S()}>Insuficiências e medidas compensatórias</H1>
            <P>Edifício existente: insuficiências de segurança identificadas na análise regulamentar, para as quais o autor propõe medidas de autoproteção compensatórias, sujeitas a análise da entidade competente, que pode exigir medidas adicionais (art. 193.º n.os 3 e 4).</P>
            {insuf.map(({ x, d }) => (
              <Fragment key={x.ut.id + d.medida.key}>
                {Alinea(d.letra, `UT ${ROMANO[x.ut.tipo]} — ${d.medida.titulo} (${d.medida.base})`, <>
                  {d.ver.obs && <p className="mb-1 text-[11.5px] text-ink-3">Constatação: {d.ver.obs}</p>}
                  {T(`193.${x.ut.id}.${d.medida.key}`, 'Medida de autoproteção compensatória proposta…', 2)}
                </>)}
              </Fragment>
            ))}
          </>
        )}

        <div className="avoid-break mt-12 grid grid-cols-2 gap-10 text-[11.5px]">
          <div><div className="mb-1 h-14 border-b border-ink" /><p className="font-semibold">{p.autor.nome || 'Autor das medidas de autoproteção'}</p><p className="text-ink-3">{p.autor.qualificacao}</p></div>
          <div><div className="mb-1 h-14 border-b border-ink" /><p className="font-semibold">{ap.rs.nome || 'Responsável de segurança'}</p><p className="text-ink-3">Responsável de segurança</p></div>
        </div>
      </Sheet>
    </>
  );

  const porPreencher = chaves.filter((k) => !(textos[k] ?? '').trim()).length;

  return (
    <div id="map-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-auto">
            <p className="label">Documento</p>
            <p className="font-display text-[17px] font-bold">Medidas de autoproteção</p>
            <p className={`text-[12px] ${porPreencher ? 'text-alerta' : 'text-ok'}`}>{porPreencher ? `${porPreencher} secção(ões) por preencher` : 'Todas as secções preenchidas'}</p>
          </div>
          <div className="flex border border-ink">
            <button className={`flex h-10 items-center gap-1.5 px-3 text-[13px] font-semibold ${editar ? 'bg-ink text-white' : 'bg-white'}`} onClick={() => setEditar(true)}><PenLine size={15} /> Editar</button>
            <button className={`flex h-10 items-center gap-1.5 px-3 text-[13px] font-semibold ${!editar ? 'bg-ink text-white' : 'bg-white'}`} onClick={() => setEditar(false)}><Eye size={15} /> Pré-visualizar</button>
          </div>
          <button className="btn-fire h-11 px-5" disabled={!!aGerar} onClick={() => imprimir(async () => { setEditar(false); await new Promise((r) => setTimeout(r, 120)); })}>
            {aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}
          </button>
        </div>
      </div>
      {corpo}
    </div>
  );
}
