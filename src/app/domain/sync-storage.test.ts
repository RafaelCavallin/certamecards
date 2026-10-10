import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStorage } from './local-storage';
import { LAST_SYNC_KEY, parseLastSyncAt, readLastSyncAt, writeLastSyncAt } from './sync-storage';

function throwingStorage(): KeyValueStorage {
  return {
    getItem: () => {
      throw new DOMException('blocked', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('quota', 'QuotaExceededError');
    },
  };
}

describe('parseLastSyncAt', () => {
  it.each([[null], [''], ['abc'], ['-5'], ['0'], ['NaN']])('trata %j como nunca sincronizado', (raw) => {
    expect(parseLastSyncAt(raw)).toBe(0);
  });

  it('lê um instante válido', () => {
    expect(parseLastSyncAt('1790000000000')).toBe(1790000000000);
  });
});

describe('readLastSyncAt', () => {
  it('lê o valor guardado', () => {
    expect(readLastSyncAt({ getItem: () => '1790000000000', setItem: vi.fn() })).toBe(1790000000000);
  });

  it('devolve 0 sem armazenamento', () => {
    expect(readLastSyncAt(null)).toBe(0);
  });

  it('devolve 0 quando getItem lança', () => {
    expect(readLastSyncAt(throwingStorage())).toBe(0);
  });
});

describe('writeLastSyncAt', () => {
  it('grava na chave da última sincronização e devolve true', () => {
    const setItem = vi.fn();

    const saved = writeLastSyncAt({ getItem: () => null, setItem }, 1790000000000);

    expect(saved).toBe(true);
    expect(setItem).toHaveBeenCalledWith(LAST_SYNC_KEY, '1790000000000');
  });

  it('devolve false quando setItem lança', () => {
    expect(writeLastSyncAt(throwingStorage(), 1)).toBe(false);
  });

  it('devolve false sem armazenamento', () => {
    expect(writeLastSyncAt(null, 1)).toBe(false);
  });
});
