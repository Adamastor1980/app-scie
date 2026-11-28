import { describe, expect, it } from 'vitest';
import { calcular, faltaLinha, ndDoQuadro2, nivel, nivelNP, painel } from './motor';
import { novaLinha, novaAvaliacao } from './dados';

describe('Quadro 2 — ND pelas três perguntas (as 8 combinações da matriz)', () => {
  const c = (legal: boolean, informacao: boolean, formacao: boolean) => ndDoQuadro2({ legal, informacao, formacao });
  it('MD 10, D 6, M 2, A 1', () => {
    expect(c(false, false, false)).toBe(10); expect(c(false, false, true)).toBe(10);
    expect(c(false, true, false)).toBe(6); expect(c(false, true, true)).toBe(6);
    expect(c(true, false, false)).toBe(2); expect(c(true, true, false)).toBe(2); expect(c(true, false, true)).toBe(2);
    expect(c(true, true, true)).toBe(1);
    expect(ndDoQuadro2({ legal: true })).toBeUndefined();
  });
});

describe('NP, NR e nível de intervenção (Quadros 4, 7 e 8)', () => {
  it('esmeril: ND 6 × NE 4 = NP 24 (MA); × NC 25 = NR 600 → nível I; residual 2 × 3 × 10 = 60 → nível III, redução 90 %', () => {
    const l = { ...novaLinha(), atividade: 'Oficina', perigo: 'Projeção de partículas', risco: 'Lesões oculares', nd: 6, ne: 4, nc: 25, nd2: 2, ne2: 3, nc2: 10 };
    const r = calcular(l);
    expect(r).toMatchObject({ np: 24, nr: 600, np2: 6, nr2: 60, aceitavelCalc: true });
    expect(r.nivel!.n).toBe('I'); expect(r.nivel2!.n).toBe('III'); expect(r.reducao).toBeCloseTo(0.9);
    expect(nivelNP(24)!.sigla).toBe('MA');
  });
  it('limiares: 600 I, 500 II, 150 II, 120 III, 40 III, 20 IV', () => {
    expect([600, 500, 150, 120, 40, 20].map((v) => nivel(v)!.n)).toEqual(['I', 'II', 'II', 'III', 'III', 'IV']);
  });
});

describe('ND «Aceitável» sem valor (NTP 330, aulas — Quadros 1 e 2)', () => {
  it('não se calcula NP nem NR: risco controlado; NE e NC dispensáveis; não exige medidas', () => {
    const l = { ...novaLinha(), atividade: 'A', perigo: 'P', risco: 'R', nd: 1, ne: 4, nc: 100 };
    const r = calcular(l);
    expect(r).toMatchObject({ np: undefined, nr: undefined, nivel: undefined, controlado: true });
    expect(faltaLinha({ ...l, ne: undefined, nc: undefined }, 'light')).toEqual([]);
  });
  it('residual aceitável: controlado, aceitável e redução total', () => {
    const r = calcular({ ...novaLinha(), nd: 6, ne: 4, nc: 25, nd2: 1 });
    expect(r).toMatchObject({ controlado2: true, aceitavelCalc: true, nr2: undefined, reducao: 1 });
  });
});

describe('Obrigatórios e painel', () => {
  it('nível I ou II sem medidas: falta (art. 15.º n.º 3)', () => {
    const l = { ...novaLinha(), atividade: 'A', perigo: 'P', risco: 'R', nd: 6, ne: 4, nc: 25 };
    expect(faltaLinha(l, 'light').map((f) => f[0])).toEqual(['Medidas a implementar']);
    expect(faltaLinha(l, 'completa').map((f) => f[0])).toContain('Área / setor');
  });
  it('painel: avaliados, críticos e distribuição', () => {
    const a = novaAvaliacao('completa');
    a.riscos = [{ ...novaLinha(), nd: 6, ne: 4, nc: 25 }, { ...novaLinha(), nd: 2, ne: 1, nc: 10 }];
    const p = painel(a);
    expect(p).toMatchObject({ avaliados: 2, criticos: 1 }); expect(p.distInicial).toEqual([1, 0, 0, 1]);
  });
});
