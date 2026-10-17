import type { SupabaseClient } from '@supabase/supabase-js';
import { db, type Card, type Deck, type ReviewLog, type UserSettings } from './db';
import { toCardRow, toDeckRow, toLogRow, toSettingsRow } from './sync-rows';
import { chunk, clearDirty, type DirtyTable } from './sync-push-dirty';

interface PushPayload {
  decks: Deck[];
  settings: UserSettings[];
  cards: Card[];
  logs: ReviewLog[];
}

interface DirtyRows {
  decks: Deck[];
  settings: UserSettings[];
  cards: Card[];
  logs: ReviewLog[];
}

export async function pushDirty(client: SupabaseClient): Promise<number> {
  const dirty = await loadDirtyRows();
  const cardChunks = chunk(dirty.cards);
  await pushCardChunks(client, dirty, cardChunks);
  if (cardChunks.length === 0) await pushMetadataAlone(client, dirty);
  await pushLogChunks(client, dirty.logs);
  return dirty.decks.length + dirty.settings.length + dirty.cards.length + dirty.logs.length;
}

async function loadDirtyRows(): Promise<DirtyRows> {
  const [decks, settings, cards, logs] = await Promise.all([
    db.decks.filter((row) => row.dirty === 1).toArray(),
    db.settings.filter((row) => row.dirty === 1).toArray(),
    db.cards.filter((row) => row.dirty === 1).toArray(),
    db.reviewLogs.filter((row) => row.dirty === 1).toArray(),
  ]);
  return { decks, settings, cards, logs };
}

async function pushCardChunks(client: SupabaseClient, dirty: DirtyRows, cardChunks: Card[][]): Promise<void> {
  for (const [index, cardChunk] of cardChunks.entries()) {
    const isFirstChunk = index === 0;
    await push(client, { decks: isFirstChunk ? dirty.decks : [], settings: isFirstChunk ? dirty.settings : [], cards: cardChunk, logs: [] });
    await clearDirty(db.cards as unknown as DirtyTable<Card>, cardChunk);
    if (isFirstChunk) await clearMetadata(dirty);
  }
}

async function pushMetadataAlone(client: SupabaseClient, dirty: DirtyRows): Promise<void> {
  if (dirty.decks.length === 0 && dirty.settings.length === 0) return;
  await push(client, { decks: dirty.decks, settings: dirty.settings, cards: [], logs: [] });
  await clearMetadata(dirty);
}

async function clearMetadata(dirty: DirtyRows): Promise<void> {
  await clearDirty(db.decks as unknown as DirtyTable<Deck>, dirty.decks);
  await clearSettings(dirty.settings);
}

async function pushLogChunks(client: SupabaseClient, logs: ReviewLog[]): Promise<void> {
  for (const logChunk of chunk(logs)) {
    await push(client, { decks: [], settings: [], cards: [], logs: logChunk });
    await db.reviewLogs.bulkUpdate(logChunk.map((row) => ({ key: row.id, changes: { dirty: 0 } })));
  }
}

async function push(client: SupabaseClient, payload: PushPayload): Promise<void> {
  const { error } = await client.rpc('sync_push', {
    p_decks: payload.decks.map(toDeckRow),
    p_cards: payload.cards.map(toCardRow),
    p_logs: payload.logs.map(toLogRow),
    p_settings: payload.settings.map(toSettingsRow),
  });
  if (error) {
    warnRejectedChunk(payload, error.code);
    throw error;
  }
}

function warnRejectedChunk(payload: PushPayload, code: string | undefined): void {
  const ids = {
    decks: payload.decks.map((row) => row.id),
    settings: payload.settings.map((row) => row.id),
    cards: payload.cards.map((row) => row.id),
    logs: payload.logs.map((row) => row.id),
  };
  console.warn(`sync-push: chunk rejeitado (${code ?? 'sem código'})`, ids);
}

async function clearSettings(rows: UserSettings[]): Promise<void> {
  if (rows.length === 0) return;
  const current = await db.settings.bulkGet(rows.map((row) => row.id));
  const unchanged = rows.filter((row, index) => current[index]?.updatedAt === row.updatedAt);
  await Promise.all(unchanged.map((row) => db.settings.update(row.id, { dirty: 0 })));
}
