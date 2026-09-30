import { z } from 'zod';
import type { Deck } from './db';
import type { Parsed } from './sync-rows-types';

const deckSchema = z.object({
  id: z.string(),
  name: z.string(),
  new_cards_per_day: z.number(),
  young_limit: z.number(),
  request_retention: z.number(),
  fsrs_params: z.array(z.number()).nullish(),
  params_optimized_at: z.number().nullish(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number(),
  synced_at: z.string(),
});

export function parseDeckRow(raw: unknown): Parsed<Deck> | null {
  const parsed = deckSchema.safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data;
  const row: Deck = {
    id: data.id,
    name: data.name,
    newCardsPerDay: data.new_cards_per_day,
    youngLimit: data.young_limit,
    requestRetention: data.request_retention,
    fsrsParams: data.fsrs_params ?? undefined,
    paramsOptimizedAt: data.params_optimized_at ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
    dirty: 0,
  };
  return { row, syncedAt: data.synced_at };
}

export function toDeckRow(row: Deck): object {
  return {
    id: row.id,
    name: row.name,
    new_cards_per_day: row.newCardsPerDay,
    young_limit: row.youngLimit,
    request_retention: row.requestRetention,
    fsrs_params: row.fsrsParams ?? null,
    params_optimized_at: row.paramsOptimizedAt ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt,
  };
}
