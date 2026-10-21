import Dexie from 'dexie';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { db } from './db';
import { STORE_CREATED_KEY, pendingStoreLoss } from './store-marker';
import { initStoreMarker, watchConnectionClosed } from './storage-loss';

const PREVIOUS_CREATION = '1792330000000';

afterEach(async () => {
  if (!db.isOpen()) await db.open();
  await resetDb();
  localStorage.clear();
});

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}

describe('recriação do banco', () => {
  it('TI-P01: banco apagado e reaberto com marcador presente deixa perda pendente', async () => {
    await db.open();
    localStorage.setItem(STORE_CREATED_KEY, PREVIOUS_CREATION);
    await db.delete({ disableAutoOpen: false });
    await db.open();
    expect(pendingStoreLoss(localStorage)).not.toBeNull();
    expect(localStorage.getItem(STORE_CREATED_KEY)).not.toBe(PREVIOUS_CREATION);
  });
});

describe('initStoreMarker', () => {
  it('TI-P02: num banco existente sem marcador grava o marcador sem registrar perda', async () => {
    await db.open();
    await initStoreMarker(localStorage);
    expect(localStorage.getItem(STORE_CREATED_KEY)).not.toBeNull();
    expect(pendingStoreLoss(localStorage)).toBeNull();
  });
});

describe('watchConnectionClosed', () => {
  it('TI-P03: avisa uma única vez e impede que o banco reabra sozinho', async () => {
    await db.open();
    const onClosed = vi.fn();
    const stop = watchConnectionClosed(onClosed);
    db.close({ disableAutoOpen: false });
    await flushMicrotasks();
    await expect(db.cards.count()).rejects.toBeInstanceOf(Dexie.DatabaseClosedError);
    expect(onClosed).toHaveBeenCalledTimes(1);
    stop();
  });

  it('TI-P03: depois de cancelar, novos fechamentos não chamam o callback', async () => {
    await db.open();
    const onClosed = vi.fn();
    watchConnectionClosed(onClosed)();
    db.close({ disableAutoOpen: false });
    await flushMicrotasks();
    expect(onClosed).not.toHaveBeenCalled();
  });
});
