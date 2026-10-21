import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  browserPersistenceManager,
  readPersistence,
  requestPersistence,
  type PersistenceManager,
} from './storage-persistence';

function manager(persisted: boolean | Error, persist: boolean | Error = false): PersistenceManager {
  const answer = (value: boolean | Error) => () =>
    value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
  return { persisted: vi.fn(answer(persisted)), persist: vi.fn(answer(persist)) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readPersistence', () => {
  it('TU-P06: sem a API, não suportado', async () => {
    expect(await readPersistence(undefined)).toBe('unsupported');
  });

  it('TU-P06: reflete persisted()', async () => {
    expect(await readPersistence(manager(true))).toBe('persisted');
    expect(await readPersistence(manager(false))).toBe('best-effort');
  });

  it('TU-P06: exceção vira best-effort', async () => {
    expect(await readPersistence(manager(new Error('falhou')))).toBe('best-effort');
  });
});

describe('requestPersistence', () => {
  it('TU-P06: sem a API, não suportado', async () => {
    expect(await requestPersistence(undefined)).toBe('unsupported');
  });

  it('TU-P06: já persistido não pede de novo', async () => {
    const storage = manager(true);
    expect(await requestPersistence(storage)).toBe('persisted');
    expect(storage.persist).not.toHaveBeenCalled();
  });

  it.each([
    [true, 'persisted'],
    [false, 'best-effort'],
    [new Error('negado'), 'best-effort'],
  ] as const)('TU-P06: persist() com %s resulta em %s', async (granted, expected) => {
    expect(await requestPersistence(manager(false, granted))).toBe(expected);
  });
});

describe('browserPersistenceManager', () => {
  it('devolve undefined quando o navegador não tem a API', () => {
    vi.stubGlobal('navigator', { storage: {} });
    expect(browserPersistenceManager()).toBeUndefined();
  });

  it('devolve o StorageManager quando ele tem persist e persisted', () => {
    const storage = manager(false);
    vi.stubGlobal('navigator', { storage });
    expect(browserPersistenceManager()).toBe(storage);
  });
});
