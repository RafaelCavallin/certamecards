export type PersistenceState = 'persisted' | 'best-effort' | 'unsupported';
export type PersistenceManager = Pick<StorageManager, 'persist' | 'persisted'>;

export function browserPersistenceManager(): PersistenceManager | undefined {
  const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
  return typeof storage?.persist === 'function' && typeof storage.persisted === 'function' ? storage : undefined;
}

async function askManager(ask: () => Promise<boolean>): Promise<PersistenceState> {
  try {
    return (await ask()) ? 'persisted' : 'best-effort';
  } catch {
    return 'best-effort';
  }
}

export async function readPersistence(manager: PersistenceManager | undefined): Promise<PersistenceState> {
  if (!manager) return 'unsupported';
  return askManager(() => manager.persisted());
}

export async function requestPersistence(manager: PersistenceManager | undefined): Promise<PersistenceState> {
  if (!manager) return 'unsupported';
  const current = await readPersistence(manager);
  if (current === 'persisted') return current;
  return askManager(() => manager.persist());
}
