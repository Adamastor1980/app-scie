import { describe, expect, it } from 'vitest';
import { PASSOS, estadoPercurso } from './percurso';
import { progresso } from './verificacao';
import { contexto, gerarMedidas } from './medidas';
import { novaUT, novoProjeto, novoEspaco } from '../store';

describe('Percurso das MAP', () => {
  it('dez passos, com as medidas exigíveis (quadro XXXIX) antes da verificação no local', () => {
    expect(PASSOS.map((x) => x.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(PASSOS[4].base).toContain('quadro XXXIX');
    expect(PASSOS[5].titulo).toContain('verificação no local');
  });
  it('projeto vazio: passos por fazer; UT do mesmo tipo repetida assinalada', () => {
    const p = novoProjeto();
    expect(estadoPercurso(p)[2].estado).toBe('falta');
    p.edificios[0].uts = [novaUT(3), novaUT(3)];
    expect(estadoPercurso(p)[2].nota).toContain('repetida');
  });
  it('passo 10 não exigível só com UT I das 1.ª e 2.ª categorias (RJ-SCIE, art. 22.º n.º 1)', () => {
    const p = novoProjeto();
    const u = novaUT(1); u.altura = 3; u.indicados = { altura: true, pisos: true };
    p.edificios[0].uts = [u];
    expect(estadoPercurso(p)[10].estado).toBe('na');
    p.edificios[0].uts = [novaUT(3)];
    expect(estadoPercurso(p)[10].estado).toBe('falta');
  });
  it('passos 9 e 10 marcados pelo técnico', () => {
    const p = novoProjeto(); p.edificios[0].uts = [novaUT(3)];
    p.percurso = { entregue: '2026-12-01', submetido: '2026-12-05', refSubmissao: 'P-123' };
    const e = estadoPercurso(p);
    expect(e[9].estado).toBe('feito');
    expect(e[10].nota).toContain('P-123');
  });
});

describe('Estado «Por verificar»', () => {
  it('não conta como verificada e é contado à parte', () => {
    const p = novoProjeto(); const ed = { ...p.edificios[0], altura: 6, alturaIndicada: true };
    const u = novaUT(3); u.espacos = [{ ...novoEspaco(3), area: 50 }]; ed.uts = [u];
    const ms = gerarMedidas({ ...contexto(ed, u), cls: { ...contexto(ed, u).cls, cat: 1 } });
    const a = ms.filter((m) => m.estado !== 'nao');
    u.verificacao = { [a[0].key]: { estado: 'cumpre' }, [a[1].key]: { estado: 'por_verificar', falta: 'certificado' } };
    const g = progresso(u, ms);
    expect(g.marcadas).toBe(1);
    expect(g.porVerificar).toBe(1);
  });
});
