import { db, type BlobState } from './db';

export async function setBlobState(imageId: string, state: BlobState): Promise<void> {
  await db.cardImages.update(imageId, { blobState: state });
}
