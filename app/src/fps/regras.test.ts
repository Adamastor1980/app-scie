import { describe, expect, it } from 'vitest';
import { comunicacaoPrevia, enquadramento, faltaFPS } from './regras';
import { novaFPS } from './dados';

describe('Comunicação prévia (art. 15.º n.º 1)', () => {
  it('> 30 dias e > 20 trabalhadores; ou > 500 dias de trabalho', () => {
    expect(comunicacaoPrevia({ duracaoDias: 31, maxSimultaneos: 21 })).toBe(true);
    expect(comunicacaoPrevia({ duracaoDias: 30, maxSimultaneos: 21, diasTrabalho: 450 })).toBe(false);
    expect(comunicacaoPrevia({ duracaoDias: 30, maxSimultaneos: 21 })).toBe(true); // sem a soma real, estima-se 30 × 21 = 630 > 500
    expect(comunicacaoPrevia({ duracaoDias: 100, maxSimultaneos: 6 })).toBe(true); // 600 dias de trabalho (estimativa)
    expect(comunicacaoPrevia({ duracaoDias: 100, maxSimultaneos: 6, diasTrabalho: 400 })).toBe(false);
  });
});

describe('PSS ou FPS (arts. 5.º n.º 4 e 14.º n.º 1)', () => {
  const base = () => ({ ...novaFPS(), tipoTrabalho: ['c'] });
  it('caso Greenvolt: manutenção sem projeto, 3 dias, 6 trabalhadores, queda em altura → FPS', () => {
    expect(enquadramento({ ...base(), sujeitaProjeto: false, duracaoDias: 3, maxSimultaneos: 6, riscosEspeciais: ['a'] }).estado).toBe('fps');
  });
  it('sujeita a projeto com risco especial → PSS', () => {
    expect(enquadramento({ ...base(), sujeitaProjeto: true, riscosEspeciais: ['a'] }).estado).toBe('pss');
  });
  it('sujeita a projeto, sem riscos especiais mas com comunicação prévia → PSS', () => {
    expect(enquadramento({ ...base(), sujeitaProjeto: true, riscosEspeciais: [], duracaoDias: 60, maxSimultaneos: 25 }).estado).toBe('pss');
  });
  it('sem riscos especiais → nem PSS nem FPS; fora do art. 2.º → não se aplica', () => {
    expect(enquadramento({ ...base(), sujeitaProjeto: false, riscosEspeciais: [] }).estado).toBe('nenhum');
    expect(enquadramento({ ...base(), tipoTrabalho: ['nenhum'] }).estado).toBe('fora');
  });
  it('obrigatórios do art. 14.º n.º 2', () => {
    expect(faltaFPS(novaFPS()).map((x) => x[0])).toContain('Trabalhos e medidas de prevenção');
  });
});
