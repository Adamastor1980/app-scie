import { describe, expect, it } from 'vitest';
import { normalizarPisos, pisosUT } from './calc';
import { contexto, gerarMedidas } from './medidas';
import { novaUT, novoEdificio, novoEspaco } from '../store';

const espaco = (piso: string, n: number) => ({ ...novoEspaco(12), nome: 'Zona', piso, n });

describe('Lista única de pisos da UT', () => {
  it('junta os pisos dos espaços e a tabela de pisos, ligados pelo número', () => {
    const ut = novaUT(12);
    ut.espacos = [espaco('Piso -1', 10), espaco('Piso 0', 10)];
    ut.pisos = [{ id: 'a', nome: 'Cave', cota: -3, area: 500 }]; // nome antigo: liga-se ao piso -1
    const l = pisosUT(ut);
    expect(l.map((p) => p.n)).toEqual([-1, 0]);
    expect(l[0]).toMatchObject({ area: 500, cota: -3, comEspacos: true });
    expect(l[1]).toMatchObject({ area: 0, cota: undefined });
  });
  it('dados antigos: «só técnico» passa para a lista da UT e o piso ganha número', () => {
    const ut = novaUT(12);
    ut.pisos = [{ id: 'a', nome: 'Piso -2', cota: -6, area: 80, tecnico: true }];
    normalizarPisos(ut);
    expect(ut.pisosTecnicos).toEqual([-2]);
    expect(ut.pisos[0]).toMatchObject({ n: -2, nome: 'Piso -2' });
    expect(ut.pisos[0].tecnico).toBeUndefined();
  });
});

describe('Medidas que dependem dos pisos', () => {
  const medidas = (ut: ReturnType<typeof novaUT>) => {
    const ed = { ...novoEdificio(1), altura: 6, alturaIndicada: true, uts: [ut] };
    return gerarMedidas(contexto(ed, ut));
  };
  it('art. 56.º n.º 4 b): > 50 pessoas abaixo do nível de saída → 2 UP, mesmo sem tabela de pisos', () => {
    const ut = novaUT(12);
    ut.espacos = [espaco('Piso -1', 60)];
    const s = medidas(ut).find((m) => m.titulo.startsWith('Saídas'));
    expect(s?.exigencia).toContain('art. 56.º n.º 4 b)');
  });
  it('art. 163.º n.º 2: extintores por piso com a área da tabela (1 por 200 m², mín. 2; 18 L por 500 m²)', () => {
    const ut = novaUT(12);
    ut.espacos = [espaco('Piso 0', 10)];
    ut.pisos = [{ id: 'a', n: 0, nome: 'Piso 0', cota: 0, area: 650 }];
    const ex = medidas(ut).find((m) => m.titulo === 'Extintores portáteis');
    expect(ex?.exigencia).toContain('exigido mín. 4 e 36 L de água');
    expect(ex?.exigencia).toContain('Piso 0: 6 × água 6 L');
  });
});
