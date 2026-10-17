import { describe, expect, it } from 'vitest';
import { wins } from './lww';

describe('wins', () => {
  it('aceita a linha ausente localmente', () => {
    const result = wins({ id: 'remote', updatedAt: 10 }, undefined);

    expect(result).toBe(true);
  });

  it('prioriza o updatedAt mais recente', () => {
    const result = wins({ id: 'remote', updatedAt: 11 }, { id: 'local', updatedAt: 10 });

    expect(result).toBe(true);
  });

  it('desempata por id quando updatedAt é igual', () => {
    const result = wins({ id: 'z', updatedAt: 10 }, { id: 'a', updatedAt: 10 });

    expect(result).toBe(true);
  });
});
