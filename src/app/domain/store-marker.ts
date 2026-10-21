import type { KeyValueStorage } from './local-storage';

export const STORE_CREATED_KEY = 'certamecards.storeCreatedAt';
export const STORE_LOST_KEY = 'certamecards.storeLostAt';
const NO_LOSS = '';

function readKey(storage: KeyValueStorage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeKey(storage: KeyValueStorage | null, key: string, value: string): void {
  try {
    storage?.setItem(key, value);
  } catch {
    return;
  }
}

export function recordStoreCreated(storage: KeyValueStorage | null, now: number): void {
  if (readKey(storage, STORE_CREATED_KEY)) {
    console.warn('Banco local recriado: os dados anteriores deste navegador foram apagados.');
    writeKey(storage, STORE_LOST_KEY, String(now));
  }
  writeKey(storage, STORE_CREATED_KEY, String(now));
}

export function ensureStoreMarker(storage: KeyValueStorage | null, now: number): void {
  if (readKey(storage, STORE_CREATED_KEY)) return;
  writeKey(storage, STORE_CREATED_KEY, String(now));
}

export function pendingStoreLoss(storage: KeyValueStorage | null): number | null {
  const lostAt = Number(readKey(storage, STORE_LOST_KEY) ?? NO_LOSS);
  return Number.isInteger(lostAt) && lostAt > 0 ? lostAt : null;
}

export function dismissStoreLoss(storage: KeyValueStorage | null): void {
  writeKey(storage, STORE_LOST_KEY, NO_LOSS);
}
