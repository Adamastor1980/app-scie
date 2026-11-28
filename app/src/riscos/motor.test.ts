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
  it('exemplo da matriz — esmeril: ND 6 × NE 4 = NP 24 (MA); × NC 25 = NR 600 → nível I; residual 1 × 3 × 25 = 75 → nível III, redução 87,5 %', () => {
    const l = { ...novaLinha(), atividade: 'Oficina', perigo: 'Projeção de partículas', risco: 'Lesões oculares', nd: 6, ne: 4, nc: 25, nd2: 1, ne2: 3, nc2: 25 };
    const r = calcular(l);
    expect(r).toMatchObject({ np: 24, nr: 600, np2: 3, nr2: 75, aceitavelCalc: true });
    expect(r.nivel!.n).toBe('I'); expect(r.nivel2!.n).toBe('III'); expect(r.reducao).toBeCloseTo(0.875);
    expect(nivelNP(24)!.sigla).toBe('MA');
  });
  it('limiares: 600 I, 500 II, 150 II, 120 III, 40 III, 20 IV', () => {
    expect([600, 500, 150, 120, 40, 20].map((v) => nivel(v)!.n)).toEqual(['I', 'II', 'II', 'III', 'III', 'IV']);
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
