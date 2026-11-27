import { describe, expect, it } from 'vitest';
import { epocaNatal } from './MensagemEpoca';

describe('Mensagem de Natal: só de 25 de novembro a 6 de janeiro', () => {
  it('datas', () => {
    expect(epocaNatal(new Date(2026, 10, 24))).toBe(false);
    expect(epocaNatal(new Date(2026, 10, 27))).toBe(true);
    expect(epocaNatal(new Date(2026, 11, 1))).toBe(true);
    expect(epocaNatal(new Date(2026, 11, 25))).toBe(true);
    expect(epocaNatal(new Date(2027, 0, 6))).toBe(true);
    expect(epocaNatal(new Date(2027, 0, 7))).toBe(false);
  });
});
