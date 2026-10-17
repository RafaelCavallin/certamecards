import { db } from '../app/domain/db';
import type { BackupContent } from '../app/domain/backup-format';

export async function seedDevice(content: Partial<BackupContent>, imageData: Record<string, number[]> = {}): Promise<void> {
  await db.decks.bulkAdd(content.decks ?? []);
  await db.cards.bulkAdd(content.cards ?? []);
  await db.reviewLogs.bulkAdd(content.reviewLogs ?? []);
  if (content.settings) await db.settings.add(content.settings);
  await db.cardImages.bulkAdd(content.images ?? []);
  const blobs = Object.entries(imageData).map(([id, bytes]) => ({ id, blob: new Blob([new Uint8Array(bytes)], { type: 'image/webp' }) }));
  await db.imageBlobs.bulkAdd(blobs);
}

export function fileOf(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: 'application/zip' });
}

function byId<T extends { id: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id));
}

function without(row: object, keys: string[]): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...row };
  keys.forEach((key) => delete copy[key]);
  return copy;
}

export interface DeviceDump {
  decks: Record<string, unknown>[];
  cards: Record<string, unknown>[];
  reviewLogs: Record<string, unknown>[];
  settings: Record<string, unknown>[];
  images: Record<string, unknown>[];
  blobs: Record<string, number[]>;
}

export async function dumpDevice(): Promise<DeviceDump> {
  const volatile = ['updatedAt', 'dirty', 'blobState'];
  const [decks, cards, logs, settings, images, blobs] = await Promise.all([
    db.decks.toArray(),
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.settings.toArray(),
    db.cardImages.toArray(),
    db.imageBlobs.toArray(),
  ]);
  const bytes = await Promise.all(blobs.map(async (record) => [record.id, [...new Uint8Array(await record.blob.arrayBuffer())]] as const));
  return {
    decks: byId(decks).map((row) => without(row, volatile)),
    cards: byId(cards).map((row) => without(row, volatile)),
    reviewLogs: byId(logs).map((row) => without(row, volatile)),
    settings: settings.map((row) => without(row, volatile)),
    images: byId(images).map((row) => without(row, volatile)),
    blobs: Object.fromEntries(bytes),
  };
}

export async function tableCounts(): Promise<number[]> {
  return Promise.all([db.decks, db.cards, db.reviewLogs, db.settings, db.cardImages, db.imageBlobs, db.syncState].map((table) => table.count()));
}
