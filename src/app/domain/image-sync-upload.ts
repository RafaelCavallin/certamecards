import type { SupabaseClient } from '@supabase/supabase-js';
import { db, type CardImage } from './db';
import { setBlobState } from './image-blob-state';
import { IMAGE_BUCKET, imagePath, isDuplicateUpload, warnImage } from './image-storage';

const UPLOAD_CONCURRENCY = 2;
const CACHE_SECONDS = '31536000';

export interface PhaseResult {
  done: number;
  failed: number;
}

async function uploadOne(client: SupabaseClient, userId: string, image: CardImage): Promise<boolean> {
  const record = await db.imageBlobs.get(image.id);
  if (!record) return false;
  const { error } = await client.storage
    .from(IMAGE_BUCKET)
    .upload(imagePath(userId, image.id), record.blob, { contentType: image.mimeType, upsert: false, cacheControl: CACHE_SECONDS });
  if (error && !isDuplicateUpload(error)) {
    warnImage({ phase: 'upload', ids: [image.id], error });
    return false;
  }
  await setBlobState(image.id, 'uploaded');
  return true;
}

export async function uploadPendingImages(client: SupabaseClient, userId: string): Promise<PhaseResult> {
  const pending = await db.cardImages.where('blobState').equals('local').filter((image) => image.deletedAt === 0).toArray();
  const result: PhaseResult = { done: 0, failed: 0 };
  for (let index = 0; index < pending.length; index += UPLOAD_CONCURRENCY) {
    const batch = pending.slice(index, index + UPLOAD_CONCURRENCY);
    const outcomes = await Promise.all(batch.map((image) => uploadOne(client, userId, image)));
    outcomes.forEach((ok) => (ok ? result.done++ : result.failed++));
  }
  return result;
}
