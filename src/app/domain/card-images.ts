import { db, type CardImage } from './db';

export interface GalleryImage {
  image: CardImage;
  blob: Blob | null;
}

export interface ImageUsage {
  count: number;
  bytes: number;
}

function byGalleryOrder(a: CardImage, b: CardImage): number {
  return a.position - b.position || a.createdAt - b.createdAt || a.id.localeCompare(b.id);
}

export async function liveCardImages(cardId: string): Promise<CardImage[]> {
  const images = await db.cardImages.where('cardId').equals(cardId).filter((image) => image.deletedAt === 0).toArray();
  return images.sort(byGalleryOrder);
}

export async function galleryImages(cardId: string): Promise<GalleryImage[]> {
  const images = await liveCardImages(cardId);
  const blobs = await db.imageBlobs.bulkGet(images.map((image) => image.id));
  return images.map((image, index) => ({ image, blob: blobs[index]?.blob ?? null }));
}

async function imagesOfLiveCards(): Promise<CardImage[]> {
  const images = await db.cardImages.where('deletedAt').equals(0).toArray();
  const cards = await db.cards.bulkGet([...new Set(images.map((image) => image.cardId))]);
  const aliveIds = new Set(cards.filter((card) => card && card.deletedAt === 0).map((card) => card?.id));
  return images.filter((image) => aliveIds.has(image.cardId));
}

export async function imageUsage(): Promise<ImageUsage> {
  const images = await imagesOfLiveCards();
  return { count: images.length, bytes: images.reduce((total, image) => total + image.byteSize, 0) };
}

export async function pendingUploadCount(): Promise<number> {
  const images = await imagesOfLiveCards();
  return images.filter((image) => image.blobState === 'local').length;
}

async function tombstone(images: CardImage[], now: number): Promise<void> {
  if (images.length === 0) return;
  const ids = images.map((image) => image.id);
  await db.cardImages.where('id').anyOf(ids).modify({ deletedAt: now, updatedAt: now, blobState: 'pending-delete', dirty: 1 });
  await db.imageBlobs.bulkDelete(ids);
}

export async function tombstoneImages(imageIds: string[], now: number): Promise<void> {
  const images = await db.cardImages.where('id').anyOf(imageIds).filter((image) => image.deletedAt === 0).toArray();
  await tombstone(images, now);
}

export async function tombstoneImagesOfCards(cardIds: string[], now: number): Promise<void> {
  const images = await db.cardImages.where('cardId').anyOf(cardIds).filter((image) => image.deletedAt === 0).toArray();
  await tombstone(images, now);
}
