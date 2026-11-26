import type { ReactNode } from 'react';
import type { Projeto } from '../data/types';
import { DIPLOMAS } from '../data/rjscie';
import { LEI_VERIFICADA_EM, VERSAO_APP } from '../versao';
import { H2, P, Sheet } from './doc';

/** Blocos profissionais comuns ao relatório SCIE e ao estudo de extintores: capa, ficha técnica, empresa, legislação, termo do autor e anexos. */

export const dataPtDe = (p: Projeto) => (p.data ? new Date(p.data + 'T00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '');
const local = (p: Projeto) => [p.morada, p.concelho, p.distrito].filter(Boolean).join(', ');

export function Capa({ p, titulo, rotulo }: { p: Projeto; titulo: string; rotulo: string }) {
  const dataPt = dataPtDe(p);
  return (
    <Sheet className="flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">{p.empresa.logo ? <img src={p.empresa.logo} className="h-[80px] w-[80px] object-contain" /> : <span className="font-display text-[20px] font-extrabold">{p.empresa.nome || 'Empresa'}</span>}{p.clienteLogo && <><span className="h-12 w-px bg-ink-4" /><img src={p.clienteLogo} className="h-[80px] w-[80px] object-contain" /></>}</div>
        <span className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-wider text-ink-3">{p.referencia || 'S/ ref.'}<br />Versão {p.versao}<br />{dataPt}</span>
      </div>
      <div className="mt-[52mm]">
        <div className="mb-6 h-[6px] w-24 bg-fire" />
        <p className="label mb-3">{rotulo}</p>
        <h1 className="h-display text-[44px]">{titulo}</h1>
        <p className="mt-4 font-display text-[22px] font-bold leading-tight text-ink-2">{p.nome}</p>
        <p className="mt-2 text-[13px] text-ink-3">{local(p)}</p>
      </div>
      <div className="mt-auto border-t-[3px] border-ink pt-5">
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-[11.5px]">
          <div><p className="label">Cliente</p><p className="font-semibold">{p.cliente || '—'}</p></div>
          <div><p className="label">Elaborado por</p><p className="font-semibold">{p.autor.nome || '—'}</p><p className="text-ink-3">{[p.autor.qualificacao, p.autor.ordem && `${p.autor.ordem} n.º ${p.autor.numero}`].filter(Boolean).join(' · ')}</p>{p.empresa.nome && <p className="text-ink-3">{p.empresa.nome}</p>}</div>
          <div><p className="label">Data</p><p className="font-semibold">{dataPt || '—'}</p><p className="text-ink-3">Versão {p.versao}</p></div>
        </div>
      </div>
    </Sheet>
  );
}

export function FichaTecnica({ p, documento }: { p: Projeto; documento: string }) {
  const dataPt = dataPtDe(p);
  return (
    <table className="tbl mb-10">
      <tbody>
        {[
          ['Documento', documento],
          ['Projeto', p.nome], ['Referência', p.referencia || '—'], ['Cliente / entidade responsável', p.cliente || '—'],
          ['Localização', local(p) || '—'], ['Coordenadas', p.coordenadas || '—'],
          ['Autor', [p.autor.nome, p.autor.qualificacao].filter(Boolean).join(', ') || '—'],
          ['Associação profissional', p.autor.ordem ? `${p.autor.ordem}, n.º ${p.autor.numero || '—'}` : '—'], ['Registo ANEPC do autor', p.autor.registoAnepc || '—'],
          ['Empresa', [p.empresa.nome, p.empresa.nif && `NIF ${p.empresa.nif}`].filter(Boolean).join(' · ') || '—'],
          ['Data / versão', `${dataPt} · v${p.versao}`],
          ['Base legal', `Legislação em vigor${dataPt ? ` em ${dataPt}` : ''}: RJ-SCIE (DL 220/2008, na redação da Lei 123/2019); RT-SCIE (Portaria 1532/2008, na redação da Portaria 135/2020); Despacho 2074/2009, na redação do Despacho 8954/2020`],
          ['Ferramenta de cálculo', `Cautela SCIE, versão de ${VERSAO_APP} (regras conferidas com o Diário da República em ${LEI_VERIFICADA_EM})`],
        ].map(([a, b]) => <tr key={a}><td className="w-[42%] font-semibold">{a}</td><td>{b}</td></tr>)}
      </tbody>
    </table>
  );
}

export function Indice({ itens, antes }: { itens: string[]; antes?: string }) {
  return (
    <>
      {antes && <p className="mb-1.5 flex items-baseline gap-3 border-b border-dotted border-ink-4 pb-1 text-[12.5px] font-semibold"><span className="w-6 font-mono text-fire-ink">—</span>{antes}</p>}
      <ol className="space-y-1.5 text-[12.5px]">
        {itens.map((t, i) => <li key={t} className="flex items-baseline gap-3 border-b border-dotted border-ink-4 pb-1"><span className="w-6 font-mono text-fire-ink">{i + 1}</span>{t}</li>)}
      </ol>
    </>
  );
}

export function EmpresaBloco({ p }: { p: Projeto }) {
  return (
    <div className="mb-6 grid grid-cols-[1fr_190px] gap-6">
      <div className="whitespace-pre-line text-[12px] leading-[1.65] text-ink-2">{p.empresa.apresentacao || 'Texto de apresentação da empresa por preencher em «A minha empresa» (página inicial).'}</div>
      <div className="border-l-[3px] border-fire pl-4 text-[11px] leading-relaxed">
        {p.empresa.logo && <img src={p.empresa.logo} className="mb-3 h-[64px] w-[64px] object-contain" />}
        <p className="font-semibold">{p.empresa.nome}</p>
        <p className="text-ink-3">{p.empresa.morada}</p>
        {p.empresa.nif && <p>NIF {p.empresa.nif}</p>}
        {p.empresa.telefone && <p>{p.empresa.telefone}</p>}
        {p.empresa.email && <p>{p.empresa.email}</p>}
        {p.empresa.website && <p>{p.empresa.website}</p>}
        {p.empresa.alvara && <p className="mt-1">Registo ANEPC: {p.empresa.alvara}</p>}
      </div>
    </div>
  );
}

export function TabelaLegislacao() {
  return (
    <table className="tbl mb-2"><thead><tr><th>Sigla</th><th>Diploma</th><th>Objeto</th></tr></thead>
      <tbody>{DIPLOMAS.map((d) => <tr key={d.sigla}><td className="font-semibold">{d.sigla}</td><td>{d.titulo}</td><td>{d.objeto}</td></tr>)}</tbody></table>
  );
}

export function TermoAutor({ p, documento, titulo }: { p: Projeto; documento: string; titulo: ReactNode }) {
  return (
    <div className="avoid-break mt-[30mm]">
      {titulo}
      <P>{p.autor.nome || '[Nome do autor]'}{p.autor.qualificacao ? `, ${p.autor.qualificacao}` : ''}{p.autor.ordem ? `, inscrito na ${p.autor.ordem} com o n.º ${p.autor.numero || '—'}` : ''}{p.autor.registoAnepc ? ` e registado na ANEPC com o n.º ${p.autor.registoAnepc}` : ''}, declara que {documento} foi elaborado com base no Decreto-Lei n.º 220/2008, na redação da Lei n.º 123/2019, na Portaria n.º 1532/2008, na redação da Portaria n.º 135/2020, e no Despacho n.º 2074/2009, na redação do Despacho n.º 8954/2020.</P>
      <div className="mt-14 grid grid-cols-2 gap-10 text-[11.5px]">
        <div><p>{p.concelho || '__________'}, {dataPtDe(p)}</p></div>
        <div className="text-center"><div className="mb-1 border-b border-ink pb-12" /><p className="font-semibold">{p.autor.nome || 'O autor'}</p><p className="text-ink-3">{p.autor.qualificacao}</p></div>
      </div>
    </div>
  );
}

export function RevisoesDistribuicao({ p }: { p: Projeto }) {
  return (
    <>
      <H2 n="A">Lista de revisões e alterações</H2>
      <table className="tbl mb-6"><thead><tr><th className="w-24">Versão</th><th className="w-36">Data</th><th>Descrição</th></tr></thead>
        <tbody>{(p.revisoes?.length ? p.revisoes : [{ versao: p.versao, data: p.data, descricao: 'Emissão' }]).map((r, i) => (
          <tr key={i}><td className="num">{r.versao}</td><td>{r.data ? new Date(r.data + 'T00:00').toLocaleDateString('pt-PT') : '—'}</td><td>{r.descricao || '—'}</td></tr>
        ))}</tbody></table>
      <H2 n="B">Lista de distribuição de exemplares</H2>
      {p.distribuicao?.length ? (
        <table className="tbl mb-6"><thead><tr><th className="w-24">Exemplar</th><th>Entidade / destinatário</th><th className="w-32">Suporte</th></tr></thead>
          <tbody>{p.distribuicao.map((d, i) => <tr key={i}><td className="num">{d.exemplar}</td><td>{d.entidade || '—'}</td><td>{d.suporte}</td></tr>)}</tbody></table>
      ) : <P>Sem lista de distribuição definida.</P>}
    </>
  );
}

export function Abreviaturas({ lista }: { lista: [string, string][] }) {
  return <table className="tbl"><tbody>{lista.map(([a, d]) => <tr key={a}><td className="w-28 font-mono font-semibold">{a}</td><td className="text-[11.5px]">{d}</td></tr>)}</tbody></table>;
}

export const ABREVIATURAS: [string, string][] = [
  ['ANEPC', 'Autoridade Nacional de Emergência e Proteção Civil'],
  ['RJ-SCIE', 'Regime Jurídico de Segurança Contra Incêndio em Edifícios (DL 220/2008, red. Lei 123/2019)'],
  ['RT-SCIE', 'Regulamento Técnico de Segurança Contra Incêndio em Edifícios (Portaria 1532/2008, red. Portaria 135/2020)'],
  ['SCIE', 'Segurança contra incêndio em edifícios'],
  ['UT', 'Utilização-tipo'],
  ['MAP', 'Medidas de autoproteção'],
  ['PEI', 'Plano de emergência interno'],
  ['RS', 'Responsável de segurança'],
  ['SSI', 'Serviço de segurança contra incêndio'],
  ['SADI', 'Sistema automático de deteção de incêndio'],
  ['CCF', 'Câmara corta-fogo'],
  ['UP', 'Unidade de passagem'],
  ['PR', 'Plano de referência'],
  ['R / E / I', 'Capacidade de suporte de carga / estanquidade / isolamento térmico (resistência ao fogo)'],
  ['C', 'Fecho automático (portas resistentes ao fogo)'],
  ['Qs / qs', 'Carga de incêndio modificada (MJ) / densidade de carga de incêndio modificada (MJ/m²)'],
  ['Hi', 'Poder calorífico inferior (MJ/kg)'],
  ['Ci', 'Coeficiente de combustibilidade'],
  ['Rai', 'Coeficiente de ativação'],
  ['qsi / qvi', 'Valor estatístico da densidade de carga de incêndio (MJ/m²) / por unidade de volume (MJ/m³)'],
  ['FDS', 'Ficha de dados de segurança'],
];
