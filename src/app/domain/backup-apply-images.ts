import type { CardImage } from './db';
import { db } from './db';
import { applyRows, chunked, type ApplyContext } from './backup-apply-rows';
import { selectBlobFills } from './backup-plan';

export interface ImagesInput {
  images: CardImage[];
  blobs: ReadonlyMap<string, Blob>;
  ctx: ApplyContext;
}

export interface AppliedImages {
  written: CardImage[];
  kept: number;
}

async function storedBlobIds(): Promise<Set<string>> {
  return new Set(await db.imageBlobs.toCollection().primaryKeys());
}

async function fillMissingFiles(input: ImagesInput, stored: ReadonlySet<string>): Promise<void> {
  if (input.images.length === 0) return;
  const local = await db.cardImages.bulkGet(input.images.map((image) => image.id));
  const ids = selectBlobFills({ incoming: input.images, local, storedBlobIds: stored }).filter((id) => input.blobs.has(id));
  if (ids.length === 0) return;
  await db.imageBlobs.bulkPut(ids.map((id) => ({ id, blob: input.blobs.get(id) as Blob })));
  await db.cardImages.where('id').anyOf(ids).modify({ blobState: 'uploaded' });
}

export async function applyImages(input: ImagesInput): Promise<AppliedImages> {
  const stored = await storedBlobIds();
  const usable = input.images.filter((image) => input.blobs.has(image.id) || stored.has(image.id));
  const pending = usable.map((image) => ({ ...image, blobState: 'local' as const }));
  const result = await applyRows<CardImage>(db.cardImages, pending, input.ctx);
  const fresh = result.written.filter((image) => !stored.has(image.id));
  for (const part of chunked(fresh)) {
    await db.imageBlobs.bulkPut(part.map((image) => ({ id: image.id, blob: input.blobs.get(image.id) as Blob })));
  }
  if (input.ctx.plan === 'merge') await fillMissingFiles({ ...input, images: usable }, stored);
  return { written: result.written, kept: result.kept + (input.images.length - usable.length) };
}
