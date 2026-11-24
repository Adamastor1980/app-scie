/**
 * Testes do motor das medidas contra o texto do RT-SCIE (Portaria n.º 135/2020).
 * Cada valor esperado foi lido no artigo/quadro indicado no nome do teste.
 */
import { describe, expect, it } from 'vitest';
import type { Cat, UT, UTNum } from '../data/types';
import { quadroIX, quadroX, quadroXI, quadroXII, saidasMinimas, upMinimas } from '../data/rtscie';
import { contexto, gerarMedidas } from './medidas';
import { novaUT, novoEdificio, novoEspaco } from '../store';

/** medidas de uma UT com a categoria forçada (o cálculo da categoria tem testes próprios) */
function medidas(ut: UT, cat: Cat, ed = { ...novoEdificio(1), altura: 6, alturaIndicada: true }) {
  const e = { ...ed, uts: ed.uts.length ? ed.uts : [ut] };
  const ctx = contexto(e, ut);
  ctx.cls = { ...ctx.cls, cat };
  return gerarMedidas(ctx);
}
const med = (ut: UT, cat: Cat, titulo: string, ed?: Parameters<typeof medidas>[2]) => {
  const m = medidas(ut, cat, ed).find((x) => x.titulo.startsWith(titulo));
  if (!m) throw new Error('medida não gerada: ' + titulo);
  return m;
};
const ut = (t: UTNum) => novaUT(t);

describe('Quadros XXIX e XXX — número mínimo de saídas (art. 54.º)', () => {
  it('coberto: 1 a 50 → 1; 51 a 1 500 → 1 por 500 ou fração + 1; 1 501 a 3 000 → 1 por 500; > 3 000 → mínimo 6', () => {
    expect(saidasMinimas(50).n).toBe(1);
    expect(saidasMinimas(51).n).toBe(2);
    expect(saidasMinimas(500).n).toBe(2);
    expect(saidasMinimas(501).n).toBe(3);
    expect(saidasMinimas(1500).n).toBe(4);
    expect(saidasMinimas(1501).n).toBe(4);
    expect(saidasMinimas(3000).n).toBe(6);
    expect(saidasMinimas(3001).n).toBe(6);
  });
  it('ar livre: 1 a 150 → 1; 151 a 4 500 → 1 por 1 500 + 1; 4 501 a 9 000 → 1 por 1 500; > 9 000 → mínimo 6', () => {
    expect(saidasMinimas(150, true).n).toBe(1);
    expect(saidasMinimas(151, true).n).toBe(2);
    expect(saidasMinimas(4500, true).n).toBe(4);
    expect(saidasMinimas(4501, true).n).toBe(4);
    expect(saidasMinimas(9001, true).n).toBe(6);
  });
});

describe('Quadros XXXI e XXXII — unidades de passagem (art. 56.º)', () => {
  it('coberto: 1 a 50 → 1; 51 a 500 → 1 por 100 + 1; > 500 → 1 por 100', () => {
    expect(upMinimas(50).n).toBe(1);
    expect(upMinimas(51).n).toBe(2);
    expect(upMinimas(500).n).toBe(6);
    expect(upMinimas(501).n).toBe(6);
    expect(upMinimas(1000).n).toBe(10);
  });
  it('ar livre: 1 a 150 → 1; 151 a 1 500 → 1 por 300 + 1; > 1 500 → 1 por 300', () => {
    expect(upMinimas(150, true).n).toBe(1);
    expect(upMinimas(151, true).n).toBe(2);
    expect(upMinimas(1500, true).n).toBe(6);
    expect(upMinimas(1501, true).n).toBe(6);
  });
});

describe('Saídas por espaço — art. 54.º n.º 1 e art. 56.º', () => {
  const comEspaco = (t: UTNum, n: number) => { const u = ut(t); u.espacos = [{ ...novoEspaco(12), nome: 'Sala', piso: 'Piso 0', n }]; return u; };
  it('o quadro XXIX não se aplica às UT I e II', () => {
    expect(med(comEspaco(2, 120), 2, 'Saídas').exigencia).toContain('sem critério do quadro XXIX');
    expect(med(comEspaco(1, 120), 3, 'Saídas').exigencia).toContain('sem critério do quadro XXIX');
    expect(med(comEspaco(3, 120), 2, 'Saídas').exigencia).toContain('mínimo 2 saída(s)');
  });
  it('n.º 2 a): efetivo ≥ 200 em edifício → saídas com 2 UP', () => {
    expect(med(comEspaco(12, 200), 2, 'Saídas').exigencia).toContain('art. 56.º n.º 2 a)');
    expect(med(comEspaco(12, 199), 2, 'Saídas').exigencia).not.toContain('art. 56.º n.º 2 a)');
  });
  it('art. 62.º: portas no sentido da evacuação > 50 pessoas; barras antipânico > 200', () => {
    const e = med(comEspaco(12, 201), 2, 'Saídas').exigencia;
    expect(e).toContain('art. 62.º n.º 1');
    expect(e).toContain('art. 62.º n.º 7 a)');
    expect(med(comEspaco(12, 50), 2, 'Saídas').exigencia).not.toContain('art. 62.º n.º 1');
  });
});

describe('Distâncias a percorrer — art. 57.º e art. 218.º', () => {
  it('UT I da 1.ª categoria: aplica-se o limite de 30 m; só o de 15 m em impasse não se aplica (n.º 2 a))', () => {
    const m = med(ut(1), 1, 'Distâncias máximas a percorrer');
    expect(m.estado).toBe('aplica');
    expect(m.exigencia).toContain('≤ 30 m');
    expect(m.exigencia).toContain('Sem limite de 15 m em impasse');
  });
  it('UT II coberta: 25 m em impasse e 40 m com saídas distintas (art. 218.º n.º 1)', () => {
    const m = med(ut(2), 2, 'Distâncias máximas a percorrer');
    expect(m.exigencia).toContain('≤ 25 m');
    expect(m.exigencia).toContain('≤ 40 m');
  });
  it('outras UT: 15 m em impasse e 30 m com saídas distintas', () => {
    const m = med(ut(3), 2, 'Distâncias máximas a percorrer');
    expect(m.exigencia).toContain('≤ 15 m em impasse');
    expect(m.exigencia).toContain('≤ 30 m');
  });
});

describe('Resistência ao fogo — art. 15.º, quadros IX a XII', () => {
  it('quadro IX: I, III a X → R 30/60/90/120; II, XI e XII → R 60/90/120/180', () => {
    expect([1, 2, 3, 4].map((c) => quadroIX(3, c as Cat).suporte)).toEqual(['R 30', 'R 60', 'R 90', 'R 120']);
    expect([1, 2, 3, 4].map((c) => quadroIX(12, c as Cat).compartimentacao)).toEqual(['REI 60', 'REI 90', 'REI 120', 'REI 180']);
  });
  it('quadros X e XI', () => {
    expect([1, 2, 3, 4].map((c) => quadroX(4, c as Cat))).toEqual([30, 60, 90, 120]);
    expect([1, 2, 3, 4].map((c) => quadroX(2, c as Cat))).toEqual([60, 90, 120, 180]);
    expect([1, 2, 3, 4].map((c) => quadroXI(4, c as Cat))).toEqual(['E 15 C', 'E 30 C', 'EI 45 C', 'CCF']);
    expect([1, 2, 3, 4].map((c) => quadroXI(11, c as Cat))).toEqual(['E 30 C', 'EI 45 C', 'CCF', 'CCF']);
  });
  it('quadro XII: áreas máximas de compartimento por piso', () => {
    expect(quadroXII(3, false).acima).toBe(1600);
    expect(quadroXII(2, false)).toMatchObject({ acima: 6400, abaixo: 3200 });
    expect(quadroXII(4, true).acima).toBe(800);
    expect(quadroXII(11, false)).toMatchObject({ acima: 800, abaixo: 400 });
  });
  const ed1 = (abaixo: number) => ({ ...novoEdificio(1), altura: 0, alturaIndicada: true, pisosAcima: 1, pisosAcimaIndicado: true, pisosAbaixo: abaixo, pisosAbaixoIndicado: true });
  it('n.º 2: um só piso no plano de referência, 2.ª categoria ou superior → R 60 / REI 60', () => {
    expect(med(ut(12), 3, 'Resistência ao fogo dos elementos', ed1(0)).exigencia).toContain('R 60 (apenas suporte) e REI 60');
  });
  it('n.º 4: pode ter pisos abaixo do plano de referência, com a estrutura destes pelo quadro IX', () => {
    const m = med(ut(12), 3, 'Resistência ao fogo dos elementos', ed1(1));
    expect(m.exigencia).toContain('R 60 (apenas suporte)');
    expect(m.exigencia).toContain('R 120 / REI 120');
  });
  it('n.º 6 b): UT II a XII da 1.ª categoria só com um piso no plano de referência → sem exigências', () => {
    expect(med(ut(12), 1, 'Resistência ao fogo dos elementos', ed1(0)).estado).toBe('nao');
    expect(med(ut(12), 1, 'Resistência ao fogo dos elementos', ed1(1)).estado).toBe('aplica');
  });
  it('n.º 6 a): UT I da 1.ª categoria só é isenta se for habitação unifamiliar', () => {
    const u = ut(1);
    expect(med(u, 1, 'Resistência ao fogo dos elementos').estado).toBe('verificar');
    u.factos = { unifamiliar: true };
    expect(med(u, 1, 'Resistência ao fogo dos elementos').estado).toBe('nao');
    u.factos = { unifamiliar: false };
    expect(med(u, 1, 'Resistência ao fogo dos elementos').estado).toBe('aplica');
  });
});

describe('Meios de intervenção — arts. 163.º, 164.º e 168.º', () => {
  it('art. 163.º n.º 1: extintores em todas as UT exceto a UT I das 1.ª e 2.ª categorias', () => {
    expect(med(ut(1), 2, 'Extintores portáteis').estado).toBe('nao');
    expect(med(ut(1), 3, 'Extintores portáteis').estado).toBe('aplica');
    expect(med(ut(3), 1, 'Extintores portáteis').estado).toBe('aplica');
  });
  it('art. 164.º: carretéis — II a VIII, XI e XII da 2.ª cat.; I, IX e X da 3.ª; UT II 1.ª cat. coberta > 500 m²', () => {
    expect(med(ut(3), 1, 'Rede de incêndio armada').estado).toBe('nao');
    expect(med(ut(3), 2, 'Rede de incêndio armada').estado).toBe('aplica');
    expect(med(ut(10), 2, 'Rede de incêndio armada').estado).toBe('nao');
    expect(med(ut(10), 3, 'Rede de incêndio armada').estado).toBe('aplica');
    const p = ut(2); p.areaBruta = 501;
    expect(med(p, 1, 'Rede de incêndio armada').estado).toBe('aplica');
    p.areaBruta = 500;
    expect(med(p, 1, 'Rede de incêndio armada').estado).toBe('nao');
  });
  it('art. 164.º d): locais com mais de 200 pessoas', () => {
    const u = ut(3); u.espacos = [{ ...novoEspaco(12), piso: 'Piso 0', n: 201 }];
    expect(med(u, 1, 'Rede de incêndio armada').estado).toBe('aplica');
  });
  it('art. 168.º: rede seca ou húmida nas UT I e II da 2.ª cat.; húmida na 3.ª ou superior; teatro na 4.ª de IV, V, VI, VIII e XII', () => {
    expect(med(ut(1), 2, 'Meios de segunda intervenção').exigencia).toContain('Rede seca ou húmida');
    expect(med(ut(3), 2, 'Meios de segunda intervenção').estado).toBe('nao');
    expect(med(ut(3), 3, 'Meios de segunda intervenção').exigencia).toContain('Rede húmida');
    expect(med(ut(4), 4, 'Meios de segunda intervenção').exigencia).toContain('tipo teatro');
    expect(med(ut(3), 4, 'Meios de segunda intervenção').exigencia).not.toContain('tipo teatro');
  });
});

describe('Sprinklers — art. 173.º n.º 1', () => {
  it('b) UT II da 3.ª cat. ou superior com pisos abaixo do plano de referência', () => {
    const p = ut(2); p.pisosAbaixo = 1; p.indicados = { pisos: true };
    expect(med(p, 3, 'Sistema de extinção automática').estado).toBe('aplica');
    expect(med(ut(2), 3, 'Sistema de extinção automática').estado).toBe('nao');
  });
  it('c) UT III, VI, VII, VIII e XII da 3.ª cat. ou superior, em edifícios', () => {
    expect(med(ut(3), 3, 'Sistema de extinção automática').estado).toBe('aplica');
    expect(med(ut(3), 2, 'Sistema de extinção automática').estado).toBe('nao');
    expect(med(ut(4), 4, 'Sistema de extinção automática').estado).toBe('nao');
  });
});

describe('Configuração do alarme — arts. 126.º a 130.º', () => {
  const cfg = (u: UT, c: Cat, ed?: Parameters<typeof medidas>[2]) => med(u, c, 'Configuração do sistema de alarme', ed);
  it('art. 126.º: UT I das 1.ª e 2.ª cat. isenta; 3.ª e 4.ª configuração 2', () => {
    expect(cfg(ut(1), 2).estado).toBe('nao');
    expect(cfg(ut(1), 3).exigencia).toContain('Configuração 2');
  });
  it('art. 127.º: UT II coberta → configuração 3', () => {
    expect(cfg(ut(2), 1).exigencia).toContain('Configuração 3');
  });
  it('art. 128.º: III, VIII, IX e X → configuração 1 na 1.ª cat., 3 nas restantes', () => {
    expect(cfg(ut(3), 1).exigencia).toContain('Configuração 1');
    expect(cfg(ut(9), 2).exigencia).toContain('Configuração 3');
  });
  it('art. 129.º: IV a VII, XI e XII → 3; 1.ª cat. só acima do solo → 2; UT VII da 1.ª → 1', () => {
    expect(cfg(ut(4), 2).exigencia).toContain('Configuração 3');
    expect(cfg(ut(4), 1).exigencia).toContain('Configuração 2');
    const b = ut(4); b.pisosAbaixo = 1; b.indicados = { pisos: true };
    expect(cfg(b, 1).exigencia).toContain('Configuração 3');
    expect(cfg(ut(7), 1).exigencia).toContain('Configuração 1');
  });
  it('art. 130.º n.º 3: edifício com UT I e comunicações comuns → outras UT com configuração 2, no mínimo, e difusor na escada', () => {
    const hab = ut(1); const loja = ut(3);
    const ed = { ...novoEdificio(1), altura: 6, alturaIndicada: true, comunicacoesComuns: true, uts: [hab, loja] };
    const m = cfg(loja, 1, ed);
    expect(m.exigencia).toContain('Configuração 2');
    expect(m.exigencia).toContain('art. 130.º n.os 3 e 4');
  });
  it('art. 116.º n.º 2: recintos ao ar livre isentos', () => {
    const r = ut(9); r.arLivre = true;
    expect(cfg(r, 2).estado).toBe('nao');
  });
});
