import { addMissingLogs, applyRows, dropUntouchedDefaultDeck, tombstoneOrphans, type ApplyContext } from './backup-apply-rows';
import { applyImages } from './backup-apply-images';
import { BackupError } from './backup-errors';
import type { BackupCounts, ParsedBackup, RestorePlan, RestoreProgress } from './backup-format';
import { db, type Card, type Deck, type UserSettings } from './db';

export interface ApplyInput {
  backup: ParsedBackup;
  blobs: ReadonlyMap<string, Blob>;
  plan: RestorePlan;
  onProgress?: (progress: RestoreProgress) => void;
}

export interface AppliedCounts {
  applied: BackupCounts;
  keptLocal: number;
  removed: number;
}

function totalRows(backup: ParsedBackup): number {
  return backup.decks.length + backup.cards.length + backup.reviewLogs.length + backup.images.length + (backup.settings ? 1 : 0);
}

function contextFor(input: ApplyInput): ApplyContext {
  const total = totalRows(input.backup);
  let done = 0;
  return {
    plan: input.plan,
    now: Date.now(),
    step: (count) => {
      done += count;
      input.onProgress?.({ done, total });
    },
  };
}

function isQuotaError(error: unknown): boolean {
  const named = error as { name?: unknown; inner?: { name?: unknown } } | null;
  return named?.name === 'QuotaExceededError' || named?.inner?.name === 'QuotaExceededError';
}

async function applyAll(input: ApplyInput, ctx: ApplyContext): Promise<AppliedCounts> {
  const { backup } = input;
  await dropUntouchedDefaultDeck(backup, ctx.now);
  const decks = await applyRows<Deck>(db.decks, backup.decks, ctx);
  const cards = await applyRows<Card>(db.cards, backup.cards, ctx);
  const settings = await applyRows<UserSettings>(db.settings, backup.settings ? [backup.settings] : [], ctx);
  const images = await applyImages({ images: backup.images, blobs: input.blobs, ctx });
  const logs = await addMissingLogs(backup.reviewLogs, ctx);
  const removed = input.plan === 'replace' ? await tombstoneOrphans(backup, ctx.now) : 0;
  return {
    applied: {
      decks: decks.written.filter((deck) => deck.deletedAt === 0).length,
      cards: cards.written.filter((card) => card.deletedAt === 0).length,
      reviewLogs: logs.length,
      images: images.written.length,
    },
    keptLocal: decks.kept + cards.kept + settings.kept + images.kept,
    removed,
  };
}

export async function applyBackup(input: ApplyInput): Promise<AppliedCounts> {
  const ctx = contextFor(input);
  const tables = [db.decks, db.cards, db.reviewLogs, db.settings, db.cardImages, db.imageBlobs];
  try {
    return await db.transaction('rw', tables, async () => applyAll(input, ctx));
  } catch (error: unknown) {
    if (isQuotaError(error)) throw new BackupError('storage-full', { cause: error });
    throw error;
  }
}
