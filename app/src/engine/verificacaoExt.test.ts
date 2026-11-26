import { describe, expect, it } from 'vitest';
import { parseEficacia, verificarEdificio } from './verificacaoExt';
import { novaUT, novoEdificio } from '../store';
import type { ExtintorInv, PlanoManut } from '../data/types';

const ext = (num: string, x: Partial<ExtintorInv> = {}): ExtintorInv => ({ id: num, num, edificio: 'E', piso: 0, local: 'x', agente: 'po', cap: 6, eficacia: '', fabricante: '', serie: '', registos: [], ...x });
const plano = (exts: ExtintorInv[], conf: Record<string, boolean> = {}): PlanoManut => ({ periodoMeses: 12, empresa: { nome: '', registoAnepc: '', tecnico: '' }, extintores: exts, confirmados: conf });

function edificio() {
  const ed = { ...novoEdificio(1), id: 'E' };
  const u = novaUT(3); u.id = 'U';
  u.pisos = [{ id: 'a', n: 0, nome: 'Piso 0', cota: 0, area: 450 }];
  u.extintores = { combustivelCT: 'gas', locais: [{ id: 'l', nome: 'piso 0', tipo: 'C', alinea: 'c' }] };
  ed.uts.push(u);
  return ed;
}

describe('Eficácia', () => {
  it('lê classes e valores', () => {
    expect(parseEficacia('21 A/113 B/C')).toEqual({ A: 21, B: 113 });
    expect(parseEficacia('75F')).toEqual({ F: 75 });
    expect(parseEficacia('27A 183B C')).toEqual({ A: 27, B: 183 });
  });
});

describe('Verificação completa — art. 163.º e condições específicas', () => {
  it('piso: geral por omissão; cozinha 25F, central a gás (pó ABC 5 A/34 B), manta; 15 m e instalação a confirmar', () => {
    const ed = edificio();
    const { res } = verificarEdificio(ed, plano([ext('EXT-01'), ext('EXT-02')]));
    const piso = res.find((r) => r.tipo === 'piso')!;
    expect(piso).toMatchObject({ estado: 'falta' }); expect(piso.texto).toContain('falta 1');         // 450 m²: 3, existem 2
    expect(res.find((r) => /25F/.test(r.titulo))!.estado).toBe('falta');                                  // nenhum indicado
    expect(res.find((r) => /34 B/.test(r.titulo))!.estado).toBe('falta');
    expect(res.find((r) => /Manta/.test(r.titulo))!.estado).toBe('verificar');
    expect(res.filter((r) => r.tipo === 'manual').map((r) => r.base)).toEqual(['RT-SCIE, art. 163.º n.º 1', 'RT-SCIE, art. 163.º n.º 3']);
  });
  it('extintor atribuído: eficácia em falta → verificar; insuficiente ou agente errado → falta; certo → cumpre', () => {
    const ed = edificio();
    const { res } = verificarEdificio(ed, plano([]));
    const kCoz = res.find((r) => /25F/.test(r.titulo))!.key, kCT = res.find((r) => /34 B/.test(r.titulo))!.key;
    const v = (exts: ExtintorInv[]) => verificarEdificio(ed, plano(exts)).res;
    expect(v([ext('C1', { serve: kCoz, agente: '' })]).find((r) => r.key === kCoz)!.estado).toBe('verificar');
    expect(v([ext('C1', { serve: kCoz, eficacia: '13A 89B' })]).find((r) => r.key === kCoz)!.estado).toBe('falta');
    expect(v([ext('C1', { serve: kCoz, agente: 'agua', eficacia: '13A 75F' })]).find((r) => r.key === kCoz)!.estado).toBe('cumpre');
    const ct = v([ext('T1', { serve: kCT, agente: 'agua', eficacia: '21A 113B' })]).find((r) => r.key === kCT)!;
    expect(ct.estado).toBe('falta'); expect(ct.problemas.join(' ')).toContain('exige pó');
    expect(v([ext('T1', { serve: kCT, eficacia: '27A 183B C' })]).find((r) => r.key === kCT)!.estado).toBe('cumpre');
  });
  it('extintor atribuído a uma exigência própria não conta para o piso', () => {
    const ed = edificio();
    const kCoz = verificarEdificio(ed, plano([])).res.find((r) => /25F/.test(r.titulo))!.key;
    const piso = verificarEdificio(ed, plano([ext('A'), ext('B'), ext('C'), ext('D', { serve: kCoz })])).res.find((r) => r.tipo === 'piso')!;
    expect(piso.exts.map((e) => e.num)).toEqual(['A', 'B', 'C']); expect(piso.estado).toBe('cumpre');
  });
});

describe('Verificação legal — carretéis (RIA)', () => {
  it('compara os carretéis existentes com o mínimo do art. 165.º; carretéis não contam para os extintores do piso', () => {
    const ed = { ...novoEdificio(1), id: 'E' };
    const u = novaUT(3); u.id = 'U';
    u.pisos = [{ id: 'a', n: 0, nome: 'Piso 0', cota: 0, area: 2000 }];
    u.ria = { cat: 2, mangueira: 25, escadas: 2 };
    ed.uts.push(u);
    const car = (n: string) => ext(n, { equip: 'carretel', agente: '', cap: 0 });
    let res = verificarEdificio(ed, plano([car('CAR-01'), ext('EXT-01')])).res;
    const ria = res.find((r) => r.tipo === 'ria')!;
    expect(ria).toMatchObject({ estado: 'falta', qtd: 2 }); expect(ria.texto).toContain('falta 1');
    expect(res.find((r) => r.tipo === 'piso')!.exts.map((e) => e.num)).toEqual(['EXT-01']);
    res = verificarEdificio(ed, plano([car('CAR-01'), car('CAR-02')])).res;
    expect(res.find((r) => r.tipo === 'ria')!.estado).toBe('cumpre');
  });
});
