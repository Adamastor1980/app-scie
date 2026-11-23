import { describe, expect, it } from 'vitest';
import { integracao } from './integrados';
import { novaUT } from '../store';
import type { Espaco } from '../data/types';

const esp = (nome: string, indiceId: string, area: number): Espaco => ({ id: 'e', nome, piso: '', local: 'A', criterio: 'indice', indiceId, area });

describe('Espaços integrados — RJ-SCIE art. 8.º n.º 3', () => {
  it('b) sala de reuniões com mais de 200 pessoas numa UT III passa a UT VI', () => {
    const ut = novaUT(3);
    const r = integracao(esp('Sala de Reuniões', 'reuniao', 420), ut)!; // 0,5 × 420 = 210
    expect(r.integrado).toBe(false);
    expect(r.utPropria).toEqual([6]);
    expect(integracao(esp('Sala de reuniões', 'reuniao', 80), ut)!.integrado).toBe(true); // 40 pessoas
  });
  it('b) o nome prevalece sobre o uso escolhido e aponta o índice certo', () => {
    const r = integracao(esp('Sala de Reuniões', 'sala-escritorio', 1050), novaUT(3))!; // 210 pessoas
    expect(r.integrado).toBe(false);
    expect(r.usoQuadro).toBe('reuniao');
  });
  it('não se aplica ao próprio uso da UT nem às UT I e II', () => {
    expect(integracao(esp('Auditório', 'reuniao', 1000), novaUT(6))).toBeNull();
    expect(integracao(esp('Sala de reuniões', 'reuniao', 1000), novaUT(1))).toBeNull();
  });
  it('c) espaço comercial com mais de 200 m² passa a UT VIII', () => {
    expect(integracao(esp('Loja', 'venda-baixa', 250), novaUT(12))!.integrado).toBe(false);
    expect(integracao(esp('Loja', 'venda-baixa', 100), novaUT(12))!.integrado).toBe(true);
  });
});

describe('Pisos abaixo do plano de referência — obrigatório em todas as UT', async () => {
  const { faltaParaMedidas, pisosAbaixoIndicados } = await import('./calc');
  it('UT III: não conta para a categoria, mas é obrigatório para as medidas', () => {
    const ut = novaUT(3);
    expect(faltaParaMedidas(ut)).toHaveLength(1);
    ut.indicados = { pisos: true };
    expect(faltaParaMedidas(ut)).toHaveLength(0);
  });
  it('0 indicado com espaços no piso -1 é incoerente', () => {
    const ut = novaUT(3);
    ut.indicados = { pisos: true };
    ut.espacos = [esp('Sala de reuniões', 'reuniao', 100)];
    ut.espacos[0].piso = 'Piso -1';
    expect(pisosAbaixoIndicados(ut)).toEqual(['Piso -1']);
    expect(faltaParaMedidas(ut)[0][1]).toMatch(/indicou 0/);
    ut.pisosAbaixo = 1;
    expect(faltaParaMedidas(ut)).toHaveLength(0);
  });
  it('UT ao ar livre não tem pisos', () => {
    const ut = novaUT(6);
    ut.arLivre = true;
    expect(faltaParaMedidas(ut)).toHaveLength(0);
  });
});

describe('Edifício: altura obrigatória e pisos abaixo calculados', async () => {
  const { faltaEdificio, pisosAbaixoEdificio, alturaEdificio } = await import('./calc');
  const { novoEdificio } = await import('../store');
  it('altura por indicar, depois coerente com as UT', () => {
    const ed = novoEdificio(1);
    const a = novaUT(3); a.altura = 9; a.pisosAbaixo = 0;
    const b = novaUT(3); b.altura = 3; b.pisosAbaixo = 1;
    ed.uts = [a, b];
    expect(faltaEdificio(ed)).toHaveLength(1);
    expect(alturaEdificio(ed)).toBe(9); // enquanto não é indicada, usa a maior das UT
    ed.altura = 6; ed.alturaIndicada = true;
    expect(faltaEdificio(ed)[0][1]).toMatch(/menor/);
    ed.altura = 12;
    expect(faltaEdificio(ed)).toHaveLength(0);
    expect(pisosAbaixoEdificio(ed)).toEqual({ n: 1, ut: b });
  });
});

describe('Juntar UT do mesmo tipo (art. 8.º)', async () => {
  const { juntarUT, mesmoTipo } = await import('./juntar');
  const { novoEdificio } = await import('../store');
  const { efetivoUT } = await import('./calc');
  it('soma os espaços e o efetivo numa só UT III', () => {
    const ed = novoEdificio(1);
    const a = novaUT(3); a.altura = 9; a.indicados = { altura: true, pisos: true };
    a.espacos = [{ ...esp('Escritórios', 'sala-escritorio', 515), id: 'a1' }]; // 103
    const b = novaUT(3); b.altura = 9; b.pisosAbaixo = 1; b.indicados = { altura: true, pisos: true };
    b.espacos = [{ ...esp('Sala de reuniões', 'reuniao', 200), id: 'b1', piso: 'Piso -1' }]; // 100
    ed.uts = [a, b];
    expect(mesmoTipo(ed, a)).toEqual([b]);
    juntarUT(a, b);
    expect(a.espacos).toHaveLength(2);
    expect(efetivoUT(a).total).toBe(203);
    expect(a.pisosAbaixo).toBe(1);
    expect(a.indicados).toEqual({ altura: true, pisos: true });
  });
});
