import type { Edificio, UT } from '../data/types';

/** Outras UT do mesmo tipo no mesmo edifício: na lei, o mesmo uso é uma só utilização-tipo (RJ-SCIE, art. 8.º). */
export const mesmoTipo = (ed: Edificio, ut: UT) => ed.uts.filter((u) => u.id !== ut.id && u.tipo === ut.tipo && !!u.arLivre === !!ut.arLivre);

/**
 * Junta a UT «origem» na UT «destino» (mesmo tipo): espaços, compartimentos, pisos, levantamento, verificações e factos.
 * Altura e pisos abaixo: fica o maior; só ficam «indicados» se estavam indicados nas duas.
 */
export function juntarUT(destino: UT, origem: UT) {
  destino.espacos.push(...origem.espacos);
  destino.compartimentos.push(...origem.compartimentos);
  const nomes = new Set(destino.pisos.map((p) => p.nome));
  for (const p of origem.pisos) if (!nomes.has(p.nome)) destino.pisos.push(p);
  destino.levantamento = [...(destino.levantamento ?? []), ...(origem.levantamento ?? [])];
  destino.verificacao = { ...(origem.verificacao ?? {}), ...(destino.verificacao ?? {}) };
  destino.factos = { ...(origem.factos ?? {}), ...(destino.factos ?? {}) };
  destino.altura = Math.max(destino.altura || 0, origem.altura || 0);
  destino.pisosAbaixo = Math.max(destino.pisosAbaixo || 0, origem.pisosAbaixo || 0);
  destino.areaBruta = (destino.areaBruta || 0) + (origem.areaBruta || 0);
  destino.indicados = {
    altura: !!destino.indicados?.altura && !!origem.indicados?.altura,
    pisos: !!destino.indicados?.pisos && !!origem.indicados?.pisos,
  };
  if (origem.observacoes) destino.observacoes = [destino.observacoes, origem.observacoes].filter(Boolean).join('\n');
}
