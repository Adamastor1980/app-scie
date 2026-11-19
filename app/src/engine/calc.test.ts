import { describe, expect, it } from 'vitest';
import { novaUT } from '../store';
import { cargaCompartimento, cargaUT, classificar, efetivoEspaco, efetivoUT, raiCompartimento } from './calc';
import { saidasMinimas, upMinimas, quadroXXXIX, quadroXLI } from '../data/rtscie';
import { QUADRO_II, QUADRO_I_HI } from '../data/despacho';
import type { Compartimento, Espaco, UTNum } from '../data/types';
import { contexto, gerarMedidas } from './medidas';
import { novoEdificio } from '../store';

const esp = (o: Partial<Espaco>): Espaco => ({ id: Math.random().toString(), nome: 'x', piso: 'P0', local: 'A', criterio: 'indice', ...o });

describe('Efetivo — art. 51.º RT-SCIE', () => {
  it('índice × área arredonda ao inteiro superior', () => {
    expect(efetivoEspaco(esp({ indiceId: 'sala-escritorio', area: 101 })).valor).toBe(21); // 20,2 → 21
    expect(efetivoEspaco(esp({ indiceId: 'sala-escritorio', area: 100 })).valor).toBe(20);
    expect(efetivoEspaco(esp({ indiceId: 'gab-escritorio', area: 0.35 * 100 })).valor).toBe(4); // 3,5 → 4
  });
  it('acamados 3,2 × n', () => expect(efetivoEspaco(esp({ criterio: 'acamados', n: 10 })).valor).toBe(32));
  it('tipologia Tn = 2(n+1)', () => expect(efetivoEspaco(esp({ criterio: 'tipologia', tipologia: 2, n: 3 })).valor).toBe(18));
  it('declarado com mínimo 0,03 p/m²', () => {
    expect(efetivoEspaco(esp({ criterio: 'declarado', n: 5, area: 1000 })).valor).toBe(30);
    expect(efetivoEspaco(esp({ criterio: 'declarado', n: 50, area: 1000 })).valor).toBe(50);
  });
  it('quadro XXVIII', () => {
    expect(efetivoEspaco(esp({ criterio: 'comprimento', comprimento: 10.2, comprimentoTipo: 'sentados' })).valor).toBe(21);
    expect(efetivoEspaco(esp({ criterio: 'comprimento', comprimento: 10, comprimentoTipo: 'pe' })).valor).toBe(50);
  });
  it('fator 1,3 só na evacuação', () => {
    const c = efetivoEspaco(esp({ criterio: 'lugares', n: 20, mobilidadeReduzida: true }));
    expect(c.valor).toBe(20);
    expect(c.evacuacao).toBe(26);
  });
  it('art. 51.º n.º 9 exclui não simultâneos', () => {
    const u = novaUT(3);
    u.espacos = [esp({ criterio: 'lugares', n: 30 }), esp({ criterio: 'lugares', n: 30, naoSimultaneo: true })];
    expect(efetivoUT(u).total).toBe(30);
  });
});

describe('Categoria de risco — anexo III RJ-SCIE', () => {
  const ut = (t: UTNum, o: Record<string, unknown> = {}) => Object.assign(novaUT(t), o);
  const comEfetivo = (t: UTNum, n: number, o: Record<string, unknown> = {}) => ut(t, { usarEfetivoManual: true, efetivoManual: n, ...o });

  it('UT I — limites de altura e pisos', () => {
    expect(classificar(ut(1, { altura: 9, pisosAbaixo: 1 })).cat).toBe(1);
    expect(classificar(ut(1, { altura: 9.01, pisosAbaixo: 1 })).cat).toBe(2);
    expect(classificar(ut(1, { altura: 9, pisosAbaixo: 2 })).cat).toBe(2);
    expect(classificar(ut(1, { altura: 50, pisosAbaixo: 0 })).cat).toBe(3);
    expect(classificar(ut(1, { altura: 51, pisosAbaixo: 0 })).cat).toBe(4);
  });
  it('UT II — ao ar livre sempre 1.ª; área bruta', () => {
    expect(classificar(ut(2, { arLivre: true, areaBruta: 100000 })).cat).toBe(1);
    expect(classificar(ut(2, { areaBruta: 3200 })).cat).toBe(1);
    expect(classificar(ut(2, { areaBruta: 3201 })).cat).toBe(2);
    expect(classificar(ut(2, { areaBruta: 32001 })).cat).toBe(4);
  });
  it('UT III — efetivo', () => {
    expect(classificar(comEfetivo(3, 100)).cat).toBe(1);
    expect(classificar(comEfetivo(3, 101)).cat).toBe(2);
    expect(classificar(comEfetivo(3, 5001)).cat).toBe(4);
  });
  it('UT IV sem D/E: +50 % nos limites das 2.ª e 3.ª', () => {
    expect(classificar(comEfetivo(4, 700)).cat).toBe(2); // ≤ 750
    expect(classificar(comEfetivo(4, 751)).cat).toBe(3);
    expect(classificar(comEfetivo(4, 2250)).cat).toBe(3);
    expect(classificar(comEfetivo(4, 2251)).cat).toBe(4);
  });
  it('UT V — efetivo em D e saída independente', () => {
    const u = ut(5, { espacos: [esp({ local: 'D', criterio: 'lugares', n: 20 })] });
    expect(classificar(u).cat).toBe(2); // sem saída independente
    u.saidaIndependenteD = true;
    expect(classificar(u).cat).toBe(1);
    u.espacos = [esp({ local: 'D', criterio: 'lugares', n: 26 })];
    expect(classificar(u).cat).toBe(2);
  });
  it('UT IV — altura 9 m é limite da 1.ª e da 2.ª', () => {
    expect(classificar(comEfetivo(4, 50, { altura: 9.5 })).cat).toBe(3);
  });
  it('UT VI ao ar livre', () => {
    expect(classificar(comEfetivo(6, 1000, { arLivre: true })).cat).toBe(1);
    expect(classificar(comEfetivo(6, 15001, { arLivre: true })).cat).toBe(3);
  });
  it('UT VIII pisos abaixo', () => {
    expect(classificar(comEfetivo(8, 50, { pisosAbaixo: 1 })).cat).toBe(2);
    expect(classificar(comEfetivo(8, 50, { pisosAbaixo: 3 })).cat).toBe(4);
  });
  it('UT XII — densidade e armazém ×10', () => {
    const c: Compartimento = { id: 'c', nome: 'c', area: 100, metodo: 'probabilistico', itens: [], atividades: [{ id: 'z', nome: 'z', qs: 600, area: 100, ci: 1, rai: 1 }], armazens: [], regraRai: true };
    const u = ut(12, { compartimentos: [c] });
    expect(cargaUT(u).q).toBe(600);
    expect(classificar(u).cat).toBe(2);
    u.exclusivoArmazem = true;
    expect(classificar(u).cat).toBe(1);
    u.exclusivoArmazem = false;
    u.arLivre = true;
    expect(classificar(u).cat).toBe(1);
  });
});

describe('Carga de incêndio — Despacho 2074/2009 (red. 8954/2020)', () => {
  it('determinístico Σ Mi Hi Ci Rai / S', () => {
    const c: Compartimento = { id: 'c', nome: 'c', area: 50, metodo: 'deterministico', atividades: [], armazens: [], regraRai: true,
      itens: [{ id: '1', produto: 'Madeira', hi: 16.7, massa: 1000, ci: 1, rai: 1.5 }, { id: '2', produto: 'Gasóleo', hi: 42, massa: 100, ci: 1.3, rai: 1.5 }] };
    const r = cargaCompartimento(c);
    expect(r.Qs).toBeCloseTo(1000 * 16.7 * 1.5 + 100 * 42 * 1.3 * 1.5, 6);
    expect(r.qs).toBeCloseTo(r.Qs / 50, 6);
  });
  it('probabilístico armazenamento qvi hi Si Ci Rai', () => {
    const c: Compartimento = { id: 'c', nome: 'c', area: 200, metodo: 'probabilistico', itens: [], atividades: [], regraRai: false,
      armazens: [{ id: '1', nome: 'a', qv: 1000, altura: 3, area: 100, ci: 1, rai: 2 }] };
    expect(cargaCompartimento(c).qs).toBe(3000);
  });
  it('n.º 7.º, 3 — Rai da atividade de maior risco se ≥ 10 % da área', () => {
    const c: Compartimento = { id: 'c', nome: 'c', area: 100, metodo: 'probabilistico', itens: [], armazens: [], regraRai: true,
      atividades: [{ id: '1', nome: 'a', qs: 100, area: 90, ci: 1, rai: 1 }, { id: '2', nome: 'b', qs: 100, area: 10, ci: 1, rai: 2 }] };
    expect(raiCompartimento(c)!.rai).toBe(2);
    c.atividades[1].area = 9;
    c.area = 100;
    expect(raiCompartimento(c)!.rai).toBeCloseTo((90 * 1 + 9 * 2) / 99, 3);
  });
  it('UT: média ponderada pelas áreas dos compartimentos', () => {
    const u = novaUT(12);
    u.compartimentos = [
      { id: 'a', nome: 'a', area: 100, metodo: 'probabilistico', itens: [], armazens: [], regraRai: false, atividades: [{ id: '1', nome: '', qs: 1000, area: 100, ci: 1, rai: 1 }] },
      { id: 'b', nome: 'b', area: 300, metodo: 'probabilistico', itens: [], armazens: [], regraRai: false, atividades: [{ id: '1', nome: '', qs: 200, area: 300, ci: 1, rai: 1 }] },
    ];
    expect(cargaUT(u).q).toBe((1000 * 100 + 200 * 300) / 400);
  });
  it('quadros extraídos completos', () => {
    expect(QUADRO_II.length).toBe(464);
    expect(QUADRO_I_HI.length).toBeGreaterThan(130);
    const leite = QUADRO_II.find((a) => a.a === 'Leite em pó')!;
    expect([leite.qs, leite.rs, leite.qv, leite.rv]).toEqual([200, 'B', 9000, 'A']);
    expect(QUADRO_II.find((a) => a.a === 'Arquivos')).toMatchObject({ qv: 1700, rv: 'A' });
    expect(QUADRO_II.find((a) => a.a === 'Arquivos')!.qs).toBeUndefined();
  });
});

describe('Evacuação — quadros XXIX a XXXII', () => {
  it('saídas', () => {
    expect(saidasMinimas(50).n).toBe(1);
    expect(saidasMinimas(51).n).toBe(2);
    expect(saidasMinimas(501).n).toBe(3);
    expect(saidasMinimas(1500).n).toBe(4);
    expect(saidasMinimas(1501).n).toBe(4);
    expect(saidasMinimas(3001).n).toBe(6);
  });
  it('UP', () => {
    expect(upMinimas(50).n).toBe(1);
    expect(upMinimas(51).n).toBe(2);
    expect(upMinimas(500).n).toBe(6);
    expect(upMinimas(501).n).toBe(6);
    expect(upMinimas(151, true).n).toBe(2);
  });
});

describe('Autoproteção — quadros XXXIX e XLI', () => {
  it('UT I 1.ª/2.ª sem MAP', () => {
    expect(quadroXXXIX(1, 2, false)).toBeNull();
    expect(quadroXXXIX(1, 4, false)).toContain('pei');
  });
  it('UT V 1.ª com D → plano de prevenção', () => {
    expect(quadroXXXIX(5, 1, true)).toContain('planoPrevencao');
    expect(quadroXXXIX(5, 2, true)).toContain('simulacros');
    expect(quadroXLI(5, 2, true)).toBe('Um ano');
  });
  it('UT XII 2.ª sem simulacros exigidos no XXXIX', () => {
    expect(quadroXXXIX(12, 2, false)).not.toContain('simulacros');
  });
});

describe('Medidas', () => {
  it('gera medidas sem erros para todas as UT e categorias', () => {
    for (let t = 1; t <= 12; t++) {
      for (const h of [3, 20, 40, 60]) {
        const ed = novoEdificio(1);
        ed.altura = h;
        const u = novaUT(t as UTNum);
        u.altura = h;
        u.espacos = [esp({ criterio: 'lugares', n: 250, local: 'B' })];
        ed.uts = [u];
        const m = gerarMedidas(contexto(ed, u));
        expect(m.length).toBeGreaterThan(20);
        expect(m.every((x) => x.base && x.exigencia)).toBe(true);
      }
    }
  });
});
