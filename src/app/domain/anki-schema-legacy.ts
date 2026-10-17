import { z } from 'zod';
import { queryRows, type AnkiNotetype, type SqlRunner } from './anki-types';

const LEGACY_CLOZE_TYPE = 1;
const IMAGE_OCCLUSION_NAME = /oclus|occlusion/i;

const legacyModelSchema = z.object({
  name: z.string().catch(''),
  type: z.number().catch(0),
  flds: z.array(z.object({ name: z.string(), ord: z.number() })).catch([]),
});

const legacyDeckSchema = z.object({ name: z.string().catch('') });

export function readLegacyNotetypes(db: SqlRunner): AnkiNotetype[] {
  const models = parseRecord(readColumn(db, 'models'));
  return Object.entries(models).flatMap(([id, raw]) => {
    const parsed = legacyModelSchema.safeParse(raw);
    return parsed.success ? [toNotetype(id, parsed.data)] : [];
  });
}

export function readLegacyDecks(db: SqlRunner): Map<string, string> {
  const decks = parseRecord(readColumn(db, 'decks'));
  const names = new Map<string, string>();
  for (const [id, raw] of Object.entries(decks)) {
    const parsed = legacyDeckSchema.safeParse(raw);
    if (parsed.success && parsed.data.name) names.set(id, parsed.data.name);
  }
  return names;
}

function toNotetype(id: string, model: z.infer<typeof legacyModelSchema>): AnkiNotetype {
  const fields = [...model.flds].sort((a, b) => a.ord - b.ord).map((field) => field.name);
  return { id, name: model.name, fields, kind: legacyKind(model) };
}

function legacyKind(model: z.infer<typeof legacyModelSchema>): AnkiNotetype['kind'] {
  if (model.type !== LEGACY_CLOZE_TYPE) return 'normal';
  return IMAGE_OCCLUSION_NAME.test(model.name) ? 'image-occlusion' : 'cloze';
}

function readColumn(db: SqlRunner, column: 'models' | 'decks'): unknown {
  try {
    return queryRows(db, `SELECT ${column} FROM col`)[0]?.[0];
  } catch {
    return undefined;
  }
}

function parseRecord(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'string') return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return z.record(z.string(), z.unknown()).catch({}).parse(parsed);
  } catch {
    return {};
  }
}
