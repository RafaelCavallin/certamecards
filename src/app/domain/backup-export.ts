import { getBoundUserId } from './auth';
import { BackupError } from './backup-errors';
import { imageEntryPath } from './backup-format';
import { downloadMissingForBackup } from './backup-images';
import { toManifest } from './backup-manifest-write';
import { collectBackupContent, hasBackupContent } from './backup-records';
import { zipBackup, type ImageFile } from './backup-zip';
import { db, type CardImage } from './db';

export type ExportPhase = 'images' | 'collect' | 'zip';

export interface ExportProgress {
  phase: ExportPhase;
  done: number | null;
  total: number | null;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  missingImages: number;
}

const FILE_PREFIX = 'certamecards-backup';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function backupFileName(now: Date): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${FILE_PREFIX}-${date}.zip`;
}

async function loadImageFiles(images: CardImage[]): Promise<ImageFile[]> {
  const records = await db.imageBlobs.bulkGet(images.map((image) => image.id));
  return Promise.all(
    images.flatMap((image, index) => {
      const record = records[index];
      if (!record) return [];
      const path = imageEntryPath(image.id, image.mimeType);
      return [record.blob.arrayBuffer().then((buffer) => ({ path, bytes: new Uint8Array(buffer) }))];
    }),
  );
}

export async function createBackup(onProgress?: (progress: ExportProgress) => void): Promise<ExportResult> {
  if (!(await hasBackupContent())) throw new BackupError('nothing-to-save');
  onProgress?.({ phase: 'images', done: null, total: null });
  await downloadMissingForBackup();
  onProgress?.({ phase: 'collect', done: null, total: null });
  const { content, missingImages } = await collectBackupContent();
  const manifest = toManifest(content, { exportedAt: Date.now(), accountId: await getBoundUserId() });
  const images = await loadImageFiles(content.images);
  const blob = await zipBackup({
    manifest,
    images,
    onProgress: (done, total) => onProgress?.({ phase: 'zip', done, total }),
  });
  return { blob, fileName: backupFileName(new Date()), missingImages };
}
