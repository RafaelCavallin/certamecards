import { db, type CardImage } from './db';
import { wins } from './lww';
import type { Parsed } from './sync-rows-types';

function resolveState(incoming: CardImage, hasBlob: boolean): CardImage['blobState'] {
  if (incoming.deletedAt > 0) return 'purged';
  return hasBlob ? 'uploaded' : 'remote';
}

async function putClean(rows: CardImage[]): Promise<void> {
  await db.cardImages.bulkPut(rows);
  await db.cardImages.where('id').anyOf(rows.map((row) => row.id)).modify({ dirty: 0 });
}

export async function applyCardImages(items: Parsed<CardImage>[], cursorKey: string): Promise<number> {
  return db.transaction('rw', db.cardImages, db.imageBlobs, db.syncState, async () => {
    const ids = items.map((item) => item.row.id);
    const [local, blobs] = await Promise.all([db.cardImages.bulkGet(ids), db.imageBlobs.bulkGet(ids)]);
    const rows = items.flatMap((item, index) =>
      wins(item.row, local[index]) ? [{ ...item.row, blobState: resolveState(item.row, blobs[index] !== undefined) }] : [],
    );
    if (rows.length) await putClean(rows);
    await db.imageBlobs.bulkDelete(rows.filter((row) => row.deletedAt > 0).map((row) => row.id));
    await db.syncState.put({ key: cursorKey, value: items[items.length - 1].syncedAt });
    return rows.length;
  });
}
