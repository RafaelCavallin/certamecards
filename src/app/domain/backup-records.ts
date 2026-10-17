import type { BackupContent } from './backup-format';
import { db, type CardImage } from './db';

export interface CollectedBackup {
  content: BackupContent;
  missingImages: number;
}

async function liveImagesOfLiveCards(liveCardIds: ReadonlySet<string>): Promise<CardImage[]> {
  const images = await db.cardImages.where('deletedAt').equals(0).toArray();
  return images.filter((image) => liveCardIds.has(image.cardId));
}

export async function collectBackupContent(): Promise<CollectedBackup> {
  const [decks, cards, reviewLogs, settings, withFile] = await Promise.all([
    db.decks.toArray(),
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.settings.get('me'),
    db.imageBlobs.toCollection().primaryKeys(),
  ]);
  const liveCardIds = new Set(cards.filter((card) => card.deletedAt === 0).map((card) => card.id));
  const candidates = await liveImagesOfLiveCards(liveCardIds);
  const stored = new Set(withFile);
  const images = candidates.filter((image) => stored.has(image.id));
  return {
    content: { decks, cards, reviewLogs, settings: settings ?? null, images },
    missingImages: candidates.length - images.length,
  };
}

export async function hasBackupContent(): Promise<boolean> {
  const [decks, cards] = await Promise.all([
    db.decks.where('deletedAt').equals(0).count(),
    db.cards.where('deletedAt').equals(0).count(),
  ]);
  return decks > 0 || cards > 0;
}

export async function hasStudyData(): Promise<boolean> {
  const [cards, logs] = await Promise.all([db.cards.where('deletedAt').equals(0).count(), db.reviewLogs.count()]);
  return cards > 0 || logs > 0;
}
