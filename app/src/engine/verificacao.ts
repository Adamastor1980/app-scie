import type { UT, Verificacao } from '../data/types';
import type { Medida } from './medidas';
import { SECOES } from './medidas';

export type EstadoSec = 'sim' | 'nao' | 'na' | 'pendente';

/** Prazos para o plano de medidas corretivas: imediato + semestres dos próximos 5 anos */
export function opcoesPrazo(ano = new Date().getFullYear()): string[] {
  const o = ['Imediato'];
  for (let a = ano; a < ano + 5; a++) o.push(`${a} · 1.º S`, `${a} · 2.º S`);
  return o;
}

export const verDe = (ut: UT, m: Medida): Verificacao => ut.verificacao?.[m.key] ?? {};

/** Estado de conformidade de uma secção do anexo IV (para a tabela de análise regulamentar) */
export function estadoSeccao(ut: UT, medidas: Medida[], sec: string): EstadoSec {
  const ms = medidas.filter((m) => m.tema === sec);
  if (!ms.length) return 'na';
  const verificaveis = ms.filter((m) => m.estado !== 'nao');
  if (!verificaveis.length) return 'na';
  const vs = verificaveis.map((m) => verDe(ut, m).estado);
  if (vs.includes('nao_cumpre')) return 'sim';
  if (vs.every((v) => v === 'na')) return 'na';
  if (vs.every((v) => v === 'cumpre' || v === 'na')) return 'nao';
  return 'pendente';
}

export interface Desconformidade {
  letra: string;
  sec: string;
  medida: Medida;
  ver: Verificacao;
}

const letra = (i: number) => {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(97 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

/** Lista ordenada (pela estrutura do anexo IV) das exigências marcadas «não cumpre» */
export function desconformidades(ut: UT, medidas: Medida[]): Desconformidade[] {
  const out: Desconformidade[] = [];
  for (const s of SECOES) {
    for (const m of medidas.filter((x) => x.tema === s.c)) {
      const v = verDe(ut, m);
      if (v.estado === 'nao_cumpre') out.push({ letra: '', sec: s.c, medida: m, ver: v });
    }
  }
  return out.map((d, i) => ({ ...d, letra: letra(i) }));
}

export function progresso(ut: UT, medidas: Medida[]) {
  const verificaveis = medidas.filter((m) => m.estado !== 'nao');
  const marcadas = verificaveis.filter((m) => verDe(ut, m).estado);
  return {
    total: verificaveis.length,
    marcadas: marcadas.length,
    cumpre: marcadas.filter((m) => verDe(ut, m).estado === 'cumpre').length,
    naoCumpre: marcadas.filter((m) => verDe(ut, m).estado === 'nao_cumpre').length,
    na: marcadas.filter((m) => verDe(ut, m).estado === 'na').length,
  };
}
