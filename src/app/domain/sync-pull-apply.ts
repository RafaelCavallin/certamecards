import { db, type Card, type Deck, type ReviewLog, type UserSettings } from './db';
import { wins } from './lww';
import type { Parsed } from './sync-rows-types';

export interface VersionedTable<T> {
  bulkGet(ids: string[]): Promise<(T | undefined)[]>;
  bulkPut(rows: T[]): Promise<unknown>;
}

async function applyVersioned<T extends { id: string; updatedAt: number }>(
  items: Parsed<T>[],
  table: VersionedTable<T>,
  cursorKey: string,
): Promise<number> {
  return db.transaction('rw', db.decks, db.cards, db.settings, db.syncState, async () => {
    const local = await table.bulkGet(items.map((item) => item.row.id));
    const winners = items.filter((item, index) => wins(item.row, local[index]));
    if (winners.length) await table.bulkPut(winners.map((item) => item.row));
    await db.syncState.put({ key: cursorKey, value: items[items.length - 1].syncedAt });
    return winners.length;
  });
}

export function applyDecks(items: Parsed<Deck>[], cursorKey: string): Promise<number> {
  return applyVersioned(items, db.decks as unknown as VersionedTable<Deck>, cursorKey);
}

export function applyCards(items: Parsed<Card>[], cursorKey: string): Promise<number> {
  return applyVersioned(items, db.cards as unknown as VersionedTable<Card>, cursorKey);
}

export function applySettings(items: Parsed<UserSettings>[], cursorKey: string): Promise<number> {
  return applyVersioned(items, db.settings as unknown as VersionedTable<UserSettings>, cursorKey);
}

export async function applyLogs(items: Parsed<ReviewLog>[], cursorKey: string): Promise<number> {
  return db.transaction('rw', db.reviewLogs, db.syncState, async () => {
    const local = await db.reviewLogs.bulkGet(items.map((item) => item.row.id));
    const fresh = items.filter((_, index) => !local[index]);
    if (fresh.length) await db.reviewLogs.bulkAdd(fresh.map((item) => item.row));
    await db.syncState.put({ key: cursorKey, value: items[items.length - 1].syncedAt });
    return fresh.length;
  });
}
