import type { SupabaseClient } from '@supabase/supabase-js';
import { getBoundUserId } from './auth';
import { db, type CardImage } from './db';
import { setBlobState } from './image-blob-state';
import { IMAGE_BUCKET, imagePath, warnImage } from './image-storage';
import { getSupabase } from './supabase';

const DOWNLOAD_CONCURRENCY = 2;
const inFlight = new Map<string, Promise<boolean>>();

export async function storeDownloadedImage(image: CardImage, data: Blob): Promise<boolean> {
  return db.transaction('rw', db.cardImages, db.imageBlobs, async () => {
    const current = await db.cardImages.get(image.id);
    if (!current || current.deletedAt > 0) return false;
    await db.imageBlobs.put({ id: image.id, blob: new Blob([data], { type: image.mimeType }) });
    await setBlobState(image.id, 'uploaded');
    return true;
  });
}

async function downloadOne(client: SupabaseClient, userId: string, image: CardImage): Promise<boolean> {
  try {
    const { data, error } = await client.storage.from(IMAGE_BUCKET).download(imagePath(userId, image.id));
    if (error || !data) {
      warnImage({ phase: 'download', ids: [image.id], error });
      return false;
    }
    return await storeDownloadedImage(image, data);
  } catch (error: unknown) {
    warnImage({ phase: 'download', ids: [image.id], error });
    return false;
  }
}

function downloadShared(client: SupabaseClient, userId: string, image: CardImage): Promise<boolean> {
  const running = inFlight.get(image.id);
  if (running) return running;
  const started = downloadOne(client, userId, image).finally(() => inFlight.delete(image.id));
  inFlight.set(image.id, started);
  return started;
}

async function sessionClient(): Promise<{ client: SupabaseClient; userId: string } | null> {
  if (!navigator.onLine) return null;
  const userId = await getBoundUserId();
  const client = userId ? await getSupabase() : null;
  if (!userId || !client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.user.id === userId ? { client, userId } : null;
}

async function missingImages(cardIds: string[]): Promise<CardImage[]> {
  return db.cardImages
    .where('cardId')
    .anyOf(cardIds)
    .filter((image) => image.deletedAt === 0 && image.blobState === 'remote')
    .toArray();
}

export async function fetchMissingImages(cardIds: string[]): Promise<number> {
  if (cardIds.length === 0) return 0;
  const session = await sessionClient();
  if (!session) return 0;
  const missing = await missingImages(cardIds);
  let downloaded = 0;
  for (let index = 0; index < missing.length; index += DOWNLOAD_CONCURRENCY) {
    const batch = missing.slice(index, index + DOWNLOAD_CONCURRENCY);
    const results = await Promise.all(batch.map((image) => downloadShared(session.client, session.userId, image)));
    downloaded += results.filter(Boolean).length;
  }
  return downloaded;
}
