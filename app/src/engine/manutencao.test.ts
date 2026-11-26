import { describe, expect, it } from 'vitest';
import { diasEntre, estadoExt, faltaExt, faltaReg, ordenar, proximoNum, resumoManut, somaMeses } from './manutencao';
import type { ExtintorInv, RegistoManut } from '../data/types';

const reg = (data: string, x: Partial<RegistoManut> = {}): RegistoManut => ({ id: data, data, tipo: 'manutencao', resultado: 'conforme', empresa: 'Firma', registoAnepc: '123', tecnico: 'J. Silva', obs: '', ...x });
const ext = (num: string, x: Partial<ExtintorInv> = {}): ExtintorInv => ({ id: num, num, edificio: 'e1', piso: 0, local: 'Receção', agente: 'po', cap: 6, eficacia: '', fabricante: '', serie: '', registos: [], ...x });

describe('Datas', () => {
  it('soma meses com fim de mês ajustado; dias entre datas', () => {
    expect(somaMeses('2026-03-15', 12)).toBe('2027-03-15');
    expect(somaMeses('2027-01-31', 1)).toBe('2027-02-28');
    expect(somaMeses('2028-02-29', 12)).toBe('2029-02-28');
    expect(diasEntre('2026-11-26', '2026-12-26')).toBe(30);
  });
});

describe('Estado de cada extintor (próxima = última intervenção + período)', () => {
  it('sem registo; em dia; a menos de 60 dias; em atraso; não conforme', () => {
    expect(estadoExt(ext('EXT-01'), 12, '2026-11-26').nivel).toBe('sem');
    const ok = estadoExt(ext('EXT-01', { registos: [reg('2026-06-01')] }), 12, '2026-11-26');
    expect(ok).toMatchObject({ nivel: 'ok', proxima: '2027-06-01' });
    expect(estadoExt(ext('EXT-01', { registos: [reg('2025-12-20')] }), 12, '2026-11-26')).toMatchObject({ nivel: 'breve', dias: 24, texto: 'Faltam 24 dias' });
    expect(estadoExt(ext('EXT-01', { registos: [reg('2025-11-20'), reg('2024-11-20')] }), 12, '2026-11-26')).toMatchObject({ nivel: 'atraso', texto: 'Em atraso há 6 dias' });
    expect(estadoExt(ext('EXT-01', { registos: [reg('2026-10-01', { resultado: 'nao_conforme' })] }), 12, '2026-11-26').naoConforme).toBe(true);
  });
  it('conta a intervenção mais recente, seja qual for a ordem do registo', () => {
    expect(estadoExt(ext('EXT-01', { registos: [reg('2024-01-01'), reg('2026-05-05')] }), 12, '2026-11-26').proxima).toBe('2027-05-05');
  });
});

describe('Obrigatórios, numeração e ordem', () => {
  it('extintor e registo — empresa com registo ANEPC (RJ-SCIE, art. 23.º)', () => {
    expect(faltaExt(ext('EXT-01', { piso: null, local: '', agente: '', cap: 0 })).map((f) => f[0])).toEqual(['Piso', 'Local', 'Agente', 'Capacidade']);
    expect(faltaReg(reg('2026-01-01', { registoAnepc: '', tecnico: '' })).map((f) => f[0])).toEqual(['N.º de registo ANEPC', 'Técnico']);
  });
  it('EXT-NN seguinte e ordem por edifício, piso e n.º', () => {
    expect(proximoNum([])).toBe('EXT-01');
    expect(proximoNum([ext('EXT-02'), ext('EXT-10')])).toBe('EXT-11');
    const l = ordenar([ext('EXT-10', { piso: 1 }), ext('EXT-2', { piso: 1 }), ext('EXT-3', { piso: -1 }), ext('EXT-1', { edificio: 'e2', piso: -1 })], ['e1', 'e2']);
    expect(l.map((e) => e.num)).toEqual(['EXT-3', 'EXT-2', 'EXT-10', 'EXT-1']);
  });
  it('resumo para o painel', () => {
    const r = resumoManut({ periodoMeses: 12, empresa: { nome: '', registoAnepc: '', tecnico: '' }, extintores: [ext('A'), ext('B', { registos: [reg('2025-01-01')] }), ext('C', { registos: [reg('2026-10-01')] })] }, '2026-11-26');
    expect(r).toMatchObject({ total: 3, sem: 1, atraso: 1, ok: 1 });
  });
});
