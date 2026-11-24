/**
 * Como escolher o coeficiente de combustibilidade Ci — Despacho n.º 8954/2020, n.º 6.º.
 * Separa o que é lei (critérios), o que é regra oficial para ler a FDS (advertências H do Regulamento CLP)
 * e o que é orientação técnica para materiais comuns (a justificar na memória).
 */
const CRITERIOS: { ci: string; risco: string; cor: string; itens: string[] }[] = [
  { ci: '1,60', risco: 'Alto', cor: 'bg-alerta text-white', itens: [
    'Produtos liquefeitos com tensão de vapor a 15 °C superior a 28 kPa (gases liquefeitos)',
    'Líquidos com ponto de inflamação inferior a 38 °C',
    'Sólidos com ponto de inflamação inferior a 100 °C',
    'Produtos suscetíveis de formar misturas explosivas com o ar (poeiras, nevoeiros, vapores e gases combustíveis)',
    'Produtos suscetíveis de entrar em combustão espontânea',
  ] },
  { ci: '1,30', risco: 'Médio', cor: 'bg-fire text-ink', itens: [
    'Líquidos com ponto de inflamação entre 38 e 100 °C',
    'Sólidos com ponto de inflamação entre 100 e 200 °C',
    'Sólidos suscetíveis de emitir vapores inflamáveis',
  ] },
  { ci: '1,00', risco: 'Baixo', cor: 'bg-ok text-white', itens: [
    'Líquidos com ponto de inflamação superior a 100 °C',
    'Sólidos com ponto de inflamação superior a 200 °C',
  ] },
];

const FDS_H: [string, string, string][] = [
  ['H220, H221, H222, H223', 'Gases e aerossóis inflamáveis', '1,60'],
  ['H224, H225', 'Líquido extremamente / facilmente inflamável (ponto de inflamação < 23 °C)', '1,60'],
  ['H226', 'Líquido inflamável (ponto de inflamação 23–60 °C)', '1,60 se < 38 °C · 1,30 se ≥ 38 °C (ver secção 9)'],
  ['H228', 'Sólido inflamável', '1,60'],
  ['H250, H251, H252', 'Pirofórico ou de autoaquecimento (combustão espontânea)', '1,60'],
  ['«Pode formar mistura explosiva poeira-ar»', 'Poeiras combustíveis', '1,60'],
  ['Sem advertência de inflamabilidade', '—', 'pelo ponto de inflamação da secção 9'],
];

const MATERIAIS: [string, string, string][] = [
  ['Madeira maciça, paletes, mobiliário, papel, cartão, têxteis naturais', '1,00', 'sólidos que só inflamam bem acima de 200 °C'],
  ['Plásticos, borrachas, espumas, embalagens plásticas', '1,30', 'sólidos suscetíveis de emitir vapores inflamáveis quando aquecidos'],
  ['Gasóleo, óleos minerais e lubrificantes (confirmar na FDS)', '1,30 / 1,00', 'ponto de inflamação 38–100 °C (1,30) ou > 100 °C (1,00)'],
  ['Gasolina, diluentes, solventes, álcool, tintas e vernizes com solvente', '1,60', 'ponto de inflamação < 38 °C'],
  ['Propano, butano, aerossóis', '1,60', 'gases liquefeitos'],
  ['Pó fino de madeira, farinha, açúcar em pó, outras poeiras combustíveis', '1,60', 'misturas explosivas com o ar'],
  ['Panos com óleos secativos, fenos ou serraduras húmidas acumuladas', '1,60', 'combustão espontânea'],
];

export default function GuiaCi() {
  return (
    <div className="border border-ink bg-white text-[12.5px]">
      <div className="border-b border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white">Como escolher o Ci — coeficiente de combustibilidade</div>
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <section>
          <p className="label mb-2 !text-fire-ink">1. O que diz a lei — Despacho n.º 8954/2020, n.º 6.º</p>
          <div className="flex flex-col gap-2">
            {CRITERIOS.map((c) => (
              <div key={c.ci} className="flex gap-3">
                <span className={`grid h-7 w-14 shrink-0 place-items-center font-mono text-[12px] font-bold ${c.cor}`}>{c.ci}</span>
                <div><b>Risco {c.risco.toLowerCase()}</b><ul className="mt-0.5 list-disc pl-4 text-ink-2">{c.itens.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <p className="label mb-2 !text-fire-ink">2. Onde encontrar o ponto de inflamação</p>
          <ol className="list-decimal pl-4 text-ink-2">
            <li className="mb-1"><b className="text-ink">Ficha de Dados de Segurança (FDS) do produto</b> — obrigatória para produtos químicos e entregue pelo fornecedor. <b className="text-ink">Secção 9</b>: «ponto de inflamação», «inflamabilidade», «temperatura de autoignição». <b className="text-ink">Secção 2</b>: advertências de perigo H (quadro abaixo).</li>
            <li className="mb-1"><b className="text-ink">Ficha técnica do fabricante</b> — para materiais sem FDS. A classe de reação ao fogo (A1, B-s1,d0…) <u>não</u> é o ponto de inflamação.</li>
            <li><b className="text-ink">Bibliografia técnica</b> (manuais de segurança contra incêndio) — para materiais comuns sem ficha; cite a fonte na memória.</li>
          </ol>
          <p className="mt-3 rounded-none border-l-[3px] border-fire bg-fire-soft px-3 py-2">Na dúvida, escolha o <b>Ci mais alto</b> (do lado da segurança) e justifique a escolha na memória.</p>
        </section>
        <section>
          <p className="label mb-2 !text-fire-ink">3. Ler a FDS — advertências H (Regulamento CLP, CE n.º 1272/2008)</p>
          <table className="tbl"><thead><tr><th>Advertência</th><th>Significado</th><th>Ci</th></tr></thead>
            <tbody>{FDS_H.map(([h, s, c]) => <tr key={h}><td className="font-mono text-[11.5px]">{h}</td><td>{s}</td><td className="font-mono text-[11.5px] font-semibold">{c}</td></tr>)}</tbody></table>
        </section>
        <section>
          <p className="label mb-2 !text-fire-ink">4. Materiais comuns — orientação técnica</p>
          <table className="tbl"><thead><tr><th>Material</th><th>Ci</th><th>Enquadramento</th></tr></thead>
            <tbody>{MATERIAIS.map(([m, c, j]) => <tr key={m}><td>{m}</td><td className="whitespace-nowrap font-mono text-[11.5px] font-semibold">{c}</td><td className="text-ink-3">{j}</td></tr>)}</tbody></table>
          <p className="mt-2 text-[11.5px] text-ink-3">Esta lista não consta do Despacho: é a aplicação habitual dos critérios do n.º 6.º. Havendo FDS ou ficha técnica, prevalece o valor do fabricante.</p>
        </section>
      </div>
    </div>
  );
}
