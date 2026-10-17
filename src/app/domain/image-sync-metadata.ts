import type { SupabaseClient } from '@supabase/supabase-js';
import { db, type CardImage } from './db';
import type { PhaseResult } from './image-sync-upload';
import { warnImage } from './image-storage';
import { chunk, clearDirty, type DirtyTable } from './sync-push-dirty';
import { toCardImageRow } from './sync-rows';

function readyToSend(image: CardImage): boolean {
  return image.dirty === 1 && (image.deletedAt > 0 || image.blobState === 'uploaded' || image.blobState === 'remote');
}

export async function pushImageMetadata(client: SupabaseClient): Promise<PhaseResult> {
  const rows = await db.cardImages.filter(readyToSend).toArray();
  const result: PhaseResult = { done: 0, failed: 0 };
  for (const part of chunk(rows)) {
    const { error } = await client.rpc('sync_push_images', { p_images: part.map(toCardImageRow) });
    if (error) {
      warnImage({ phase: 'metadata', ids: part.map((row) => row.id), error });
      result.failed += part.length;
      continue;
    }
    await clearDirty(db.cardImages as unknown as DirtyTable<CardImage>, part);
    result.done += part.length;
  }
  return result;
}
