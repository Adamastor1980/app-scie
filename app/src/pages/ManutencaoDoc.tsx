import { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { useP } from './ProjetoShell';
import { Sheet, H1, H2, P, useDocumento } from './doc';
import { ABREVIATURAS, Abreviaturas, BotaoAssinatura, Capa, EmpresaBloco, FichaTecnica, Indice, RevisoesDistribuicao, TermoAutor, dataPtDe } from './docComum';
import { periodoDe, TIPO_MANUT, dataPt, descExt, estadoExt, faltaExt, faltaReg, hojeISO, ordenar, resumoManut, rotuloPisoInv } from '../engine/manutencao';
import { COR_NIVEL } from './Manutencao';
import { NOME_REQ } from './VerificacaoExt';
import { verificarEdificio } from '../engine/verificacaoExt';
import { baseLegalDoc, notaVersao } from '../versao';

/** Documento «Plano e registo de manutenção de extintores» — RT-SCIE, arts. 201.º n.º 1 c) e 202.º n.º 4 */
export default function ManutencaoDoc() {
  const { p } = useP();
  const comCar = !!p.manutencao?.extintores.some((e) => e.equip === 'carretel');
  const DOC = comCar ? 'Plano e registo de manutenção de extintores e carretéis' : 'Plano e registo de manutenção de extintores';
  const { zoom, aGerar, imprimir } = useDocumento(p, DOC, 'man-folhas');
  const [comAss, setComAss] = useState(true);
  const pl = p.manutencao;
  const hoje = hojeISO();
  const lista = pl ? ordenar(pl.extintores, p.edificios.map((e) => e.id)) : [];
  const r = resumoManut(pl, hoje);
  const nomeEd = (id: string) => p.edificios.find((e) => e.id === id)?.nome ?? '—';
  const falta = lista.flatMap((e) => [...faltaExt(e).map((f) => `${e.num}: ${f[0].toLowerCase()}`), ...e.registos.flatMap((g) => faltaReg(g).map((f) => `${e.num}, registo de ${dataPt(g.data)}: ${f[0].toLowerCase()}`))]);
  const urgentes = lista.map((e) => ({ e, s: estadoExt(e, periodoDe(pl!, e), hoje) })).filter((x) => x.s.nivel !== 'ok' || x.s.naoConforme);
  const regs = lista.flatMap((e) => e.registos.map((g) => ({ e, g }))).sort((a, b) => b.g.data.localeCompare(a.g.data));
  const comp = pl?.verificar ? p.edificios.filter((ed) => ed.uts.length).map((ed) => ({ ed, v: verificarEdificio(ed, pl) })) : [];
  const CAPS = ['Apresentação da empresa', 'Enquadramento legal', 'Inventário de extintores por edifício e piso', 'Situação à data', ...(comp.length ? ['Verificação legal dos extintores existentes'] : []), 'Registo de manutenções', 'Termo', 'Anexos'];
  let n = 0; const S = () => String(++n);

  return (
    <div id="man-folhas" className="bg-paper-3/60 pb-16 print:bg-white print:pb-0" style={{ ['--rz' as string]: zoom }}>
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

      <Capa p={p} rotulo="Meios de primeira intervenção · RT-SCIE, arts. 201.º e 202.º" titulo={DOC} />

      <Sheet className="page-break">
        <H1 n="—">Ficha técnica</H1>
        <FichaTecnica p={p} documento={DOC} />
        <H1 n="—">Índice</H1>
        <Indice itens={CAPS} />
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Apresentação da empresa</H1>
        <EmpresaBloco p={p} />

        <H1 n={S()}>Enquadramento legal</H1>
        <ul className="mb-3 ml-5 list-disc text-[12px] leading-[1.6] text-ink-2">
          <li>Os registos de segurança incluem a relação de todas as ações de manutenção nos equipamentos de segurança, com o elemento intervencionado, o tipo e o motivo da ação, a data e o responsável (RT-SCIE, art. 201.º n.º 1 c)).</li>
          <li>A manutenção segue um programa com calendário e verificação periódica (RT-SCIE, art. 202.º n.º 4).</li>
          <li>As entidades que fazem a manutenção de equipamentos de SCIE estão sujeitas a registo na ANEPC (RJ-SCIE, art. 23.º).</li>
          <li>Os extintores cumprem as normas EN 3, EN 1866 e NP 4413 (RT-SCIE, anexo I, art. 8.º n.º 9). Periodicidade adotada: manutenção a cada <b>{pl?.periodoMeses ?? 12} meses</b>, contada a partir da última intervenção registada.</li>
          {comCar && <li>Bocas de incêndio do tipo carretel conformes com a EN 671-1 e sinalizadas (RT-SCIE, arts. 164.º e 166.º). Periodicidade adotada: manutenção a cada <b>{pl?.periodoCarreteis ?? 12} meses</b> (EN 671-3, norma fora da base legal da aplicação).</li>}
          <li>Extintores com o prazo de manutenção ultrapassado constituem contraordenação (RJ-SCIE, art. 25.º n.º 1 w)).</li>
        </ul>
        <P>{baseLegalDoc(dataPtDe(p))} {notaVersao()}</P>

        <H1 n={S()}>Inventário de extintores por edifício e piso</H1>
        {!lista.length && <P>Sem extintores registados.</P>}
        {p.edificios.filter((ed) => lista.some((e) => e.edificio === ed.id)).map((ed, i) => (
          <div key={ed.id}>
            <H2 n={`${n}.${i + 1}`}>{ed.nome}</H2>
            <table className="tbl mb-4">
              <thead><tr><th>N.º</th><th>Piso</th><th>Local</th><th>Equipamento</th><th>Eficácia</th><th>Fabricante · série · ano</th><th>Última</th><th>Próxima</th></tr></thead>
              <tbody>{lista.filter((e) => e.edificio === ed.id).map((e) => {
                const s = estadoExt(e, periodoDe(pl!, e), hoje);
                return (
                  <tr key={e.id} className="avoid-break">
                    <td className="whitespace-nowrap font-mono text-[11px] font-semibold">{e.num}</td><td className="whitespace-nowrap text-[11px]">{rotuloPisoInv(e.piso)}</td><td className="text-[11px]">{e.local || '—'}</td>
                    <td className="text-[11px]">{descExt(e)}</td><td className="text-[11px]">{e.eficacia || '—'}</td>
                    <td className="text-[10.5px]">{[e.fabricante, e.serie, e.ano].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="whitespace-nowrap text-[11px]">{s.ultima ? dataPt(s.ultima.data) : '—'}</td>
                    <td className="whitespace-nowrap text-[11px] font-semibold">{s.proxima ? dataPt(s.proxima) : '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ))}

        <H1 n={S()}>Situação à data de {dataPt(hoje)}</H1>
        <table className="tbl mb-3"><tbody>
          {[['Extintores', r.total], ['Em dia', r.ok], ['Manutenção nos próximos 60 dias', r.breve], ['Manutenção em atraso', r.atraso], ['Sem manutenção registada', r.sem], ['Não conformes na última intervenção', r.naoConforme]].map(([a, b]) => <tr key={String(a)}><td className="w-[60%]">{a}</td><td className="num text-right font-semibold">{b}</td></tr>)}
        </tbody></table>
        {urgentes.length > 0 && (
          <table className="tbl mb-4">
            <thead><tr><th>N.º</th><th>Edifício · piso · local</th><th>Situação</th></tr></thead>
            <tbody>{urgentes.map(({ e, s }) => (
              <tr key={e.id} className="avoid-break"><td className="whitespace-nowrap font-mono text-[11px] font-semibold">{e.num}</td><td className="text-[11px]">{nomeEd(e.edificio)} · {rotuloPisoInv(e.piso)} · {e.local || '—'}</td>
                <td className="text-[11px]"><span className={`border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${COR_NIVEL[s.nivel]}`}>{s.texto}{s.proxima ? ` · ${dataPt(s.proxima)}` : ''}</span>{s.naoConforme ? ' · não conforme na última intervenção' : ''}</td></tr>
            ))}</tbody>
          </table>
        )}

        {comp.length > 0 && (<>
          <H1 n={S()}>Verificação legal dos extintores existentes</H1>
          <P>Comparação dos extintores existentes com o que exige o RT-SCIE: art. 163.º (critério por piso, locais de risco C e F, cozinhas e laboratórios, centrais térmicas, tendas, distância e instalação) e as condições específicas da utilização-tipo. Pó químico: kg × 2 e espuma como água (critério técnico); CO₂ e extintores móveis não contam para o critério por piso.</P>
          {comp.map(({ ed, v }, i) => (
            <div key={ed.id}>
              <H2 n={`${n}.${i + 1}`}>{ed.nome} · {v.porUT.map((u) => u.ut).join(' · ')}</H2>
              <table className="tbl mb-4">
                <thead><tr><th>Exigência</th><th>Situação</th><th className="w-24">Resultado</th></tr></thead>
                <tbody>{v.res.map((r) => (
                  <tr key={r.key} className="avoid-break">
                    <td className="text-[11px]"><b>{r.titulo}</b>{r.tipo !== 'piso' && r.tipo !== 'manual' ? <span className="block text-ink-3">{r.onde}</span> : null}<span className="ref block">{r.base}</span></td>
                    <td className="text-[11px]">{r.tipo === 'manual' || r.tipo === 'outro' ? (r.estado === 'cumpre' ? 'Confirmado no local' : 'Por confirmar') : r.texto}{r.exts.length ? <span className="block text-ink-3">{r.exts.map((e) => e.num).join(', ')}</span> : null}{r.problemas.map((x, k) => <span key={k} className="block text-alerta">{x}</span>)}</td>
                    <td className={`text-[11px] font-semibold ${r.estado === 'cumpre' ? 'text-ok' : r.estado === 'falta' ? 'text-alerta' : ''}`}>{NOME_REQ[r.estado]}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </>)}

        <H1 n={S()}>Registo de manutenções</H1>
        <P>Relação das ações de manutenção, da mais recente para a mais antiga (RT-SCIE, art. 201.º n.º 1 c)).</P>
        {regs.length ? (
          <table className="tbl mb-4">
            <thead><tr><th>Data</th><th>Equipamento</th><th>Tipo</th><th>Resultado</th><th>Empresa (registo ANEPC) · técnico</th><th>Motivo e observações</th></tr></thead>
            <tbody>{regs.map(({ e, g }) => (
              <tr key={g.id} className="avoid-break">
                <td className="whitespace-nowrap text-[11px]">{dataPt(g.data)}</td>
                <td className="text-[11px]"><b className="font-mono">{e.num}</b><span className="block text-[10px] text-ink-3">{nomeEd(e.edificio)} · {rotuloPisoInv(e.piso)}</span></td>
                <td className="text-[11px]">{TIPO_MANUT[g.tipo]}</td>
                <td className={`text-[11px] font-semibold ${g.resultado === 'nao_conforme' ? 'text-alerta' : ''}`}>{g.resultado === 'conforme' ? 'Conforme' : g.resultado === 'nao_conforme' ? 'Não conforme' : '—'}</td>
                <td className="text-[10.5px]">{g.empresa || '—'}{g.registoAnepc ? ` (${g.registoAnepc})` : ''}<span className="block text-ink-3">{g.tecnico}</span></td>
                <td className="text-[10.5px]">{g.obs || '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <P>Ainda sem intervenções registadas.</P>}

        {falta.length > 0 && (
          <div className="no-print mt-6 border-l-[3px] border-alerta bg-alerta-soft px-4 py-3 text-[12px]">
            <p className="mb-1 font-semibold text-alerta">Falta preencher:</p>
            <ul className="ml-4 list-disc">{falta.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
        )}

        <TermoAutor p={p} com={comAss} documento="o presente plano e registo" titulo={<H1 n={S()}>Termo</H1>} />
      </Sheet>

      <Sheet className="page-break">
        <H1 n={S()}>Anexos</H1>
        <RevisoesDistribuicao p={p} />
        <H2 n="C">Lista de abreviaturas</H2>
        <Abreviaturas lista={ABREVIATURAS.filter(([a]) => ['ANEPC', 'RJ-SCIE', 'RT-SCIE', 'SCIE'].includes(a))} />
      </Sheet>
    </div>
  );
}
