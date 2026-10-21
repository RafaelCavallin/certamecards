import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from './local-storage';
import {
  STORE_CREATED_KEY,
  STORE_LOST_KEY,
  dismissStoreLoss,
  ensureStoreMarker,
  pendingStoreLoss,
  recordStoreCreated,
} from './store-marker';

const CREATED_AT = 1_792_330_000_000;
const RECREATED_AT = 1_792_330_496_000;

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
}

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

describe('recordStoreCreated', () => {
  it('TU-P01: no primeiro uso grava o marcador sem registrar perda', () => {
    const storage = memoryStorage();
    recordStoreCreated(storage, CREATED_AT);
    expect(storage.data.get(STORE_CREATED_KEY)).toBe(String(CREATED_AT));
    expect(pendingStoreLoss(storage)).toBeNull();
  });

  it('TU-P02: com marcador anterior registra a perda e renova o marcador', () => {
    const storage = memoryStorage({ [STORE_CREATED_KEY]: String(CREATED_AT) });
    recordStoreCreated(storage, RECREATED_AT);
    expect(pendingStoreLoss(storage)).toBe(RECREATED_AT);
    expect(storage.data.get(STORE_CREATED_KEY)).toBe(String(RECREATED_AT));
  });
});

describe('ensureStoreMarker', () => {
  it('TU-P03: não sobrescreve um marcador existente', () => {
    const storage = memoryStorage({ [STORE_CREATED_KEY]: String(CREATED_AT) });
    ensureStoreMarker(storage, RECREATED_AT);
    expect(storage.data.get(STORE_CREATED_KEY)).toBe(String(CREATED_AT));
  });

  it('TU-P03: sem marcador grava um, sem registrar perda', () => {
    const storage = memoryStorage();
    ensureStoreMarker(storage, CREATED_AT);
    expect(storage.data.get(STORE_CREATED_KEY)).toBe(String(CREATED_AT));
    expect(pendingStoreLoss(storage)).toBeNull();
  });
});

describe('dismissStoreLoss', () => {
  it('TU-P04: depois de dispensar não há perda pendente', () => {
    const storage = memoryStorage({ [STORE_LOST_KEY]: String(RECREATED_AT) });
    dismissStoreLoss(storage);
    expect(pendingStoreLoss(storage)).toBeNull();
  });
});

describe('storage indisponível', () => {
  it.each([[null], [throwingStorage()]])('TU-P05: nenhuma função lança com %#', (storage) => {
    expect(() => recordStoreCreated(storage, CREATED_AT)).not.toThrow();
    expect(() => ensureStoreMarker(storage, CREATED_AT)).not.toThrow();
    expect(() => dismissStoreLoss(storage)).not.toThrow();
    expect(pendingStoreLoss(storage)).toBeNull();
  });
});

describe('pendingStoreLoss', () => {
  it.each([[''], ['abc'], ['0'], ['-5'], ['1.5']])('TU-P07: trata %j como sem perda', (raw) => {
    expect(pendingStoreLoss(memoryStorage({ [STORE_LOST_KEY]: raw }))).toBeNull();
  });
});
