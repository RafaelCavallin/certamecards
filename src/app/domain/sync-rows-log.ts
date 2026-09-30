import { z } from 'zod';
import type { ReviewLog } from './db';
import type { Parsed } from './sync-rows-types';

const fsrsStateSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
const ratingSchema = z.union([z.literal('again'), z.literal('good')]);

const logSchema = z.object({
  id: z.string(),
  card_id: z.string(),
  deck_id: z.string(),
  rating: ratingSchema,
  reviewed_at: z.number(),
  state_before: fsrsStateSchema,
  scheduled_days: z.number(),
  duration_ms: z.number(),
  synced_at: z.string(),
});

export function parseReviewLogRow(raw: unknown): Parsed<ReviewLog> | null {
  const parsed = logSchema.safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data;
  const row: ReviewLog = {
    id: data.id,
    cardId: data.card_id,
    deckId: data.deck_id,
    rating: data.rating,
    reviewedAt: data.reviewed_at,
    stateBefore: data.state_before,
    scheduledDays: data.scheduled_days,
    durationMs: data.duration_ms,
    dirty: 0,
  };
  return { row, syncedAt: data.synced_at };
}

export function toLogRow(row: ReviewLog): object {
  return {
    id: row.id,
    card_id: row.cardId,
    deck_id: row.deckId,
    rating: row.rating,
    reviewed_at: row.reviewedAt,
    state_before: row.stateBefore,
    scheduled_days: row.scheduledDays,
    duration_ms: row.durationMs,
  };
}
