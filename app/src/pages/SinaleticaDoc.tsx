import { Fragment, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { useP } from './ProjetoShell';
import { Sheet, H1, H2, P, useDocumento } from './doc';
import { ABREVIATURAS, Abreviaturas, BotaoAssinatura, Capa, EmpresaBloco, FichaTecnica, Indice, RevisoesDistribuicao, TabelaLegislacao, TermoAutor, dataPtDe } from './docComum';
import { areaPlaca, exigida, faltaPiso, placasPiso, totaisSinal } from '../engine/sinaletica';
import { rotuloPisoInv } from '../engine/manutencao';
import { APLIC } from './Sinaletica';
import { baseLegalDoc, notaVersao } from '../versao';

/** Estudo de sinalética — RT-SCIE, arts. 108.º a 112.º */
export default function SinaleticaDoc() {
  const { p } = useP();
  const DOC = 'Estudo de sinalética de segurança';
  const { zoom, aGerar, imprimir } = useDocumento(p, DOC, 'sin-folhas');
  const [comAss, setComAss] = useState(true);
  const pl = p.sinaletica ?? { aplic: 'exigida' as const, pisos: [] };
  const ex = exigida(pl);
  const tot = totaisSinal(pl);
  const pisosOrd = (eid: string) => pl.pisos.filter((s) => s.edificio === eid).sort((a, b) => (a.piso ?? 999) - (b.piso ?? 999));
  const falta = pl.pisos.flatMap((s) => faltaPiso(s).map((f) => `${p.edificios.find((e) => e.id === s.edificio)?.nome ?? ''} · ${rotuloPisoInv(s.piso)}: ${f[0].toLowerCase()}`));
  const maxD = Math.max(0, ...pl.pisos.map((s) => s.dist ?? 0));
  const CAPS = ['Apresentação da empresa', 'Introdução e enquadramento legal', 'Aplicabilidade', ...(ex ? ['Critérios', 'Placas por edifício e piso', 'Totais', 'Regras de instalação'] : []), 'Conclusões', 'Termo do autor', 'Anexos'];
  let n = 0; const S = () => String(++n);

  return (
    <div id="sin-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
      <div className="no-print sticky top-14 z-30 mb-8 border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-auto">
            <p className="label">Documento</p>
            <p className="font-display text-[17px] font-bold">{DOC}</p>
            <p className={`text-[12px] ${falta.length ? 'text-alerta' : 'text-ok'}`}>{falta.length ? `Falta preencher: ${falta.length} ${falta.length === 1 ? 'dado' : 'dados'} (ver no fim)` : 'Dados completos'}</p>
          </div>
          <BotaoAssinatura p={p} com={comAss} set={setComAss} />
          <button className="btn-fire h-11 px-5" disabled={!!aGerar} onClick={() => imprimir()}>
            {aGerar ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {aGerar || 'Descarregar PDF'}
          </button>
        </div>
      </div>

      <Capa p={p} rotulo="Sinalização de segurança · RT-SCIE, arts. 108.º a 112.º" titulo={DOC} />
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
        <P>{p.objetivo || `O presente estudo define, por piso, o número mínimo e o tamanho mínimo das placas de sinalização de segurança de ${p.nome}, nos termos dos artigos 108.º a 112.º do RT-SCIE.`}</P>
        <H2 n={`${n}.2`}>Localização</H2>
        <P>{[p.morada, p.concelho, p.distrito].filter(Boolean).join(', ') || '—'}{p.coordenadas ? ` (coordenadas ${p.coordenadas})` : ''}.</P>
        <H2 n={`${n}.3`}>Legislação aplicada</H2>
        <TabelaLegislacao />
        <P>A sinalização faz-se nos termos do Decreto-Lei n.º 141/95, da Portaria n.º 1456-A/95 e, nos casos não regulamentados, das normas EN ISO 7010, ISO 3864 e ISO 16069 (RT-SCIE, art. 108.º n.º 1). Estes diplomas definem os pictogramas, as cores e os formatos; são citados e não verificados neste estudo.</P>
        <P>{baseLegalDoc(dataPtDe(p))} {notaVersao()}</P>

        <H1 n={S()}>Aplicabilidade</H1>
        <P>{APLIC[pl.aplic]} (RT-SCIE, art. 108.º n.º 4).</P>

        {ex && (<>
          <H1 n={S()}>Critérios</H1>
          <ul className="mb-3 ml-5 list-disc text-[12px] leading-[1.6] text-ink-2">
            <li><b>Saídas:</b> uma placa por saída, visível a partir de qualquer ponto suscetível de ocupação (art. 112.º n.os 1 e 5).</li>
            <li><b>Vias horizontais:</b> distância entre placas de 6 a 30 m — uma placa de sentido por cada 30 m ou fração de via (art. 112.º n.º 4), perpendicular ou a 45° ao sentido da fuga (n.º 2).</li>
            <li><b>Mudanças de direção:</b> uma placa em cada uma (art. 112.º n.º 3).</li>
            <li><b>Escadas:</b> no patamar de acesso, o número do andar ou a saída; no patamar intermédio, o sentido da evacuação (art. 112.º n.º 6).</li>
            <li><b>Equipamentos:</b> extintores (art. 163.º n.º 3), carretéis (art. 164.º) e meios de alarme (art. 112.º n.º 2) sinalizados.</li>
            <li><b>Tamanho:</b> A ≥ d²/2000, com d entre 6 e 50 m (art. 109.º).</li>
          </ul>
          <P>As quantidades são o mínimo que resulta destes critérios e dos dados indicados por piso; a localização exata de cada placa confirma-se na planta.</P>

          <H1 n={S()}>Placas por edifício e piso</H1>
          {p.edificios.filter((ed) => pisosOrd(ed.id).length).map((ed, i) => (
            <div key={ed.id}>
              <H2 n={`${n}.${i + 1}`}>{ed.nome}</H2>
              <table className="tbl mb-4">
                <thead><tr><th>Placa</th><th className="w-16 text-right">Qtd.</th><th>Exigência</th></tr></thead>
                <tbody>{pisosOrd(ed.id).map((s) => {
                  const t = s.dist ? areaPlaca(s.dist) : null;
                  const pl2 = placasPiso(s);
                  return (
                    <Fragment key={s.id}>
                      <tr><td colSpan={3} className="bg-paper font-display text-[11.5px] font-bold">{rotuloPisoInv(s.piso)}{t ? <span className="font-sans font-normal text-ink-3"> · tamanho mínimo {t.cm2.toLocaleString('pt-PT')} cm² (d = {t.d} m; ex.: {t.quadrada} × {t.quadrada} mm)</span> : null}</td></tr>
                      {pl2.length ? pl2.map((x) => (
                        <tr key={x.tipo} className="avoid-break"><td className="text-[11.5px]">{x.tipo}{x.nota ? <span className="block text-[10px] text-ink-3">{x.nota}</span> : null}</td><td className="num text-right text-[11.5px] font-semibold">{x.qtd}</td><td className="ref text-[10.5px]">{x.base}</td></tr>
                      )) : <tr><td colSpan={3} className="text-[11px] text-ink-3">Sem dados.</td></tr>}
                    </Fragment>
                  );
                })}</tbody>
              </table>
            </div>
          ))}

          <H1 n={S()}>Totais</H1>
          <table className="tbl mb-4">
            <thead><tr><th>Placa</th><th className="w-24 text-right">Quantidade</th><th>Exigência</th></tr></thead>
            <tbody>
              {tot.itens.map((i) => <tr key={i.tipo}><td className="text-[11.5px]">{i.tipo}</td><td className="num text-right text-[11.5px] font-semibold">{i.qtd}</td><td className="ref text-[10.5px]">{i.base}</td></tr>)}
              <tr className="border-t-2 border-ink"><td className="font-bold">Total de placas (mínimo)</td><td className="num text-right font-bold">{tot.total}</td><td /></tr>
            </tbody>
          </table>

          <H1 n={S()}>Regras de instalação</H1>
          <ul className="mb-3 ml-5 list-disc text-[12px] leading-[1.6] text-ink-2">
            <li>Material rígido fotoluminescente, ensaiado segundo referenciais normativos de estados-membros da UE (art. 110.º).</li>
            <li>Visíveis de qualquer ponto onde a informação deva ser conhecida; paralelas à parede (uma face), perpendiculares ou suspensas (dupla face) ou a 45° (art. 111.º n.º 1).</li>
            <li>Placas salientes a uma altura entre 2,1 m e 3 m, salvo espaços amplos com justificação (art. 111.º n.º 2).</li>
            <li>Nos locais de permanência, distinguíveis de qualquer ponto com ângulo de observação superior a 45° com a parede (art. 112.º n.º 1).</li>
            <li>A menos de 2 m, em projeção horizontal, de uma fonte de luz, sem ficarem coladas sobre os aparelhos, salvo os casos do n.º 8 (art. 112.º n.os 7 e 8).</li>
            <li>Nada na linha de visão pode ocultar a sinalização ou confundir os ocupantes (art. 108.º n.º 3).</li>
          </ul>
        </>)}

        <H1 n={S()}>Conclusões</H1>
        <P>{ex ? <>Ficam previstas, no mínimo, <b>{tot.total} placas</b> de sinalização de segurança{maxD ? <>, com o tamanho mínimo de cada piso indicado no capítulo 5 (a maior distância de visão é {maxD} m)</> : null}. A localização exata confirma-se na planta.</> : 'A sinalização de segurança não é exigida neste caso.'}{falta.length ? ' Há dados por preencher: o estudo só fica concluído depois de completos.' : ''}</P>
        {p.conclusoes && <div className="mt-2 whitespace-pre-line text-[12px] leading-[1.65]">{p.conclusoes}</div>}

        {falta.length > 0 && (
          <div className="no-print mt-6 border-l-[3px] border-alerta bg-alerta-soft px-4 py-3 text-[12px]">
            <p className="mb-1 font-semibold text-alerta">Falta preencher:</p>
            <ul className="ml-4 list-disc">{falta.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
        )}
        <TermoAutor p={p} com={comAss} documento="o presente estudo" titulo={<H1 n={S()}>Termo do autor</H1>} />
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Anexos</H1>
        <RevisoesDistribuicao p={p} />
        <H2 n="C">Lista de abreviaturas</H2>
        <Abreviaturas lista={ABREVIATURAS.filter(([a]) => ['ANEPC', 'RJ-SCIE', 'RT-SCIE', 'SCIE', 'UT'].includes(a))} />
      </Sheet>
    </div>
  );
}
