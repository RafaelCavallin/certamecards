import type { ParsedBackup, RestorePlan } from './backup-format';
import { selectOrphans, selectWinners } from './backup-plan';
import { tombstoneImages } from './card-images';
import { db, type ReviewLog } from './db';
import { DEFAULT_DECK_NAME } from './decks';
import type { Versioned } from './lww';

const WRITE_CHUNK_SIZE = 500;

export interface ApplyContext {
  plan: RestorePlan;
  now: number;
  step: (count: number) => void;
}

export interface AppliedRows<T> {
  written: T[];
  kept: number;
}

type Stamped = Versioned & { dirty: 0 | 1 };

export interface RowTable<T> {
  bulkGet(ids: string[]): Promise<(T | undefined)[]>;
  bulkPut(rows: T[]): Promise<unknown>;
}

export function chunked<T>(items: T[]): T[][] {
  const parts: T[][] = [];
  for (let index = 0; index < items.length; index += WRITE_CHUNK_SIZE) parts.push(items.slice(index, index + WRITE_CHUNK_SIZE));
  return parts;
}

export function stamp<T extends Stamped>(row: T, ctx: ApplyContext): T {
  return ctx.plan === 'replace' ? { ...row, dirty: 1, updatedAt: ctx.now } : { ...row, dirty: 1 };
}

async function winnersOf<T extends Versioned & { id: string }>(table: RowTable<T>, rows: T[]): Promise<T[]> {
  const local = await table.bulkGet(rows.map((row) => row.id));
  return selectWinners({ incoming: rows, local });
}

export async function applyRows<T extends Stamped & { id: string }>(
  table: RowTable<T>,
  rows: T[],
  ctx: ApplyContext,
): Promise<AppliedRows<T>> {
  const needsLww = ctx.plan === 'merge' && rows.length > 0;
  const chosen = needsLww ? await winnersOf(table, rows) : rows;
  const written = chosen.map((row) => stamp(row, ctx));
  for (const part of chunked(written)) {
    await table.bulkPut(part);
    ctx.step(part.length);
  }
  ctx.step(rows.length - written.length);
  return { written, kept: rows.length - written.length };
}

export async function addMissingLogs(logs: ReviewLog[], ctx: ApplyContext): Promise<ReviewLog[]> {
  if (logs.length === 0) return [];
  const local = await db.reviewLogs.bulkGet(logs.map((log) => log.id));
  const fresh = logs.filter((_, index) => !local[index]).map((log) => ({ ...log, dirty: 1 as const }));
  for (const part of chunked(fresh)) {
    await db.reviewLogs.bulkAdd(part);
    ctx.step(part.length);
  }
  ctx.step(logs.length - fresh.length);
  return fresh;
}

export async function tombstoneOrphans(backup: ParsedBackup, now: number): Promise<number> {
  const [localDecks, localCards, localImages] = await Promise.all([
    db.decks.where('deletedAt').equals(0).primaryKeys(),
    db.cards.where('deletedAt').equals(0).primaryKeys(),
    db.cardImages.where('deletedAt').equals(0).primaryKeys(),
  ]);
  const deckIds = selectOrphans({ localIds: localDecks, incomingIds: backup.decks.map((deck) => deck.id) });
  const cardIds = selectOrphans({ localIds: localCards, incomingIds: backup.cards.map((card) => card.id) });
  const imageIds = selectOrphans({ localIds: localImages, incomingIds: backup.images.map((image) => image.id) });
  const tombstone = { deletedAt: now, updatedAt: now, dirty: 1 as const };
  if (deckIds.length > 0) await db.decks.where('id').anyOf(deckIds).modify(tombstone);
  if (cardIds.length > 0) await db.cards.where('id').anyOf(cardIds).modify(tombstone);
  if (imageIds.length > 0) await tombstoneImages(imageIds, now);
  return deckIds.length + cardIds.length;
}

export async function dropUntouchedDefaultDeck(backup: ParsedBackup, now: number): Promise<void> {
  if (!backup.decks.some((deck) => deck.deletedAt === 0)) return;
  const [liveDecks, cardCount, logCount] = await Promise.all([
    db.decks.where('deletedAt').equals(0).toArray(),
    db.cards.count(),
    db.reviewLogs.count(),
  ]);
  const archived = new Set(backup.decks.map((deck) => deck.id));
  const seeded = liveDecks.filter((deck) => !archived.has(deck.id));
  const untouched = seeded.length > 0 && seeded.every((deck) => deck.name === DEFAULT_DECK_NAME) && cardCount === 0 && logCount === 0;
  if (!untouched) return;
  await db.decks.where('id').anyOf(seeded.map((deck) => deck.id)).modify({ deletedAt: now, updatedAt: now, dirty: 1 });
}
