import { describe, expect, it } from 'vitest';
import { dimensionarRIA } from './ria';
import { novaUT, novoEspaco } from '../store';
import type { UTNum } from '../data/types';

const ut = (t: UTNum, areas: number[]) => { const u = novaUT(t); u.pisos = areas.map((a, i) => ({ id: 'p' + i, n: i, nome: `Piso ${i}`, cota: i * 3, area: a })); return u; };

describe('Art. 164.º — quando é exigida', () => {
  it('a) UT III da 2.ª categoria; não na 1.ª', () => {
    expect(dimensionarRIA(ut(3, [400]), 2)).toMatchObject({ exigida: true, base: 'RT-SCIE, art. 164.º a)' });
    expect(dimensionarRIA(ut(3, [400]), 1).exigida).toBe(false);
  });
  it('b) UT II da 1.ª categoria com mais de 500 m² cobertos', () => {
    expect(dimensionarRIA(ut(2, [300, 250]), 1).base).toBe('RT-SCIE, art. 164.º b)');
    expect(dimensionarRIA(ut(2, [300, 150]), 1).exigida).toBe(false);
  });
  it('c) UT I só da 3.ª categoria; sala de condomínio > 200 m² (art. 210.º n.º 6 e)); UT IX da 2.ª (art. 286.º)', () => {
    expect(dimensionarRIA(ut(1, [300]), 2).exigida).toBe(false);
    expect(dimensionarRIA(ut(1, [300]), 3).base).toBe('RT-SCIE, art. 164.º c)');
    const u = ut(1, [300]); u.ria = { salaCondominio200: true, mangueira: 25 };
    expect(dimensionarRIA(u, 1)).toMatchObject({ exigida: true, soLocais: true, base: 'RT-SCIE, art. 210.º n.º 6 e)' });
    expect(dimensionarRIA(ut(9, [1000]), 2).exigida).toBe(false);                 // UT IX que não é parque de campismo
    const c9 = ut(9, [1000]); c9.extintores = { setores: 3 };
    expect(dimensionarRIA(c9, 2).base).toBe('RT-SCIE, art. 286.º n.º 1 b)');
  });
  it('d) local com mais de 200 pessoas numa UT que não exige: só esse local', () => {
    const u = ut(3, [400]); u.ria = { mangueira: 25, locais200: { '0': 1 } };
    const r = dimensionarRIA(u, 1);
    expect(r).toMatchObject({ exigida: true, soLocais: true, total: 1 });
  });
  it('UT VIII com tração elétrica: proibido usar água (art. 273.º n.º 1)', () => {
    const u = ut(8, [1000]); u.extintores = { gare: 'eletrica' };
    expect(dimensionarRIA(u, 2).proibida).toBe(true);
  });
});

describe('Disposições específicas e locais > 200 pessoas', () => {
  it('UT VII rural da 2.ª categoria dispensada (art. 257.º)', () => {
    const u = ut(7, [500]); u.turismoRural = true;
    expect(dimensionarRIA(u, 2)).toMatchObject({ exigida: false, base: 'RT-SCIE, art. 257.º' });
  });
  it('local com mais de 200 pessoas detetado pelo efetivo dos espaços (projeto completo)', () => {
    const u = ut(3, [600]); u.espacos = [{ ...novoEspaco(3), piso: 'Piso 0', criterio: 'declarado', n: 250, area: 300 }];
    u.ria = { mangueira: 25 };
    expect(dimensionarRIA(u, 1)).toMatchObject({ exigida: true, soLocais: true, total: 1 });
  });
});

describe('Projeto só de extintores: categoria indicada pelo técnico', () => {
  it('sem categoria calculada: por saber; com local > 200 pessoas: exigida nesse local; com categoria indicada: decide pela categoria', () => {
    const u = ut(3, [600]);
    expect(dimensionarRIA(u).exigida).toBeNull();
    u.ria = { locais200: { '0': 1 }, mangueira: 25 };
    expect(dimensionarRIA(u)).toMatchObject({ exigida: true, soLocais: true });
    u.ria = { cat: 2, mangueira: 25, escadas: 1 };
    const r = dimensionarRIA(u);
    expect(r).toMatchObject({ exigida: true, base: 'RT-SCIE, art. 164.º a)' }); expect(r.notas.join(' ')).toContain('indicada pelo técnico');
  });
});

describe('Arts. 165.º e 167.º — mínimo de bocas e caudal', () => {
  it('mangueira 25 m → alcance 30 m; 2000 m² e 2 escadas → max(cobertura 2000/1800 = 2, 2 escadas) = 2', () => {
    const u = ut(3, [2000, 500]); u.ria = { mangueira: 25, escadas: 2 };
    const r = dimensionarRIA(u, 2);
    expect(r.alcance).toBe(30); expect(r.areaPorBoca).toBe(1800);
    expect(r.pisos.map((p) => p.minimo)).toEqual([2, 2]);
    expect(r.total).toBe(4);
    expect(r).toMatchObject({ simultaneas: 2, caudalBoca: 1.5, caudalTotal: 3, K: 42 });
  });
  it('rede pública com garantias (1.ª/2.ª cat.): 1 l/s e K 64 (art. 167.º n.os 3 e 5); máximo 4 bocas em simultâneo', () => {
    const u = ut(3, [9000, 9000, 9000]); u.ria = { mangueira: 20, escadas: 1, publica: true };
    const r = dimensionarRIA(u, 2);
    expect(r).toMatchObject({ caudalBoca: 1, K: 64, simultaneas: 4, caudalTotal: 4 });
    expect(dimensionarRIA(u, 3)).toMatchObject({ caudalBoca: 1.5, K: 42 }); // 3.ª cat.: não se aplica o n.º 5
  });
  it('faltas: mangueira e escadas', () => {
    const r = dimensionarRIA(ut(3, [400]), 2);
    expect(r.falta.join(' ')).toContain('comprimento da mangueira'); expect(r.falta.join(' ')).toContain('escadas');
  });
});
