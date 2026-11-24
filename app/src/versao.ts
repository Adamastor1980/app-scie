import { DIPLOMAS } from './data/rjscie';

const dPt = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Versão da aplicação: data da publicação (definida no build). */
export const VERSAO_APP = dPt(new Date(parseInt(__VERSAO__, 36)));

/** Data da última verificação das regras da aplicação contra os textos publicados em Diário da República. */
export const LEI_VERIFICADA_EM = '24/11/2026';

/** Frase de base legal para relatórios: diplomas e redação em vigor à data do documento. */
export const baseLegalDoc = (data: string) =>
  `Análise efetuada com base na legislação em vigor${data ? ` em ${data}` : ''}: ${DIPLOMAS.map((d) => `${d.sigla} — ${d.titulo}`).join('; ')}.`;

export const notaVersao = () =>
  `Documento gerado pela aplicação Cautela SCIE, versão de ${VERSAO_APP}, cujas regras foram conferidas com os textos publicados em Diário da República em ${LEI_VERIFICADA_EM}. Alterações legislativas posteriores a essa data não estão refletidas.`;
