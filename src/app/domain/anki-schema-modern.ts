import {
  CLOZE_KIND,
  IMAGE_OCCLUSION_STOCK_KIND,
  readNotetypeConfig,
} from './anki-notetype-config';
import { idText, queryRows, type AnkiNotetype, type NotetypeKind, type SqlRunner } from './anki-types';

const MODERN_DECK_SEPARATOR = '\u001f';
const DECK_PATH_SEPARATOR = '::';

interface FieldRow {
  notetypeId: string;
  ord: number;
  name: string;
}

export function readModernNotetypes(db: SqlRunner): AnkiNotetype[] {
  const fields = groupFieldNames(readFieldRows(db));
  return queryRows(db, 'SELECT id, name, config FROM notetypes').map(([id, name, config]) => ({
    id: idText(id),
    name: String(name ?? ''),
    fields: fields.get(idText(id)) ?? [],
    kind: kindOf(config),
  }));
}

export function readModernDecks(db: SqlRunner): Map<string, string> {
  const rows = queryRows(db, 'SELECT id, name FROM decks');
  return new Map(
    rows.map(([id, name]) => [idText(id), String(name ?? '').replaceAll(MODERN_DECK_SEPARATOR, DECK_PATH_SEPARATOR)]),
  );
}

function readFieldRows(db: SqlRunner): FieldRow[] {
  return queryRows(db, 'SELECT ntid, ord, name FROM fields').map(([notetypeId, ord, name]) => ({
    notetypeId: idText(notetypeId),
    ord: Number(ord),
    name: String(name ?? ''),
  }));
}

function groupFieldNames(rows: readonly FieldRow[]): Map<string, string[]> {
  const sorted = [...rows].sort((a, b) => a.ord - b.ord);
  const byNotetype = new Map<string, string[]>();
  for (const row of sorted) {
    byNotetype.set(row.notetypeId, [...(byNotetype.get(row.notetypeId) ?? []), row.name]);
  }
  return byNotetype;
}

function kindOf(config: unknown): NotetypeKind {
  if (!(config instanceof Uint8Array)) return 'normal';
  const parsed = readNotetypeConfig(config);
  if (parsed.originalStockKind === IMAGE_OCCLUSION_STOCK_KIND) return 'image-occlusion';
  return parsed.kind === CLOZE_KIND ? 'cloze' : 'normal';
}
