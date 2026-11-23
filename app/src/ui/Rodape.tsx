import { DIPLOMAS } from '../data/rjscie';
import { Lema, NomeApp, Simbolo } from './Marca';

const versao = new Date(parseInt(__VERSAO__, 36)).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Rodapé institucional: finalidade, autoria, base legal, limitações e dados. */
export default function Rodape() {
  return (
    <footer className="mt-16 border-t-2 border-ink pt-8 text-[12.5px] leading-relaxed text-ink-2">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Simbolo className="h-10 w-10" />
          <NomeApp className="text-[18px]" />
        </div>
        <Lema className="!text-left !text-[17px] text-ink" />
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <section>
          <h3 className="label mb-2 !text-fire-ink">Finalidade</h3>
          <p>Ferramenta de apoio à avaliação da segurança contra incêndio em edifícios: classificação das utilizações-tipo e da categoria de risco, cálculo do efetivo e da carga de incêndio modificada, verificação das medidas de segurança e das medidas de autoproteção, e relatório técnico.</p>
        </section>
        <section>
          <h3 className="label mb-2 !text-fire-ink">Autoria</h3>
          <p><b>Fernando Adamastor Pinto Pereira</b><br />Projeto final da licenciatura em Engenharia da Segurança do Trabalho — ISLA Gaia, ano letivo 2026/2027.<br />Orientador: Prof. Acácio Amorim.</p>
          <p className="mt-2"><a className="font-semibold text-ink underline decoration-fire underline-offset-2" href="mailto:fernandoadamastor@engenheiros.pt">fernandoadamastor@engenheiros.pt</a></p>
        </section>
        <section>
          <h3 className="label mb-2 !text-fire-ink">Base legal</h3>
          <ul className="flex flex-col gap-1.5">
            {DIPLOMAS.map((d) => <li key={d.sigla}><b>{d.sigla}</b> — {d.titulo}</li>)}
          </ul>
        </section>
        <section>
          <h3 className="label mb-2 !text-fire-ink">Responsabilidade e dados</h3>
          <p>Os resultados apoiam, mas não substituem, a análise do técnico responsável nem a apreciação da entidade competente (câmara municipal ou ANEPC). Confirme sempre no texto da lei, disponível em cada medida.</p>
          <p className="mt-2">Os projetos ficam guardados neste aparelho e na sua conta (Google), e não são partilhados com terceiros.</p>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-paper-3 py-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-4">
        <span>© {new Date().getFullYear()} Fernando Adamastor · Cautela SCIE</span>
        <span>Versão de {versao}</span>
      </div>
    </footer>
  );
}
