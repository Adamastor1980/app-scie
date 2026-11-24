/**
 * Testes do motor das medidas — blocos A a G (todas as medidas), contra o texto do
 * RJ-SCIE (Lei n.º 123/2019) e do RT-SCIE (Portaria n.º 135/2020).
 */
import { describe, expect, it } from 'vitest';
import type { Cat, Edificio, UT, UTNum } from '../data/types';
import { contexto, gerarMedidas } from './medidas';
import { novaUT, novoEdificio, novoEspaco } from '../store';

export function medidas(ut: UT, cat: Cat, ed?: Partial<Edificio>) {
  const e = { ...novoEdificio(1), altura: 6, alturaIndicada: true, ...ed } as Edificio;
  if (!e.uts.length) e.uts = [ut];
  const ctx = contexto(e, ut);
  ctx.cls = { ...ctx.cls, cat };
  return gerarMedidas(ctx);
}
export const med = (ut: UT, cat: Cat, titulo: string, ed?: Partial<Edificio>) => {
  const m = medidas(ut, cat, ed).find((x) => x.titulo.startsWith(titulo));
  if (!m) throw new Error('medida não gerada: ' + titulo);
  return m;
};
export const tem = (ut: UT, cat: Cat, titulo: string, ed?: Partial<Edificio>) => medidas(ut, cat, ed).some((x) => x.titulo.startsWith(titulo));
const U = (t: UTNum) => novaUT(t);
const espaco = (local: string, n = 10, piso = 'Piso 0') => ({ ...novoEspaco(12), nome: 'E', piso, n, local } as UT['espacos'][number]);

describe('A — Enquadramento (RJ-SCIE)', () => {
  it('art. 5.º n.º 1: município na 1.ª categoria, ANEPC nas restantes — pela categoria do edifício', () => {
    expect(med(U(3), 1, 'Entidade competente').exigencia).toContain('Município');
    expect(med(U(3), 2, 'Entidade competente').exigencia).toContain('ANEPC');
    const a = U(3); const b = U(12); b.altura = 0; b.indicados = { altura: true, pisos: true };
    b.compartimentos = [{ id: 'c', nome: 'C', area: 100, metodo: 'deterministico', itens: [{ id: 'i', nome: 'x', M: 1_000_000, H: 17, C: 1 } as never], atividades: [], armazens: [], regraRai: false, Rai: 1 } as never];
    expect(med(a, 1, 'Entidade competente', { uts: [a, b] }).exigencia).toContain('ANEPC');
  });
  it('art. 17.º: ficha de segurança na 1.ª categoria (complementada com peças desenhadas nas UT IV e V); projeto nas restantes', () => {
    expect(med(U(3), 1, 'Peça de SCIE').exigencia).toContain('Ficha de segurança');
    expect(med(U(4), 1, 'Peça de SCIE').exigencia).toContain('peças desenhadas');
    expect(med(U(3), 2, 'Peça de SCIE').exigencia).toContain('Projeto da especialidade');
  });
  it('art. 15.º-A e art. 18.º n.º 3: autor certificado e vistoria com ANEPC nas 2.ª a 4.ª categorias', () => {
    expect(med(U(3), 1, 'Autor do projeto').estado).toBe('nao');
    expect(med(U(3), 2, 'Autor do projeto').estado).toBe('aplica');
    expect(med(U(3), 1, 'Vistoria com representante').estado).toBe('nao');
    expect(med(U(3), 3, 'Vistoria com representante').estado).toBe('aplica');
  });
  it('art. 19.º n.os 4 e 5: prazos 6/5/4/3 anos; exceções da 1.ª categoria (salvo IV e V) e UT I exclusiva da 2.ª', () => {
    expect(med(U(4), 1, 'Inspeções regulares').exigencia).toContain('6 anos');
    expect(med(U(3), 1, 'Inspeções regulares').estado).toBe('nao');
    expect(med(U(5), 1, 'Inspeções regulares').estado).toBe('aplica');
    expect(med(U(1), 2, 'Inspeções regulares').estado).toBe('nao');
    expect(med(U(3), 4, 'Inspeções regulares').exigencia).toContain('3 anos');
  });
  it('RT-SCIE art. 13.º: grau de prontidão do socorro nas 3.ª e 4.ª categorias', () => {
    expect(med(U(3), 2, 'Grau de prontidão').estado).toBe('nao');
    expect(med(U(3), 3, 'Grau de prontidão').estado).toBe('aplica');
  });
});

describe('A — Condições exteriores (RT-SCIE, arts. 4.º a 12.º)', () => {
  it('art. 4.º: H ≤ 9 m — 3,5 m, 4 m, 11 m, 15 %, 130 kN; impasse 7 m salvo 1.ª categoria sem locais D', () => {
    const m = med(U(3), 2, 'Vias de acesso (edifício com altura ≤ 9 m)');
    for (const v of ['≤ 30 m', '3,5 m', '4 m', '11 m', '15 %', '130 kN']) expect(m.exigencia).toContain(v);
    expect(m.exigencia).toContain('7 m');
    expect(med(U(3), 1, 'Vias de acesso (edifício com altura ≤ 9 m)').exigencia).not.toContain('impasse');
  });
  it('art. 5.º: H > 9 m — 6 m (10 m em impasse), 5 m, 13 m, 10 %, 260 kN, faixa de operação 7 × 15 m a 3–10 m', () => {
    const m = med(U(3), 2, 'Vias de acesso (edifício com altura > 9 m)', { altura: 12 });
    for (const v of ['6 m (10 m em impasse)', '5 m', '13 m', '10 %', '260 kN', '20 m', '7 m de largura', '15 m', '3–10 m']) expect(m.exigencia).toContain(v);
    expect(tem(U(3), 2, 'Fachada acessível', { altura: 12 })).toBe(true);
    expect(tem(U(3), 2, 'Fachada acessível')).toBe(false);
  });
  it('art. 4.º n.os 3, 5 e 6 e quadro I: recinto ao ar livre', () => {
    const r = U(9); r.arLivre = true;
    expect(med(r, 1, 'Vias de acesso a recinto').exigencia).toMatch(/^Uma via com 3,5 m/);
    expect(med(r, 2, 'Vias de acesso a recinto').exigencia).toMatch(/^Duas vias.*3,5 m/);
    expect(med(r, 3, 'Vias de acesso a recinto').exigencia).toMatch(/^Duas vias.*7,0 m/);
    expect(med(r, 1, 'Vias de acesso a recinto').exigencia).toContain('130 kN');
  });
  it('art. 6.º: pontos de penetração 1 por 800 m², 1,2 × 0,6 m; > 800 m² em duas fachadas; pano de peito em H ≤ 9 m', () => {
    const u = U(3); u.espacos = [espaco('A')]; u.pisos = [{ id: 'p', n: 0, nome: 'Piso 0', cota: 0, area: 1700 }];
    const m = med(u, 2, 'Pontos de penetração');
    expect(m.exigencia).toContain('mínimo 3 ponto(s)');
    expect(m.exigencia).toContain('1,2 × 0,6 m');
    expect(m.exigencia).toContain('duas fachadas');
    expect(m.exigencia).toContain('0,3 m');
    expect(med(u, 2, 'Pontos de penetração', { altura: 12 }).exigencia).not.toContain('0,3 m');
  });
  it('art. 12.º e quadro VIII: hidrantes a ≤ 30 m; depósito 60 m³; recinto ao ar livre 150 m (1.ª/2.ª) ou 100 m (3.ª/4.ª)', () => {
    const h = med(U(3), 2, 'Hidrantes exteriores').exigencia;
    for (const v of ['≤ 30 m', '60 m³', '20 l/s', '150 kPa', 'máximo de dois']) expect(h).toContain(v);
    expect(med(U(3), 1, 'Hidrantes exteriores').base).toContain('8');
    const r = U(9); r.arLivre = true;
    expect(med(r, 2, 'Hidrantes exteriores (recinto').exigencia).toContain('150 m');
    expect(med(r, 3, 'Hidrantes exteriores (recinto').exigencia).toContain('100 m');
  });
  it('arts. 7.º a 11.º: propagação pelo exterior, não aplicável a recintos ao ar livre', () => {
    expect(med(U(3), 2, 'Limitação da propagação').estado).toBe('aplica');
    const r = U(9); r.arLivre = true;
    expect(med(r, 2, 'Limitação da propagação').estado).toBe('nao');
  });
});

describe('B — Isolamento entre UT e coexistência (art. 17.º)', () => {
  it('n.º 2: só em edifícios com mais de uma UT; quadros X e XI', () => {
    const a = U(3), b = U(4);
    expect(med(a, 2, 'Isolamento entre utilizações').estado).toBe('nao');
    const m = med(a, 2, 'Isolamento entre utilizações', { uts: [a, b] });
    expect(m.estado).toBe('aplica');
    expect(m.exigencia).toContain('EI/REI 60');
    expect(m.exigencia).toContain('E 30 C');
  });
  it('n.º 2 e): UT I da 2.ª cat. ou superior sem comunicações comuns com UT V e VII a XII', () => {
    const h = U(1), l = U(7);
    expect(tem(h, 2, 'Comunicações interiores comuns com a UT I', { uts: [h, l], comunicacoesComuns: true })).toBe(true);
    expect(tem(h, 1, 'Comunicações interiores comuns com a UT I', { uts: [h, l], comunicacoesComuns: true })).toBe(false);
    expect(tem(h, 2, 'Comunicações interiores comuns com a UT I', { uts: [h, U(3)], comunicacoesComuns: true })).toBe(false);
  });
  it('n.º 1: UT XII da 3.ª/4.ª categoria não coexiste com outra UT da 2.ª a 4.ª (exceto II e VIII) — nos dois sentidos', () => {
    const x = U(12); x.altura = 0; x.indicados = { altura: true, pisos: true };
    x.compartimentos = [{ id: 'c', nome: 'C', area: 100, metodo: 'deterministico', itens: [{ id: 'i', nome: 'x', M: 1_000_000, H: 17, C: 1 } as never], atividades: [], armazens: [], regraRai: false, Rai: 1 } as never];
    const o = U(3); o.altura = 30; o.indicados = { altura: true, pisos: true };
    expect(tem(o, 2, 'Coexistência com outras UT', { uts: [o, x] })).toBe(true);
    expect(tem(U(2), 2, 'Coexistência com outras UT', { uts: [U(2), x] })).toBe(false);
  });
});

describe('B — Compartimentação (art. 18.º) e pátios (art. 19.º)', () => {
  it('n.º 7: isolamento EI/REI 30 nas UT I e III a X; 60 nas restantes', () => {
    expect(med(U(3), 2, 'Compartimentação geral').exigencia).toContain('EI/REI 30');
    expect(med(U(11), 2, 'Compartimentação geral').exigencia).toContain('EI/REI 60');
  });
  it('n.º 3: UT I da 1.ª categoria dispensada', () => {
    expect(med(U(1), 1, 'Compartimentação geral').estado).toBe('nao');
  });
  it('n.º 4: três pisos num compartimento só nas UT III, IV, V, VII e VIII de pequena altura', () => {
    expect(med(U(3), 2, 'Compartimentação geral').exigencia).toContain('n.º 4');
    expect(med(U(3), 2, 'Compartimentação geral', { altura: 12 }).exigencia).not.toContain('n.º 4');
    expect(med(U(6), 2, 'Compartimentação geral').exigencia).not.toContain('(n.º 4)');
  });
  it('UT XII: compartimentação pelo quadro L do art. 302.º', () => {
    expect(med(U(12), 2, 'Compartimentação corta-fogo da UT XII').base).toContain('quadro L');
  });
  it('art. 19.º: pátios interiores conforme a resposta', () => {
    const u = U(3);
    expect(med(u, 2, 'Pátios interiores').estado).toBe('verificar');
    u.factos = { patio: true };
    expect(med(u, 2, 'Pátios interiores').exigencia).toContain('√(7H)');
  });
});

describe('B — Locais de risco (arts. 20.º a 24.º; RJ-SCIE, art. 11.º)', () => {
  const comLocal = (l: string) => { const u = U(4); u.espacos = [espaco(l)]; return u; };
  it('quadros XIII a XVIII', () => {
    expect(med(comLocal('B'), 2, 'Envolvente de locais de risco B').exigencia).toContain('EI 30');
    expect(med(comLocal('C'), 2, 'Envolvente de locais de risco C').exigencia).toContain('EI 60');
    expect(med(comLocal('Cag'), 2, 'Envolvente de locais de risco C agravado').exigencia).toContain('EI 90');
    const d = med(comLocal('D'), 2, 'Envolvente de locais de risco D');
    expect(d.exigencia).toContain('EI 60');
    expect(d.exigencia).toContain('400 m²');
    expect(med(comLocal('E'), 2, 'Envolvente de locais de risco E').exigencia).toContain('E 15 C');
    expect(med(comLocal('F'), 2, 'Envolvente de locais de risco F').exigencia).toContain('E 45 C');
    expect(med(comLocal('A'), 2, 'Envolvente de locais de risco D').estado).toBe('nao');
  });
  it('RJ-SCIE art. 11.º: locais B (≤ 6 m abaixo das saídas), C agravado e D/E acima do piso de saída', () => {
    expect(med(comLocal('B'), 2, 'Localização de locais de risco B').exigencia).toContain('6 m');
    expect(med(comLocal('Cag'), 2, 'Localização de locais de risco C agravado').estado).toBe('aplica');
    expect(med(comLocal('E'), 2, 'Localização de locais de risco D e E').estado).toBe('aplica');
  });
});

describe('B — Vias de evacuação e circulações (arts. 25.º a 28.º, 34.º a 37.º, 63.º)', () => {
  it('art. 25.º, quadro XIX: EI 30 / E 15 C (pequena), EI 60 / E 30 C (média ou grande), EI 90 / E 45 C (muito grande)', () => {
    expect(med(U(3), 2, 'Proteção das vias horizontais').exigencia).toContain('paredes EI 30');
    expect(med(U(3), 2, 'Proteção das vias horizontais', { altura: 20 }).exigencia).toContain('paredes EI 60');
    expect(med(U(3), 2, 'Proteção das vias horizontais', { altura: 60 }).exigencia).toContain('paredes EI 90');
  });
  it('art. 26.º, quadros XX e XXI: H > 28 m → câmara corta-fogo do interior e EI 60 C no piso de saída', () => {
    expect(med(U(3), 2, 'Proteção das vias verticais').exigencia).toContain('do interior portas E 30 C');
    const m = med(U(3), 2, 'Proteção das vias verticais', { altura: 30 });
    expect(m.exigencia).toContain('do interior câmara corta-fogo');
    expect(m.exigencia).toContain('EI 60 C');
    expect(med(U(1), 1, 'Proteção das vias verticais').estado).toBe('nao');
  });
  it('art. 27.º, quadro XXII: EI 30 (pequena/média), EI 60 (grande/muito grande)', () => {
    expect(med(U(3), 2, 'Outras circulações verticais').exigencia).toContain('EI 30');
    expect(med(U(3), 2, 'Outras circulações verticais', { altura: 30 }).exigencia).toContain('EI 60');
  });
  it('art. 28.º: elevadores EI/REI 60 e E 30 C com mais de um piso abaixo ou H > 28 m; CCF na UT II abaixo', () => {
    const u = U(3); u.factos = { elevadores: true };
    expect(med(u, 2, 'Caixas dos elevadores').exigencia).toContain('quadro XXII');
    expect(med(u, 2, 'Caixas dos elevadores', { altura: 30 }).exigencia).toContain('EI/REI 60');
    const p = U(2); p.factos = { elevadores: true }; p.pisosAbaixo = 1; p.indicados = { pisos: true };
    expect(med(p, 2, 'Caixas dos elevadores').exigencia).toContain('câmara corta-fogo');
  });
  it('arts. 35.º e 63.º: câmaras corta-fogo exigidas com H > 28 m ou pisos abaixo; 3 m² / 6 m², 1,2 m, 2 m, 1,40 m', () => {
    const m = med(U(3), 2, 'Câmaras corta-fogo', { altura: 30 });
    expect(m.estado).toBe('aplica');
    for (const v of ['3 m²', '6 m²', '1,2 m', '2 m', '1,40 m', 'Manter esta porta fechada']) expect(m.exigencia).toContain(v);
    expect(med(U(3), 2, 'Câmaras corta-fogo').estado).toBe('verificar');
  });
  it('arts. 34.º e 36.º: portas a metade do tempo da parede; UT I e II sem portas normalmente abertas', () => {
    expect(med(U(3), 2, 'Portas resistentes ao fogo').exigencia).toContain('metade');
    expect(med(U(2), 2, 'Portas resistentes ao fogo').exigencia).toContain('não podem estar normalmente abertas');
  });
  it('arts. 14.º e 29.º a 33.º: atravessamentos — ductos > 0,2 m² A1; portas E 30 C (H ≤ 28 m) ou E 60 C', () => {
    expect(med(U(3), 2, 'Atravessamentos').exigencia).toContain('E 30 C');
    expect(med(U(3), 2, 'Atravessamentos', { altura: 30 }).exigencia).toContain('E 60 C');
    expect(med(U(1), 2, 'Atravessamentos').estado).toBe('verificar');
  });
});

describe('C — Reação ao fogo (arts. 38.º a 49.º)', () => {
  it('quadro XXIII por altura do piso: até 9 m C-s3, d1 / Dfl-s2; 9 a 28 m C-s2, d0 / Cfl-s2; > 28 m ou abaixo A2-s1, d0 / Cfl-s1', () => {
    const p = med(U(3), 2, 'Revestimentos de vias horizontais').exigencia;
    expect(p).toContain('C-s3, d1');
    expect(p).not.toContain('A2-s1, d0');
    const g = med(U(3), 2, 'Revestimentos de vias horizontais', { altura: 30 }).exigencia;
    for (const v of ['C-s3, d1', 'C-s2, d0', 'A2-s1, d0']) expect(g).toContain(v);
  });
  it('quadro XXIV: A2-s1, d0 (pequena/média), A1 (grande/muito grande); exteriores B-s3, d0', () => {
    expect(med(U(3), 2, 'Revestimentos de vias verticais').exigencia).toContain('A2-s1, d0');
    expect(med(U(3), 2, 'Revestimentos de vias verticais', { altura: 30 }).exigencia).toContain('paredes e tetos A1');
    expect(med(U(3), 2, 'Revestimentos de vias verticais').exigencia).toContain('B-s3, d0');
  });
  it('quadro XXV: locais A D-s2, d2 / Efl; B A2-s1, d0 / Cfl-s2; C A1 / A1fl; D, E, F A1 / Cfl-s2', () => {
    const u = U(4); u.espacos = [espaco('A'), espaco('B'), espaco('C'), espaco('D')];
    const e = med(u, 2, 'Revestimentos de locais de risco').exigencia;
    for (const v of ['local A: paredes e tetos D-s2, d2, pavimentos Efl', 'local B: paredes e tetos A2-s1, d0, pavimentos Cfl-s2', 'local C: paredes e tetos A1, pavimentos A1fl', 'local D: paredes e tetos A1, pavimentos Cfl-s2']) expect(e).toContain(v);
  });
  it('arts. 42.º a 45.º, 47.º e 49.º', () => {
    const e = med(U(6), 2, 'Tetos falsos').exigencia;
    for (const v of ['C-s2, d0', '25 %', '20 %', 'B-s1, d0', 'reposteiros', 'A1 (art. 42.º)', 'art. 47.º', 'art. 49.º']) expect(e).toContain(v);
    expect(med(U(3), 2, 'Tetos falsos').exigencia).not.toContain('art. 47.º');
  });
  it('art. 46.º: tendas e insufláveis só nas UT VI e IX, conforme a resposta', () => {
    const u = U(6); u.factos = { tendas: true };
    expect(med(u, 2, 'Tendas e estruturas').exigencia).toContain('C-s2, d0');
    expect(tem(U(3), 2, 'Tendas e estruturas')).toBe(false);
  });
});

describe('C — Evacuação (arts. 53.º, 58.º a 68.º)', () => {
  it('art. 53.º: 16/8 cadeiras e 40/20 lugares; +50 % ao ar livre; metade em tendas; coxias transversais na 3.ª/4.ª', () => {
    const s = U(6); s.factos = { lugaresFixos: true };
    expect(med(s, 2, 'Lugares destinados').exigencia).toContain('≤ 16 cadeiras');
    expect(med(s, 3, 'Lugares destinados').exigencia).toContain('uma por 1 000');
    const r = U(9); r.arLivre = true; r.factos = { lugaresFixos: true };
    expect(med(r, 2, 'Lugares destinados').exigencia).toContain('≤ 24 cadeiras');
    const t = U(6); t.factos = { lugaresFixos: true, tendas: true };
    expect(med(t, 2, 'Lugares destinados').exigencia).toContain('≤ 8 cadeiras');
  });
  it('art. 59.º: espaços amplos (UT II sempre; outras > 800 m²) e mesas em locais B', () => {
    expect(med(U(2), 2, 'Evacuação dos locais').exigencia).toContain('art. 59.º n.º 3');
    const u = U(3); u.espacos = [{ ...espaco('B'), area: 900 }];
    const e = med(u, 2, 'Evacuação dos locais').exigencia;
    expect(e).toContain('mais de 800 m²');
    expect(e).toContain('1,5 m');
    expect(med(U(3), 2, 'Evacuação dos locais').exigencia).not.toContain('art. 59.º n.º 3');
  });
  it('art. 62.º: UT I dispensada de abrir no sentido da evacuação (n.º 3); barras antipânico > 200 / > 50', () => {
    expect(med(U(1), 3, 'Características das portas').exigencia).not.toContain('abrir no sentido');
    const e = med(U(3), 2, 'Características das portas').exigencia;
    expect(e).toContain('abrir no sentido da evacuação');
    expect(e).toContain('mais de 200 pessoas');
    expect(e).toContain('3 m');
  });
  it('art. 61.º: 10 m em impasse com locais D/E; 20 m acima de 28 m, abaixo (exceto UT II) ou com locais D; 30 m nos outros', () => {
    expect(med(U(3), 2, 'Distâncias nas vias horizontais').exigencia).toContain('≤ 30 m fora');
    const d = U(5); d.espacos = [espaco('D')];
    const m = med(d, 2, 'Distâncias nas vias horizontais').exigencia;
    expect(m).toContain('10 m em impasse');
    expect(m).toContain('≤ 20 m fora');
    expect(med(U(3), 2, 'Distâncias nas vias horizontais', { altura: 30 }).exigencia).toContain('≤ 20 m fora');
    const p = U(2); p.pisosAbaixo = 1; p.indicados = { pisos: true };
    expect(med(p, 2, 'Distâncias nas vias horizontais').exigencia).toContain('≤ 30 m fora');
  });
  it('art. 64.º: 1 UP por 70 (maior soma de dois pisos consecutivos), mín. 2 UP com H > 28 m; não nas UT I e II', () => {
    const u = U(3); u.espacos = [{ ...espaco('B', 100, 'Piso 1') }, { ...espaco('B', 50, 'Piso 2') }];
    expect(med(u, 2, 'Vias verticais de evacuação').exigencia).toContain('150 → 3 UP');
    expect(med(U(3), 2, 'Vias verticais de evacuação', { altura: 30 }).exigencia).toContain('Pelo menos duas vias');
    expect(med(U(1), 3, 'Vias verticais de evacuação').exigencia).not.toContain('Largura útil ≥ 1 UP');
  });
  it('arts. 65.º a 67.º: escadas 3 a 25 degraus; rampas ≤ 10 % (6 %); guardas 1,0 / 1,2 m', () => {
    const e = med(U(3), 2, 'Escadas e rampas').exigencia;
    for (const v of ['3 a 25 degraus', '≤ 10 %', '≤ 6 %', '50 mm', '0,28 m', '70 %']) expect(e).toContain(v);
    const g = U(3); g.factos = { guardas: true };
    const m = med(g, 2, 'Guardas').exigencia;
    for (const v of ['1,0 m', '1,2 m', '0,12 m']) expect(m).toContain(v);
  });
  it('art. 68.º: zonas de refúgio — muito grande altura; 4.ª cat. ou UT III da 3.ª que ocupem pisos acima de 28 m; 0,2 m²/pessoa', () => {
    expect(med(U(4), 2, 'Zonas de refúgio', { altura: 60 }).estado).toBe('aplica');
    const u = U(4); u.altura = 30;
    expect(med(u, 4, 'Zonas de refúgio', { altura: 40 }).estado).toBe('aplica');
    const v = U(4); v.altura = 10;
    expect(med(v, 4, 'Zonas de refúgio', { altura: 40 }).estado).toBe('nao');
    expect(med(U(4), 4, 'Zonas de refúgio', { altura: 60 }).exigencia).toContain('0,2 m²');
  });
});
