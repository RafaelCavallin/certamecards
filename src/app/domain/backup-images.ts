import { db } from './db';
import { fetchMissingImages } from './image-download';
import { warnImage } from './image-storage';

export async function downloadMissingForBackup(): Promise<void> {
  try {
    const cardIds = await db.cards.where('deletedAt').equals(0).primaryKeys();
    await fetchMissingImages(cardIds);
  } catch (error: unknown) {
    warnImage({ phase: 'backup-download', ids: [], error });
  }
}
