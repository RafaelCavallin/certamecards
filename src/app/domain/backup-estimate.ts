import { collectBackupContent } from './backup-records';
import { toManifest } from './backup-manifest-write';

export async function estimateBackupSize(): Promise<number> {
  const { content } = await collectBackupContent();
  const manifest = toManifest(content, { exportedAt: 0, accountId: null });
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest)).length;
  return content.images.reduce((total, image) => total + image.byteSize, manifestBytes);
}
