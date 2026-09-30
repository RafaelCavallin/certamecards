import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from './db';
import type { Parsed } from './sync-rows-types';

type Table = 'decks' | 'cards' | 'review_logs' | 'user_settings';

export interface PullSpec<T> {
  client: SupabaseClient;
  table: Table;
  parser: (row: unknown) => Parsed<T> | null;
  apply(items: Parsed<T>[], cursorKey: string): Promise<number>;
}

const PAGE_SIZE = 500;
const OVERLAP_MS = 5000;

export async function pullTable<T>(spec: PullSpec<T>): Promise<number> {
  const cursorKey = `cursor:${spec.table}`;
  let from = await readCursor(cursorKey);
  let total = 0;
  for (;;) {
    const page = await fetchPage(spec.client, spec.table, from);
    if (page.length === 0) return total;
    const parsed = parsePage(page, spec.table, spec.parser);
    if (parsed.length) total += await spec.apply(parsed, cursorKey);
    from = String((page[page.length - 1] as { synced_at: string }).synced_at);
    if (page.length < PAGE_SIZE) return total;
  }
}

function parsePage<T>(page: unknown[], table: Table, parser: (row: unknown) => Parsed<T> | null): Parsed<T>[] {
  const parsed: Parsed<T>[] = [];
  const discardedIds: (string | null)[] = [];
  for (const row of page) {
    const item = parser(row);
    if (item) parsed.push(item);
    else discardedIds.push(rowId(row));
  }
  if (discardedIds.length) console.warn(`sync-pull: ${discardedIds.length} linha(s) descartada(s) em ${table}`, { table, ids: discardedIds });
  return parsed;
}

function rowId(row: unknown): string | null {
  if (typeof row !== 'object' || row === null) return null;
  const id = (row as Record<string, unknown>)['id'];
  return typeof id === 'string' ? id : null;
}

async function readCursor(cursorKey: string): Promise<string> {
  const cursor = await db.syncState.get(cursorKey);
  if (!cursor?.value) return '1970-01-01T00:00:00Z';
  return new Date(Date.parse(String(cursor.value)) - OVERLAP_MS).toISOString();
}

async function fetchPage(client: SupabaseClient, table: Table, from: string): Promise<unknown[]> {
  const { data, error } = await client
    .from(table)
    .select('*')
    .gt('synced_at', from)
    .order('synced_at', { ascending: true })
    .limit(PAGE_SIZE);
  if (error) throw error;
  return data ?? [];
}
