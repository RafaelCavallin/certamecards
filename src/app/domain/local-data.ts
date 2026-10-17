import { db } from './db';

const CURSOR_KEYS = ['cursor:decks', 'cursor:cards', 'cursor:review_logs', 'cursor:user_settings', 'cursor:card_images'];

export async function clearCursors(): Promise<void> {
  await db.syncState.bulkDelete(CURSOR_KEYS);
}

async function markImagesDirty(): Promise<void> {
  const withFile = new Set(await db.imageBlobs.toCollection().primaryKeys());
  await db.cardImages.toCollection().modify((image) => {
    image.dirty = 1;
    if (image.deletedAt === 0 && withFile.has(image.id)) image.blobState = 'local';
  });
}

export async function markAllDirty(): Promise<void> {
  await Promise.all([
    db.decks.toCollection().modify({ dirty: 1 }),
    db.cards.toCollection().modify({ dirty: 1 }),
    db.reviewLogs.toCollection().modify({ dirty: 1 }),
    db.settings.toCollection().modify({ dirty: 1 }),
    markImagesDirty(),
  ]);
}

export async function wipeLocalData(): Promise<void> {
  const tables = [db.decks, db.cards, db.reviewLogs, db.settings, db.syncState, db.cardImages, db.imageBlobs];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()));
  });
}
