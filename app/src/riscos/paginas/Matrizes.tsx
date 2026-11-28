import { NC, ND, NE, NIVEIS, NP_SIG, nivelNP } from '../motor';

/** Os oito quadros da matriz SSARA (folha «Tabelas» do Excel V5.0), para consultar no editor e para o relatório */

const corNP: Record<string, string> = { MA: '#C2362B', A: '#E06A12', M: '#C89B00', B: '#2F7D4F' };
const Cab = ({ n, t }: { n: number; t: string }) => <p className="mb-1.5 mt-5 flex items-baseline gap-2 text-[12.5px] font-bold first:mt-0"><span className="font-mono text-fire-ink">Quadro {n}</span>{t}</p>;
const Cel = ({ cor, children }: { cor: string; children: React.ReactNode }) => <td className="!p-1 text-center font-mono text-[10.5px] font-bold text-white" style={{ background: cor }}>{children}</td>;

/** Quadro 7 tal como no Excel V5.0 (NTP 330): [nível, intervalo] por NC (linhas) e banda de NP (colunas MA, A, M, B) */
const Q7: Record<number, [string, string][][]> = {
  100: [[['I', '4000 – 2400']], [['I', '2000 – 1200']], [['I', '800 – 600']], [['II', '400 – 200']]],
  60: [[['I', '2400 – 1440']], [['I', '1200 – 600']], [['II', '480 – 360']], [['II', '240'], ['III', '120']]],
  25: [[['I', '1000 – 600']], [['II', '500 – 250']], [['II', '200 – 150']], [['III', '100 – 50']]],
  10: [[['II', '400 – 240']], [['II', '200'], ['III', '100']], [['III', '80 – 60']], [['III', '40'], ['IV', '20']]],
};
const corN = (n: string) => NIVEIS.find((x) => x.n === n)!.cor;

export default function Quadros({ compacto }: { compacto?: boolean }) {
  const tbl = `tbl mb-1 ${compacto ? 'text-[10.5px]' : 'text-[11.5px]'}`;
  const q2: [boolean, boolean, boolean, number][] = [[false, false, false, 10], [false, false, true, 10], [false, true, false, 6], [false, true, true, 6], [true, false, false, 2], [true, false, true, 2], [true, true, false, 2], [true, true, true, 1]];
  const sn = (b: boolean) => (b ? 'Sim' : 'Não');
  return (
    <div>
      <Cab n={1} t="Nível de deficiência (ND)" />
      <table className={tbl}><thead><tr><th className="w-10">ND</th><th className="w-36">Nível</th><th>Significado</th></tr></thead><tbody>{ND.map((x) => <tr key={x.v}><td className="num font-bold">{x.v === 1 ? '–' : x.v}</td><td>{x.nome}</td><td>{x.sig}</td></tr>)}</tbody></table>

      <p className="mb-1 text-[10.5px] text-ink-3">Aceitável (A) não tem valor: o risco está controlado e não se calcula NP nem NR (NTP 330; aulas, Quadro 1).</p>

      <Cab n={2} t="Níveis de deficiência — critérios" />
      <table className={tbl}><thead><tr><th>ND</th><th>Cumpre o requisito legal?</th><th>A informação está presente?</th><th>A formação foi dada?</th></tr></thead>
        <tbody>{q2.map(([l, i, f, v], k) => <tr key={k}><td className="font-semibold">{ND.find((x) => x.v === v)!.nome} · {v === 1 ? '–' : v}</td><td>{sn(l)}</td><td>{sn(i)}</td><td>{sn(f)}</td></tr>)}</tbody></table>

      <Cab n={3} t="Nível de exposição (NE)" />
      <table className={tbl}><thead><tr><th className="w-10">NE</th><th className="w-36">Nível</th><th>Significado</th></tr></thead><tbody>{NE.map((x) => <tr key={x.v}><td className="num font-bold">{x.v}</td><td>{x.nome}</td><td>{x.sig}</td></tr>)}</tbody></table>

      <Cab n={4} t="Nível de probabilidade (NP = ND × NE)" />
      <table className={`${tbl} max-w-[460px]`}><thead><tr><th>ND \ NE</th>{NE.map((e) => <th key={e.v} className="text-center">{e.v}</th>)}</tr></thead>
        <tbody>{ND.filter((d) => d.v > 1).map((d) => <tr key={d.v}><td className="font-mono font-bold">{d.v}</td>{NE.map((e) => { const v = d.v * e.v; const s = nivelNP(v)!; return <Cel key={e.v} cor={corNP[s.sigla]}>{s.sigla} · {v}</Cel>; })}</tr>)}</tbody></table>
      <p className="mb-1 text-[10.5px] text-ink-3">O nível aceitável não entra na matriz: com deficiência aceitável não se calcula a probabilidade.</p>

      <Cab n={5} t="Significado dos níveis de probabilidade" />
      <table className={tbl}><thead><tr><th className="w-32">Nível</th><th className="w-20">NP</th><th>Significado</th></tr></thead><tbody>{NP_SIG.map((x) => <tr key={x.sigla}><td className="font-semibold"><span className="mr-1.5 inline-block h-2.5 w-2.5" style={{ background: corNP[x.sigla] }} />{x.nome} ({x.sigla})</td><td className="num">{x.intervalo}</td><td>{x.sig}</td></tr>)}</tbody></table>

      <Cab n={6} t="Nível de consequências (NC)" />
      <table className={tbl}><thead><tr><th className="w-10">NC</th><th className="w-40">Nível</th><th>Danos pessoais</th><th>Danos materiais</th></tr></thead><tbody>{NC.map((x) => <tr key={x.v}><td className="num font-bold">{x.v}</td><td>{x.nome}</td><td>{x.pessoais}</td><td>{x.materiais}</td></tr>)}</tbody></table>

      <Cab n={7} t="Nível de intervenção ou risco (NR = NP × NC)" />
      <table className={tbl}><thead><tr><th>NC \ NP</th>{NP_SIG.map((x) => <th key={x.sigla} className="text-center">{x.intervalo}<br />{x.nome}</th>)}</tr></thead>
        <tbody>{NC.map((c) => <tr key={c.v}><td className="font-mono font-bold">{c.v}</td>{Q7[c.v].map((cel, k) => (
          <td key={k} className="!p-0"><div className="flex flex-col">{cel.map(([n, txt], j) => <span key={j} className="px-1 py-1 text-center font-mono text-[10.5px] font-bold text-white" style={{ background: corN(n) }}>{n} · {txt}</span>)}</div></td>
        ))}</tr>)}</tbody></table>

      <Cab n={8} t="Nível de intervenção e controlo" />
      <table className={tbl}><thead><tr><th className="w-14">Nível</th><th className="w-24">NR</th><th>Significado</th></tr></thead><tbody>{NIVEIS.map((x) => <tr key={x.n}><Cel cor={x.cor}>{x.n}</Cel><td className="num">{x.intervalo}</td><td>{x.sig}</td></tr>)}</tbody></table>
    </div>
  );
}
