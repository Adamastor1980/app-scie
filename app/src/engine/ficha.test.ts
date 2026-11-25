import { describe, expect, it } from 'vitest';
import { fichaSeguranca } from './ficha';
import { contexto, gerarMedidas } from './medidas';
import { novaUT, novoProjeto, novoEspaco } from '../store';

function projeto(t: Parameters<typeof novaUT>[0], efetivo = 20) {
  const p = novoProjeto();
  p.nome = 'Teste'; p.morada = 'Rua A'; p.cliente = 'Cliente';
  const ed = p.edificios[0];
  Object.assign(ed, { altura: 3, alturaIndicada: true, pisosAcima: 2, pisosAcimaIndicado: true, pisosAbaixo: 0, pisosAbaixoIndicado: true });
  const u = novaUT(t); u.altura = 3; u.indicados = { altura: true, pisos: true };
  u.espacos = [{ ...novoEspaco(t), nome: 'Sala', piso: 'Piso 0', criterio: 'declarado', n: efetivo }];
  u.pisos = [{ id: 'a', n: 0, nome: 'Piso 0', cota: 0, area: 450 }];
  ed.uts = [u];
  return { p, ed, u };
}

describe('Ficha de segurança — dados pelo modelo ANEPC', () => {
  it('UT III da 1.ª categoria: aplicável; valores dos quadros do RT-SCIE', () => {
    const { p, ed, u } = projeto(3);
    const f = fichaSeguranca(p, ed, u);
    expect(f.cat).toBe(1);
    expect(f.aplicavel.ok).toBe(true);
    expect(f.q21.area).toMatch(/450/);
    expect(f.q41.suporte).toBe('R 30');               // quadro IX, 1.ª categoria
    expect(f.q5.linhas[0]).toEqual(['Vias horizontais de evacuação', 'Dfl-s2', 'C-s3, d1']); // quadro XXIII, ≤ 9 m
    expect(f.q8.configuracao).toBe('Configuração 1');  // art. 128.º
    expect(f.q8.extintores).toMatch(/^3 /);           // 450 m² → 3 (1 por 200 m² ou fração)
    expect(f.q6.efTotal).toBe('20');
  });
  it('«Cumpre» sai da verificação: S, N, ?', () => {
    const { p, ed, u } = projeto(3);
    const ms = gerarMedidas(contexto(ed, u)).filter((m) => m.tema === 'VII.1' && m.estado !== 'nao');
    expect(fichaSeguranca(p, ed, u).q8.sinalizacao).toBe('?');
    u.verificacao = Object.fromEntries(ms.map((m) => [m.key, { estado: 'cumpre' as const }]));
    expect(fichaSeguranca(p, ed, u).q8.sinalizacao).toBe('S');
    u.verificacao[ms[0].key] = { estado: 'nao_cumpre', obs: 'placas em falta' };
    const f = fichaSeguranca(p, ed, u);
    expect(f.q8.sinalizacao).toBe('N');
    expect(f.q91.join(' ')).toContain('placas em falta');
  });
  it('2.ª categoria: não aplicável (projeto de especialidade, art. 17.º n.º 1)', () => {
    const { p, ed, u } = projeto(3, 200);
    u.altura = 12;
    const f = fichaSeguranca(p, ed, u);
    expect(f.aplicavel.ok).toBe(false);
    expect(f.aplicavel.motivo).toContain('projeto da especialidade');
  });
  it('UT IV e V: ficha complementada com peças desenhadas (anexo V, art. 2.º n.º 2)', () => {
    const { p, ed, u } = projeto(4);
    expect(fichaSeguranca(p, ed, u).aplicavel.motivo).toContain('peças desenhadas');
  });
});
