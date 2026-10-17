import { getBoundUserId } from './auth';
import { applyBackup } from './backup-apply';
import { BackupError } from './backup-errors';
import type { BackupPreview, ParsedBackup, RestoreInput, RestoreReport } from './backup-format';
import { parseManifest } from './backup-manifest-read';
import { unzipImages, unzipManifest } from './backup-zip';

function isEmptyBackup(backup: ParsedBackup): boolean {
  const hasDeck = backup.decks.some((deck) => deck.deletedAt === 0);
  const hasCard = backup.cards.some((card) => card.deletedAt === 0);
  return !hasDeck && !hasCard && backup.reviewLogs.length === 0;
}

function previewOf(backup: ParsedBackup, bytes: Uint8Array, boundUserId: string | null): BackupPreview {
  return {
    exportedAt: backup.exportedAt,
    counts: {
      decks: backup.decks.filter((deck) => deck.deletedAt === 0).length,
      cards: backup.cards.filter((card) => card.deletedAt === 0).length,
      reviewLogs: backup.reviewLogs.length,
      images: backup.images.length,
    },
    imageBytes: backup.images.reduce((total, image) => total + image.byteSize, 0),
    accountMismatch: boundUserId !== null && backup.accountId !== null && boundUserId !== backup.accountId,
    discarded: backup.discarded,
    source: { parsed: backup, bytes },
  };
}

export async function readBackup(file: Blob): Promise<BackupPreview> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { manifest, imagePaths } = unzipManifest(bytes);
  const backup = parseManifest(manifest, imagePaths);
  if (isEmptyBackup(backup)) throw new BackupError('empty');
  return previewOf(backup, bytes, await getBoundUserId());
}

function imageBlobs(backup: ParsedBackup, bytes: Uint8Array): Map<string, Blob> {
  const files = unzipImages(bytes, Object.values(backup.imagePaths));
  const blobs = new Map<string, Blob>();
  for (const image of backup.images) {
    const data = files.get(backup.imagePaths[image.id]);
    if (data) blobs.set(image.id, new Blob([data as BlobPart], { type: image.mimeType }));
  }
  return blobs;
}

export async function restoreBackup(input: RestoreInput): Promise<RestoreReport> {
  const { parsed, bytes } = input.preview.source;
  const applied = await applyBackup({
    backup: parsed,
    blobs: imageBlobs(parsed, bytes),
    plan: input.plan,
    onProgress: input.onProgress,
  });
  return { ...applied, discarded: input.preview.discarded };
}
