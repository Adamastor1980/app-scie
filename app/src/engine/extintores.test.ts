import { describe, expect, it } from 'vitest';
import { art307, dimensionarExtintores, exigidosPorArea, litrosEquivalentes, kgCO2, totaisMapa } from './extintores';
import { novaUT, novoEspaco } from '../store';
import type { UTNum } from '../data/types';

const ut = (t: UTNum, areas: number[]) => { const u = novaUT(t); u.pisos = areas.map((a, i) => ({ id: 'p' + i, n: i, nome: `Piso ${i}`, cota: i * 3, area: a })); return u; };

describe('Art. 163.º n.º 2 — critérios por piso (agente padrão = água, anexo I art. 8.º n.º 2)', () => {
  it('b) 1 por 200 m² ou fração, mínimo 2; a) 18 L por 500 m² ou fração', () => {
    expect(exigidosPorArea(100)).toEqual({ minN: 2, litros: 18 });
    expect(exigidosPorArea(450)).toEqual({ minN: 3, litros: 18 });
    expect(exigidosPorArea(500)).toEqual({ minN: 3, litros: 18 });
    expect(exigidosPorArea(501)).toEqual({ minN: 3, litros: 36 });
    expect(exigidosPorArea(620)).toEqual({ minN: 4, litros: 36 });
  });
  it('proposta cumpre os dois critérios: 620 m² com água 6 L → 6 (4 dariam só 24 L)', () => {
    const r = dimensionarExtintores(ut(3, [450, 620]), 2);
    expect(r.pisos.map((p) => p.proposta)).toEqual([3, 6]);
    expect(r.pisos.every((p) => p.cumpre)).toBe(true);
  });
  it('quantidade alterada pelo técnico abaixo do exigido não cumpre', () => {
    const u = ut(3, [620]); u.extintores = { pisos: { '0': { qtd: 4 } } };
    expect(dimensionarExtintores(u, 2).pisos[0].cumpre).toBe(false);
  });
});

describe('Conversões (critério técnico justificado, art. 163.º n.º 2)', () => {
  it('pó: kg = L ÷ 2 (6 L = 3 kg) → 6 kg de pó equivalem a 12 L', () => {
    expect(litrosEquivalentes('po', 3)).toBe(6);
    expect(litrosEquivalentes('po', 6)).toBe(12);
    const u = ut(3, [620]); u.extintores = { pisos: { '0': { agente: 'po', cap: 6 } } };
    expect(dimensionarExtintores(u, 2).pisos[0].proposta).toBe(4); // 36 L → 3 de pó 6 kg, mas mínimo 4
  });
  it('CO₂: kg = L × 0,62; complemento, não entra nos 18 L', () => {
    expect(kgCO2(10)).toBeCloseTo(6.2);
    const u = ut(3, [450]); u.extintores = { co2: [{ id: 'c', local: 'quadro elétrico', kg: 5, qtd: 1 }] };
    const r = dimensionarExtintores(u, 2);
    expect(r.pisos[0].proposta).toBe(3);
    expect(r.totais.some((t) => t.descricao.startsWith('CO₂'))).toBe(true);
  });
});

describe('Aplicabilidade e riscos específicos', () => {
  it('n.º 1: UT I das 1.ª e 2.ª categorias sem exigência geral; arts. 209.º a 211.º mantêm-se', () => {
    const u = ut(1, [300]); u.extintores = { estacionamento: true };
    const r = dimensionarExtintores(u, 2);
    expect(r.geral).toBe(false);
    expect(r.extras[0].base).toContain('211.º');
    expect(dimensionarExtintores(ut(1, [300]), 3).geral).toBe(true);
  });
  it('n.º 8: ao ar livre só locais C', () => {
    const u = ut(9, []); u.arLivre = true; u.espacos = [{ ...novoEspaco(9), nome: 'Bar', local: 'C' }, { ...novoEspaco(9), nome: 'QE', local: 'F' }];
    const r = dimensionarExtintores(u, 2);
    expect(r.geral).toBe(false);
    expect(r.extras).toHaveLength(1);
  });
  it('n.os 4 a 7: locais C/F, cozinha 25F, central térmica (2 por queimador, máx. 4), tendas (1 móvel por 8)', () => {
    const u = ut(6, [1000, 1000]);
    u.espacos = [{ ...novoEspaco(6), nome: 'Cozinha', local: 'C' }];
    u.temCozinhaC = true; u.factos = { centralTermica: true, tendas: true };
    u.extintores = { combustivelCT: 'solido_liquido', queimadores: 3 };
    const r = dimensionarExtintores(u, 2);
    const txt = r.extras.map((e) => e.texto).join(' | ');
    expect(txt).toContain('Local de risco C');
    expect(txt).toContain('25F');
    expect(txt).toContain('4 extintores de eficácia mínima 34 B');
    expect(txt).toContain('2 extintor(es) móvel(eis) de pó ABC de 50 kg'); // 10 portáteis → 2
  });
  it('art. 273.º: gare com tração elétrica só pó; art. 286.º: 2 por setor', () => {
    const g = ut(8, [400]); g.extintores = { gare: 'eletrica', pisos: { '0': { agente: 'agua' } } };
    expect(dimensionarExtintores(g, 2).pisos[0].agente).toBe('po');
    const c = ut(9, []); c.arLivre = true; c.extintores = { setores: 3 };
    expect(dimensionarExtintores(c, 2).extras[0].qtd).toBe(6);
  });
});

describe('Art. 307.º — combustíveis líquidos (UT XII)', () => {
  it('escalões a) a d)', () => {
    expect(art307(40)).toMatchObject({ eficacia: '113 B/C', moveis: 0 });
    expect(art307(80)).toMatchObject({ eficacia: '144 B/C', moveis: 0 });
    expect(art307(150)).toMatchObject({ eficacia: '233 B/C', moveis: 0 });
    expect(art307(500)).toMatchObject({ eficacia: '233 B/C', moveis: 1 });
  });
  it('e) leitura adotada: d) + 1 móvel por cada 1000 l acima de 750 l (800 → 2; 2000 → 3; 3000 → 4)', () => {
    expect(art307(800).moveis).toBe(2);
    expect(art307(2000).moveis).toBe(3);
    expect(art307(3000).moveis).toBe(4);
  });
  it('n.º 2: recipientes metálicos baixam só a eficácia', () => {
    expect(art307(80, true)).toMatchObject({ eficacia: '113 B/C' });
    expect(art307(2000, true).moveis).toBe(3);
  });
});

describe('Locais C e F indicados à mão (RJ-SCIE, art. 10.º n.os 3 e 6)', () => {
  it('sem tipo escolhido: não conta e fica em «Falta preencher»; com tipo: extintor próprio com a alínea', () => {
    const u = ut(3, [200]); u.extintores = { locais: [{ id: 'l', nome: 'piso −1', tipo: 'C' }] };
    let r = dimensionarExtintores(u, 2);
    expect(r.extras).toHaveLength(0);
    expect(r.falta.join(' ')).toContain('tipo do local');
    u.extintores.locais![0].alinea = 'g';
    r = dimensionarExtintores(u, 2);
    expect(r.extras[0].texto).toContain('Arquivo, depósito, armazém ou arrecadação — piso −1');
    expect(r.extras[0].base).toContain('art. 10.º n.º 3 g)');
  });
});

describe('Resumo e localização dos locais C/F', () => {
  it('total = portáteis dos pisos + das situações; móveis à parte; local sem localização em «Falta preencher»', () => {
    const u = ut(3, [620]);
    u.extintores = { pisos: { '0': { agente: 'po', cap: 6 } }, locais: [{ id: 'a', nome: 'piso 0', tipo: 'C', alinea: 'g' }, { id: 'b', nome: '', tipo: 'F', alinea: 'f' }] };
    const r = dimensionarExtintores(u, 2);
    expect(r.resumo).toMatchObject({ pisos: 4, situacoes: 2, moveis: 0 });
    expect(r.falta.join(' ')).toContain('localização do local F');
    const x = ut(12, [500]); x.liquidosInflamaveisL = 2000;
    expect(dimensionarExtintores(x, 2).resumo.moveis).toBe(3);
  });
});

describe('Mapa final — o quê, onde e quantos', () => {
  it('pisos, cozinha (25F + manta, n.º 5), local F com recomendação, central térmica (34 B + areia)', () => {
    const u = ut(3, [300, 200]);
    u.extintores = { combustivelCT: 'solido_liquido', queimadores: 2, locais: [{ id: 'a', nome: 'piso −1', tipo: 'C', alinea: 'c' }, { id: 'b', nome: 'piso 0', tipo: 'F', alinea: 'b' }] };
    const m = dimensionarExtintores(u, 2).mapa;
    expect(m.filter((l) => l.base.startsWith('RT-SCIE, art. 163.º n.os 1 a 3'))).toHaveLength(2);
    const coz = m.find((l) => l.onde.includes('Cozinha'))!;
    expect(coz.oque).toContain('25F'); expect(coz.oque).toContain('manta'); expect(coz.recom).toBeUndefined();
    expect(m.find((l) => l.onde.includes('Centro de gestão'))!.recom).toContain('CO₂');
    expect(m.find((l) => l.oque.includes('34 B'))!.qtd).toBe('4');
    expect(m.some((l) => l.oque.includes('100 l de areia'))).toBe(true);
  });
});

describe('Totais — todos os meios, com a exigência de cada um', () => {
  it('portáteis por tipo (pisos + 25F + 34 B + local F), total; outros meios (manta, areia); complemento CO₂ à parte', () => {
    const u = ut(3, [300, 200]);
    u.extintores = { pisos: { '0': { agente: 'po', cap: 6 }, '1': { agente: 'po', cap: 6 } }, combustivelCT: 'solido_liquido', queimadores: 1, co2: [{ id: 'k', local: 'quadro elétrico', kg: 5, qtd: 1 }],
      locais: [{ id: 'a', nome: 'piso −1', tipo: 'C', alinea: 'c' }, { id: 'b', nome: 'piso 0', tipo: 'F', alinea: 'b' }] };
    const g = totaisMapa(dimensionarExtintores(u, 2).mapa);
    const port = g.find((c) => c.cat === 'portatil')!;
    expect(port.itens.find((i) => i.desc.includes('pó químico ABC 6 kg'))!.qtd).toBe(4);
    expect(port.itens.find((i) => i.desc.includes('25F'))!.base).toContain('n.os 4 e 5');
    expect(port.itens.find((i) => i.desc.includes('34 B'))!.qtd).toBe(2);
    expect(port.total).toBe(4 + 1 + 2 + 1);
    const outros = g.find((c) => c.cat === 'outro')!.itens.map((i) => i.desc).join(' ');
    expect(outros).toContain('Manta ignífuga'); expect(outros).toContain('areia');
    expect(g.find((c) => c.cat === 'complemento')!.total).toBe(1);
    expect(g.map((c) => c.cat)).toEqual(['portatil', 'outro', 'complemento']);
  });
});

describe('Capacidades normalizadas (EN 3) — sem capacidade mínima no RT-SCIE', () => {
  it('por omissão água 6 L; pó 2 kg (= 4 L) em 300 m² → 5 extintores para somar 18 L', () => {
    const u = ut(3, [300]);
    expect(dimensionarExtintores(u, 2).pisos[0]).toMatchObject({ agente: 'agua', cap: 6, proposta: 3 });
    u.extintores = { pisos: { '0': { agente: 'po', cap: 2 } } };
    expect(dimensionarExtintores(u, 2).pisos[0]).toMatchObject({ cap: 2, eqL: 4, proposta: 5, cumpre: true });
  });
});

describe('Art. 163.º n.º 5 — cozinhas e laboratórios a partir da lista de locais C', () => {
  it('c) cozinha: 25F + manta; b) só com «é laboratório»: manta; b) oficina: só extintor', () => {
    const tem = (locais: NonNullable<NonNullable<ReturnType<typeof novaUT>['extintores']>['locais']>) => {
      const u = ut(3, [300]); u.extintores = { locais };
      const r = dimensionarExtintores(u, 2);
      const itens = r.mapa.flatMap((l) => l.itens.map((i) => i.desc)).join(' | ');
      return { manta: /Manta/.test(itens), f25: /25F/.test(itens), n5: r.extras.some((e) => e.base === 'RT-SCIE, art. 163.º n.º 5') };
    };
    expect(tem([{ id: 'a', nome: 'piso 0', tipo: 'C', alinea: 'c' }])).toEqual({ manta: true, f25: true, n5: true });
    expect(tem([{ id: 'a', nome: 'piso 0', tipo: 'C', alinea: 'b' }])).toEqual({ manta: false, f25: false, n5: false });
    expect(tem([{ id: 'a', nome: 'piso 0', tipo: 'C', alinea: 'b', laboratorio: true }])).toEqual({ manta: true, f25: false, n5: true });
  });
});
