import { describe, expect, it } from 'vitest';
import { PLACA, areaPlaca, faltaPiso, placasPiso, totaisSinal } from './sinaletica';
import type { SinalPiso } from '../data/types';

const sp = (x: Partial<SinalPiso> = {}): SinalPiso => ({ id: 's', edificio: 'e', piso: 0, dist: 20, saidas: 2, corredores: [], mudancas: 0, escadas: 0, extintores: 0, carreteis: 0, botoes: 0, outros: [], ...x });

describe('Art. 109.º — A ≥ d²/2000, d entre 6 e 50 m', () => {
  it('20 m → 0,2 m² (quadrada ≥ 448 mm); abaixo de 6 m conta 6; acima de 50 m conta 50', () => {
    expect(areaPlaca(20)).toMatchObject({ A: 0.2, cm2: 2000, quadrada: 448 });
    expect(areaPlaca(3)).toMatchObject({ d: 6, limitada: true });
    expect(areaPlaca(80).d).toBe(50);
    const r = areaPlaca(10).retangular; expect(r[0] * r[1] / 1e6).toBeGreaterThanOrEqual(0.05);
  });
});

describe('Art. 112.º — placas mínimas por piso', () => {
  it('saídas; vias de 45 m e 25 m → 2 + 1 de sentido; mudanças; escadas (acesso + intermédio); extintores, carretéis, botões', () => {
    const r = placasPiso(sp({ corredores: [{ id: 'a', nome: 'A', comp: 45 }, { id: 'b', nome: 'B', comp: 25 }], mudancas: 2, escadas: 1, extintores: 3, carreteis: 1, botoes: 2 }));
    const q = (t: string) => r.find((i) => i.tipo === t)?.qtd;
    expect(q(PLACA.saida)).toBe(2); expect(q(PLACA.sentido)).toBe(3); expect(q(PLACA.mudanca)).toBe(2);
    expect(q(PLACA.escAcesso)).toBe(1); expect(q(PLACA.escInter)).toBe(1);
    expect(q(PLACA.extintor)).toBe(3); expect(r.find((i) => i.tipo === PLACA.extintor)!.base).toContain('163.º n.º 3');
    expect(q(PLACA.carretel)).toBe(1); expect(q(PLACA.botao)).toBe(2);
  });
  it('obrigatórios: piso, distância, saída ou escada, comprimento das vias', () => {
    expect(faltaPiso(sp({ piso: null, dist: undefined, saidas: 0, corredores: [{ id: 'a', nome: '', comp: 0 }] })).map((f) => f[0])).toEqual(['Piso', 'Distância de visão', 'Saídas ou escadas', 'Comprimento da via 1']);
  });
  it('totais de todos os pisos', () => {
    const t = totaisSinal({ aplic: 'exigida', pisos: [sp({ extintores: 2 }), sp({ id: 't', piso: 1, extintores: 1 })] });
    expect(t.itens.find((i) => i.tipo === PLACA.extintor)!.qtd).toBe(3); expect(t.total).toBe(7);
  });
});
