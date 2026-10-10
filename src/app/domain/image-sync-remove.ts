import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from './db';
import { setBlobState } from './image-blob-state';
import type { PhaseResult } from './image-sync-upload';
import { IMAGE_BUCKET, imagePath, warnImage } from './image-storage';

const REMOVE_BATCH = 100;

export async function purgeImageFiles(client: SupabaseClient, userId: string): Promise<PhaseResult> {
  const rows = await db.cardImages.where('blobState').equals('pending-delete').filter((image) => image.dirty === 0).toArray();
  const result: PhaseResult = { done: 0, failed: 0 };
  for (let index = 0; index < rows.length; index += REMOVE_BATCH) {
    const ids = rows.slice(index, index + REMOVE_BATCH).map((row) => row.id);
    const { error } = await client.storage.from(IMAGE_BUCKET).remove(ids.map((id) => imagePath(userId, id)));
    if (error) {
      warnImage({ phase: 'remove', ids, error });
      result.failed += ids.length;
      continue;
    }
    for (const id of ids) await setBlobState(id, 'purged');
    result.done += ids.length;
  }
  return result;
}
