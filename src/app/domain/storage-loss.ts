import { db } from './db';
import type { KeyValueStorage } from './local-storage';
import { ensureStoreMarker } from './store-marker';

export async function initStoreMarker(storage: KeyValueStorage | null): Promise<void> {
  await db.open();
  ensureStoreMarker(storage, Date.now());
}

function lockClosedStore(): void {
  queueMicrotask(() => db.close({ disableAutoOpen: true }));
}

export function watchConnectionClosed(onClosed: () => void): () => void {
  let fired = false;
  const handleClose = (): void => {
    if (fired) return;
    fired = true;
    console.warn('Conexão com o banco local encerrada pelo navegador.');
    lockClosedStore();
    onClosed();
  };
  db.on('close', handleClose);
  return () => db.on.close.unsubscribe(handleClose);
}
