import { describe, expect, it } from 'vitest';
import { inspecaoRegularAnos, prazos, INSPECAO_REGULAR } from './autoprotecao';
import { novaAutoprotecao, novaUT, novoEdificio, novoProjeto } from '../store';

describe('Inspeções regulares — art. 19.º RJ-SCIE', () => {
  const ed = novoEdificio(1);
  it('periodicidade máxima por categoria (n.º 4)', () => {
    const ut = novaUT(4);
    expect(inspecaoRegularAnos(ed, ut, 1)).toBe(6);
    expect(inspecaoRegularAnos(ed, ut, 2)).toBe(5);
    expect(inspecaoRegularAnos(ed, ut, 3)).toBe(4);
    expect(inspecaoRegularAnos(ed, ut, 4)).toBe(3);
  });
  it('exceções do n.º 5: 1.ª categoria (exceto IV e V) e UT I exclusiva da 2.ª', () => {
    expect(inspecaoRegularAnos(ed, novaUT(3), 1)).toBeNull();
    expect(inspecaoRegularAnos(ed, novaUT(5), 1)).toBe(6);
    const e1 = { ...novoEdificio(1), uts: [novaUT(1)] };
    expect(inspecaoRegularAnos(e1, e1.uts[0], 2)).toBeNull();
  });
});

describe('Prazos a partir dos registos', () => {
  it('próxima inspeção = última + período; estado ultrapassado', () => {
    const p = novoProjeto();
    const ut = novaUT(4);
    ut.altura = 30; // força categoria elevada
    p.edificios[0].uts = [ut];
    p.autoprotecao = novaAutoprotecao();
    p.autoprotecao.registos.push({ id: 'r', tipo: 'relatorio', tipoAcao: INSPECAO_REGULAR, data: '2015-01-10', uts: [], elemento: '', motivo: '', descricao: '', responsavel: '' });
    const insp = prazos(p, '2026-11-20').find((x) => x.titulo === 'Inspeção regular');
    expect(insp?.ultima).toBe('2015-01-10');
    expect(insp?.estado).toBe('atrasado');
  });
});
