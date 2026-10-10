import type { KeyValueStorage } from './local-storage';

export const LAST_SYNC_KEY = 'certamecards.lastSync';

export function parseLastSyncAt(raw: string | null): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function readLastSyncAt(storage: KeyValueStorage | null): number {
  if (!storage) return 0;
  try {
    return parseLastSyncAt(storage.getItem(LAST_SYNC_KEY));
  } catch {
    return 0;
  }
}

export function writeLastSyncAt(storage: KeyValueStorage | null, at: number): boolean {
  if (!storage) return false;
  try {
    storage.setItem(LAST_SYNC_KEY, String(at));
    return true;
  } catch {
    return false;
  }
}
