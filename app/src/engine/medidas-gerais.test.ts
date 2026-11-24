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

describe('D — Instalações técnicas (arts. 69.º a 107.º)', () => {
  it('art. 72.º: fonte central nos edifícios com UT da 3.ª/4.ª cat.; nas 1.ª/2.ª conforme a resposta', () => {
    expect(med(U(3), 3, 'a) Fontes centrais').estado).toBe('aplica');
    expect(med(U(3), 2, 'a) Fontes centrais').estado).toBe('verificar');
    expect(med(U(3), 3, 'a) Fontes centrais').exigencia).toContain('15 s');
  });
  it('arts. 70.º, 71.º, 74.º e 75.º: grupos geradores 15 l / 50 l / 500 l; UPS com botoneira', () => {
    const u = U(3); u.factos = { servEletricos: true };
    const e = med(u, 2, 'c) Locais de serviços').exigencia;
    for (const v of ['1000 VAh', '40 kVA', '28 m', '15 l', '50 l', '500 l', 'botoneira']) expect(e).toContain(v);
  });
  it('arts. 76.º e 77.º, quadro XXXIV: 15/30/60 min (1.ª/2.ª) e 30/60/90 min (3.ª/4.ª); botoneiras no posto nas UT II a XII da 3.ª/4.ª', () => {
    expect(med(U(3), 2, 'd) Quadros').exigencia).toContain('cortinas 15 min');
    const g = med(U(3), 3, 'd) Quadros').exigencia;
    expect(g).toContain('cortinas 30 min');
    expect(g).toContain('drenagem 90 min');
    expect(g).toContain('posto de segurança');
    expect(med(U(1), 3, 'd) Quadros').exigencia).not.toContain('art. 76.º n.º 4');
  });
  it('arts. 80.º a 84.º: central térmica > 40 kW; quadros XIV (≤ 70 kW) / XV; > 2000 kW interdito', () => {
    const u = U(3); u.factos = { centralTermica: true };
    const e = med(u, 2, 'a) Centrais térmicas').exigencia;
    for (const v of ['40 kW', '70 kW', '2000 kW', '0,1 m']) expect(e).toContain(v);
  });
  it('arts. 85.º a 87.º: aquecimento autónomo — < 500 pessoas; ≤ 25 kW; sólidos ≤ 200 pessoas', () => {
    const u = U(3); u.factos = { aquecimento: true };
    const e = med(u, 2, 'b) Aparelhagem').exigencia;
    for (const v of ['< 500', '25 kW', '400 W/m²', '1,25 m', '200 pessoas']) expect(e).toContain(v);
  });
  it('arts. 88.º a 91.º: cozinhas > 20 kW isoladas; bares < 4 kW; frio > 70 kW', () => {
    const u = U(7); u.temCozinhaC = true;
    const e = med(u, 2, 'Cozinhas').exigencia;
    for (const v of ['20 kW', '4 kW', '2 m', '70 kW', 'A1']) expect(e).toContain(v);
  });
  it('arts. 92.º e 93.º: condutas A1; coletivas ≤ 5 (7) locais; escape ≥ 0,5 m acima da cobertura, máx. 10 m', () => {
    const u = U(3); u.factos = { combustao: true };
    const e = med(u, 2, 'Condutas e aberturas').exigencia;
    for (const v of ['A1', '≤ 5 locais', '≤ 7', '0,5 m', '10 m']) expect(e).toContain(v);
  });
  it('arts. 94.º a 99.º: 120 °C; 110 °C; 10 000 m³/h; grelha ≤ 10 mm', () => {
    const u = U(3); u.factos = { avac: true };
    const e = med(u, 2, 'Ventilação e condicionamento').exigencia;
    for (const v of ['120 °C', '110 °C', '10 000 m³/h', '10 mm', '200 kW', 'BL-s2, d0']) expect(e).toContain(v);
  });
  it('arts. 101.º a 105.º: ascensor de bombeiros com H > 28 m ou mais de dois pisos abaixo (do edifício)', () => {
    expect(med(U(3), 2, 'b) Ascensor para uso dos bombeiros').estado).toBe('nao');
    expect(med(U(3), 2, 'b) Ascensor para uso dos bombeiros', { altura: 30 }).estado).toBe('aplica');
    expect(med(U(3), 2, 'b) Ascensor para uso dos bombeiros', { pisosAbaixo: 3, pisosAbaixoIndicado: true }).estado).toBe('aplica');
    const e = med(U(3), 2, 'b) Ascensor para uso dos bombeiros', { altura: 30 }).exigencia;
    for (const v of ['630 kg', '1000 kg', '1,1 × 1,4 m', '60 s', '70 °C']) expect(e).toContain(v);
  });
  it('arts. 106.º e 107.º: quadro XXXV (20/100/500 l; 106 dm³); garrafas de GPL até quatro; 40 kW → local C', () => {
    const u = U(3); u.temGas = true;
    const e = med(u, 2, 'Líquidos e gases').exigencia;
    for (const v of ['20 l', '100 l', '500 l', '106 dm³', 'quatro garrafas', '40 kW', '1 %']) expect(e).toContain(v);
  });
});

describe('E — Sinalização, iluminação e alarme (arts. 108.º a 132.º)', () => {
  it('arts. 108.º a 112.º: A ≥ d²/2000; 2,1–3 m; 6 a 30 m; UT I da 1.ª categoria excetuada', () => {
    const e = med(U(3), 2, 'Sinalização de segurança').exigencia;
    for (const v of ['d²/2000', '2,1 m', '3 m', '6 a 30 m', 'ISO 7010', 'número do andar']) expect(e).toContain(v);
    expect(med(U(1), 1, 'Sinalização de segurança').estado).toBe('nao');
  });
  it('arts. 113.º a 115.º: 1 lux; 5 lux a 1 m; 15 min; 5 s / 60 s; blocos permanentes nas UT IV a VI, VIII, X e XI', () => {
    const e = med(U(4), 2, 'Iluminação de emergência').exigencia;
    for (const v of ['1 lux', '5 lux', '15 min', '5 s', '60 s', 'tipo permanente']) expect(e).toContain(v);
    expect(med(U(3), 2, 'Iluminação de emergência').exigencia).not.toContain('tipo permanente nesses pontos');
    expect(med(U(1), 1, 'Iluminação de emergência').estado).toBe('nao');
  });
  it('quadro XXXVI tal como publicado: difusão no exterior só na configuração 2; alerta automático só na 3', () => {
    const c3 = med(U(4), 2, 'Configuração do sistema de alarme').exigencia;
    expect(c3).toContain('alerta automático');
    expect(c3).not.toContain('difusão do alarme no exterior');
    expect(med(U(4), 1, 'Configuração do sistema de alarme').exigencia).toContain('difusão do alarme no exterior');
  });
  it('arts. 117.º a 124.º e 132.º: EN 54; 1,2 m; 5 min; 72 h + 30 min / 12 h + 5 min; 0,8 m / 0,2 m', () => {
    const e = med(U(3), 2, 'Requisitos de funcionamento do SADI').exigencia;
    for (const v of ['EN 54', '1,2 m', '5 min', '72 h vigília + 30 min', '12 h + 5 min', '2,25 m', '0,8 m', '0,2 m']) expect(e).toContain(v);
  });
  it('art. 131.º: locais C e F com configuração 2, no mínimo', () => {
    const u = U(3); u.espacos = [espaco('C')];
    expect(tem(u, 1, 'Alarme em locais de risco C e F')).toBe(true);
    expect(tem(u, 2, 'Alarme em locais de risco C e F')).toBe(false);
  });
});

describe('E — Controlo de fumo (arts. 133.º a 161.º)', () => {
  it('art. 135.º: subsolo com efetivo > 200 num piso ou área > 400 m²; B > 500; C agravado; UT II coberta', () => {
    const u = U(3); u.espacos = [espaco('B', 150, 'Piso -1'), espaco('B', 150, 'Piso -2')]; u.pisosAbaixo = 2; u.indicados = { pisos: true };
    expect(med(u, 2, 'Espaços com controlo de fumo').exigencia).not.toContain('pisos no subsolo (efetivo');
    const v = U(3); v.espacos = [espaco('B', 210, 'Piso -1')]; v.pisosAbaixo = 1; v.indicados = { pisos: true };
    expect(med(v, 2, 'Espaços com controlo de fumo').exigencia).toContain('pisos no subsolo (efetivo');
    expect(med(U(2), 2, 'Espaços com controlo de fumo').exigencia).toContain('UT II');
    const b = U(6); b.espacos = [espaco('B', 501)];
    expect(med(b, 3, 'Espaços com controlo de fumo').exigencia).toContain('efetivo > 500');
  });
  it('art. 135.º n.os 2 a 6: H > 28 m sobrepressão; mais de um piso enterrado por meios ativos', () => {
    expect(med(U(3), 2, 'Espaços com controlo de fumo', { altura: 30 }).exigencia).toContain('sobrepressão');
    const u = U(3); u.pisosAbaixo = 2; u.indicados = { pisos: true };
    expect(med(u, 2, 'Espaços com controlo de fumo').exigencia).toContain('meios ativos');
  });
  it('arts. 136.º a 161.º: valores de dimensionamento', () => {
    const e = med(U(3), 2, 'Características das instalações de controlo').exigencia;
    for (const v of ['EI 15', 'EN 12101-2', '1,8 m', '400 °C', '1600 m²', '60 m', '1 m³/s por 100 m²', '1,5 m³/s', '0,10 m² por UP', '20–80 Pa', '1 m²', '0,25 m²']) expect(e).toContain(v);
    expect(med(U(2), 2, 'Características das instalações de controlo').exigencia).toContain('600 m³/h');
  });
});

describe('E — Meios de intervenção e outros sistemas (arts. 162.º a 192.º)', () => {
  it('art. 163.º n.os 6 e 7: centrais térmicas e tendas', () => {
    const u = U(6); u.factos = { centralTermica: true, tendas: true };
    const e = med(u, 2, 'Extintores portáteis').exigencia;
    expect(e).toContain('100 l de areia');
    expect(e).toContain('50 kg');
  });
  it('arts. 165.º a 167.º: carretéis — 5 m, 3 m, 1,5 m, 1 m de raio e 2 m, 1,5 l/s, K 42', () => {
    const e = med(U(3), 2, 'Rede de incêndio armada').exigencia;
    for (const v of ['5 m', '< 3 m', '1,5 m', '1 m de raio', '1,5 l/s', 'K ≥ 42', 'rede pública admitida']) expect(e).toContain(v);
    expect(med(U(3), 3, 'Rede de incêndio armada').exigencia).not.toContain('rede pública admitida');
  });
  it('arts. 169.º a 171.º: DN 50 storz a 0,8–1,2 m; siamesa a ≤ 14 m; 3 l/s, K 85; central de bombagem local F', () => {
    const e = med(U(3), 3, 'Meios de segunda intervenção').exigencia;
    for (const v of ['DN 50', '0,8–1,2 m', '14 m', '3 l/s', 'K = 85', 'local de risco F']) expect(e).toContain(v);
  });
  it('arts. 172.º a 176.º e quadro XXXVII: II 5/144/12/15/60; III-VIII 5/216/18/15/60; XII 10/260/29/20/90; 68 °C', () => {
    expect(med(U(3), 3, 'Sistema de extinção automática').exigencia).toContain('densidade 5 L/min/m², área de operação 216 m², 18 aspersores em simultâneo, calibre 15 mm, 60 min');
    expect(med(U(12), 3, 'Sistema de extinção automática').exigencia).toContain('densidade 10 L/min/m², área de operação 260 m², 29 aspersores em simultâneo, calibre 20 mm, 90 min');
    expect(med(U(3), 3, 'Sistema de extinção automática').exigencia).toContain('68 °C');
  });
  it('arts. 177.º a 179.º: cortinas de água 10 l/min/m²', () => {
    expect(med(U(2), 2, 'Sistemas de cortina').exigencia).toContain('10 l/min');
    expect(med(U(3), 2, 'Sistemas de cortina').estado).toBe('nao');
  });
  it('arts. 180.º a 183.º: poluição — 50/200 ppm; 1,5 m; 400 m²; 60 min; 300/600 m³/h por veículo', () => {
    const e = med(U(2), 2, 'Controlo de poluição').exigencia;
    for (const v of ['50 ppm', '200 ppm', '1,5 m', '400 m²', '60 min', '300 m³/h', '600 m³/h']) expect(e).toContain(v);
    expect(med(U(3), 2, 'Controlo de poluição').estado).toBe('nao');
  });
  it('arts. 184.º e 185.º: deteção de gás com corte automático e «Atmosfera perigosa»', () => {
    const u = U(3); u.temGas = true;
    expect(med(u, 2, 'Deteção automática de gás').exigencia).toContain('Atmosfera perigosa');
  });
  it('arts. 186.º a 189.º: drenagem só com pisos enterrados; 500 l/min; 2 %; 1 h; UT II 1 ralo por 40 veículos e 0,5 m³/1000 m²', () => {
    expect(med(U(3), 2, 'Drenagem').estado).toBe('nao');
    const p = U(2); p.pisosAbaixo = 1; p.indicados = { pisos: true };
    const e = med(p, 2, 'Drenagem').exigencia;
    for (const v of ['500 l/min', '40 veículos', '2 %', '1 h', '0,5 m³']) expect(e).toContain(v);
  });
  it('art. 190.º: posto de segurança — UT I 3.ª/4.ª; II a XII 2.ª+; 1.ª com locais D; local F na 4.ª', () => {
    expect(med(U(1), 2, 'Posto de segurança').estado).toBe('nao');
    expect(med(U(1), 3, 'Posto de segurança').estado).toBe('aplica');
    expect(med(U(3), 1, 'Posto de segurança').estado).toBe('nao');
    expect(med(U(3), 2, 'Posto de segurança').estado).toBe('aplica');
    const d = U(5); d.espacos = [espaco('D')];
    expect(med(d, 1, 'Posto de segurança').estado).toBe('aplica');
    expect(med(U(3), 4, 'Posto de segurança').exigencia).toContain('local de risco F');
    expect(med(U(1), 4, 'Posto de segurança').exigencia).not.toContain('local de risco F');
  });
  it('arts. 191.º e 192.º: para-raios conforme resposta; sinalização para a aviação só com H > 28 m', () => {
    expect(med(U(3), 2, 'Instalação de para-raios').estado).toBe('verificar');
    expect(tem(U(3), 2, 'Sinalização ótica')).toBe(false);
    expect(tem(U(3), 2, 'Sinalização ótica', { altura: 30 })).toBe(true);
  });
});

describe('F — Autoproteção (RJ-SCIE arts. 20.º a 22.º; RT-SCIE arts. 193.º a 207.º)', () => {
  it('RJ-SCIE art. 22.º n.º 1: UT I das 1.ª e 2.ª categorias excluídas; 3.ª e 4.ª só espaços comuns', () => {
    expect(med(U(1), 2, 'Medidas de autoproteção exigíveis').estado).toBe('nao');
    expect(med(U(1), 3, 'Medidas de autoproteção exigíveis').exigencia).toMatch(/^Apenas espaços comuns/);
  });
  it('quadro XXXIX tal como publicado', () => {
    const lista = (t: UTNum, c: Cat, d = false) => { const u = U(t); if (d) u.espacos = [espaco('D')]; return med(u, c, 'Medidas de autoproteção exigíveis').exigencia; };
    expect(lista(1, 3)).toContain('Procedimentos de prevenção');
    expect(lista(1, 3)).not.toContain('Plano de emergência');
    expect(lista(1, 4)).toContain('Plano de emergência interno');
    expect(lista(2, 2)).toContain('Procedimentos de prevenção');
    expect(lista(2, 2)).toContain('Procedimentos em caso de emergência');
    expect(lista(3, 1)).not.toContain('Ações de sensibilização');
    expect(lista(3, 2)).toContain('Plano de prevenção');
    expect(lista(3, 3)).toContain('Simulacros');
    expect(lista(5, 1)).not.toContain('Plano de prevenção');
    expect(lista(5, 1, true)).toContain('Plano de prevenção');
    expect(lista(5, 2, true)).toContain('Plano de emergência interno');
    expect(lista(5, 2)).not.toContain('Plano de emergência interno');
  });
  it('quadro XXXVIII: RS por utilização-tipo', () => {
    expect(med(U(1), 3, 'Responsável e delegado').exigencia).toContain('administração do condomínio');
    expect(med(U(3), 2, 'Responsável e delegado').exigencia).toContain('entidade exploradora');
  });
  it('quadro XLI: períodos entre simulacros; aviso quando o quadro indica período sem PEI exigido', () => {
    expect(med(U(3), 4, 'Periodicidade dos simulacros').exigencia).toContain('Um ano');
    expect(med(U(3), 3, 'Periodicidade dos simulacros').exigencia).toContain('Dois anos');
    const d = U(5); d.espacos = [espaco('D')];
    expect(med(d, 2, 'Periodicidade dos simulacros').exigencia).toContain('Um ano');
    const m = med(U(3), 2, 'Periodicidade dos simulacros');
    expect(m.estado).toBe('nao');
    expect(m.motivo).toContain('art. 207.º n.º 1');
    expect(med(U(4), 3, 'Periodicidade dos simulacros').exigencia).toContain('início do ano escolar');
  });
  it('arts. 199.º, 200.º, 201.º, 205.º e 206.º', () => {
    const u = U(3); u.espacos = [espaco('C')];
    expect(med(u, 2, 'Instruções de segurança').exigencia).toContain('face interior das portas');
    expect(med(U(3), 3, 'Serviço de segurança').exigencia).toContain('ANEPC');
    expect(med(U(3), 2, 'Registos de segurança').exigencia).toContain('10 anos');
    expect(med(U(3), 3, 'Plantas de emergência').exigencia).toContain('NP 4386');
    expect(med(U(3), 2, 'Formação em SCIE').exigencia).toContain('60 dias');
    expect(med(U(4), 2, 'Formação em SCIE').exigencia).toContain('ano escolar');
    expect(med(U(3), 1, 'Formação em SCIE').estado).toBe('nao');
  });
  it('art. 16.º e quadro XXXIV: elementos incorporados em instalações', () => {
    expect(med(U(3), 2, 'Elementos incorporados').exigencia).toContain('15 min');
    expect(med(U(3), 3, 'Elementos incorporados').exigencia).toContain('90 min');
  });
});

describe('G — Condições específicas (título VIII)', () => {
  const esp = (t: UTNum) => medidas(U(t), 2).filter((m) => m.tema === 'ESP');
  it('um item por artigo em vigor de cada capítulo; revogados excluídos; UT III e IV sem capítulo', () => {
    expect(esp(1).map((m) => m.titulo.slice(0, 9))).toEqual(['Art. 208.', 'Art. 209.', 'Art. 210.', 'Art. 211.', 'Art. 212.', 'Art. 213.']);
    expect(esp(2).some((m) => m.titulo.startsWith('Art. 223.'))).toBe(false); // revogado
    expect(esp(2).some((m) => m.titulo.startsWith('Art. 228.'))).toBe(false); // revogado
    expect(esp(8).some((m) => m.titulo.startsWith('Art. 259.'))).toBe(false); // revogado
    expect(esp(3)).toHaveLength(0);
    expect(esp(4)).toHaveLength(0);
    expect(esp(12)[0].titulo).toMatch(/^Art\. 300\.º/);
    expect(esp(12).at(-1)!.titulo).toMatch(/^Art\. 309\.º/);
  });
  it('texto literal publicado e referência para o texto integral', () => {
    const a = esp(1)[0];
    expect(a.titulo).toBe('Art. 208.º — Localização dos fogos');
    expect(a.exigencia.length).toBeGreaterThan(50);
    expect(a.base).toContain('art. 208.º');
    expect(esp(8).find((m) => m.titulo.startsWith('Art. 265.'))!.exigencia).toContain('EI 90');
  });
  it('UT XII: quadros XLIX (4/8/8/12/16 m), L e LI', () => {
    expect(med(U(12), 1, 'Distâncias entre edifícios').exigencia).toContain('4 m');
    expect(med(U(12), 2, 'Distâncias entre edifícios', { altura: 12 }).exigencia).toContain('12 m');
    expect(med(U(12), 3, 'Distâncias entre edifícios').exigencia).toContain('16 m');
    const u = U(12); u.casoXII = 3;
    expect(med(u, 2, 'Compartimentação corta-fogo da UT XII').exigencia).toMatch(/acima do plano de referência 4\s?800 m²/);
    expect(med(U(12), 3, 'Distâncias máximas nos locais').exigencia).toContain('Impasse ≤ 15 m');
    expect(med(U(12), 1, 'Distâncias máximas nos locais').exigencia).toContain('≤ 80 m');
  });
});
