import { z } from 'zod';
import type { Card } from './db';
import { cardMarksSchema } from './sync-rows-marks';
import type { Parsed } from './sync-rows-types';
import { normalizeTags } from './tags';
import { normalizeCardMarks } from './text-marks-normalize';

const fsrsStateSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

const cardSchema = z.object({
  id: z.string(),
  deck_id: z.string(),
  front: z.string(),
  back: z.string(),
  notes: z.string(),
  marks: cardMarksSchema,
  tags: z.array(z.string()).nullish(),
  due: z.number(),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: fsrsStateSchema,
  last_review: z.number().nullish(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number(),
  synced_at: z.string(),
});

export function parseCardRow(raw: unknown): Parsed<Card> | null {
  const parsed = cardSchema.safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data;
  const row: Card = {
    id: data.id,
    deckId: data.deck_id,
    front: data.front,
    back: data.back,
    notes: data.notes,
    marks: normalizeCardMarks(data.marks),
    tags: normalizeTags(data.tags ?? []),
    due: data.due,
    stability: data.stability,
    difficulty: data.difficulty,
    elapsedDays: data.elapsed_days,
    scheduledDays: data.scheduled_days,
    learningSteps: data.learning_steps,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state,
    lastReview: data.last_review ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
    dirty: 0,
  };
  return { row, syncedAt: data.synced_at };
}

export function toCardRow(row: Card): object {
  return {
    id: row.id,
    deck_id: row.deckId,
    front: row.front,
    back: row.back,
    notes: row.notes,
    marks: row.marks,
    tags: row.tags,
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsedDays,
    scheduled_days: row.scheduledDays,
    learning_steps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    last_review: row.lastReview ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt,
  };
}
