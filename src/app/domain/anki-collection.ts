import { AnkiImportError } from './anki-errors';
import { readLegacyDecks, readLegacyNotetypes } from './anki-schema-legacy';
import { readModernDecks, readModernNotetypes } from './anki-schema-modern';
import {
  idText,
  queryRows,
  tableExists,
  type AnkiCollection,
  type AnkiNote,
  type SqlRunner,
} from './anki-types';

export const FIELD_SEPARATOR = '\u001f';

export function readCollection(db: SqlRunner, fileName: string): AnkiCollection {
  if (!tableExists(db, 'notes')) throw new AnkiImportError('not-anki');
  const modern = tableExists(db, 'notetypes');
  const notetypes = modern ? readModernNotetypes(db) : readLegacyNotetypes(db);
  const notes = readNotes(db, modern ? readModernDecks(db) : readLegacyDecks(db));
  if (notes.length === 0) throw new AnkiImportError('no-notes');
  const used = new Set(notes.map((note) => note.notetypeId));
  return { fileName, notetypes: notetypes.filter((type) => used.has(type.id)), notes };
}

function readNotes(db: SqlRunner, decks: ReadonlyMap<string, string>): AnkiNote[] {
  const noteDecks = readNoteDecks(db);
  return queryRows(db, 'SELECT id, mid, flds, tags FROM notes ORDER BY id')
    .map(([id, notetypeId, fields, tags]) => ({
      notetypeId: idText(notetypeId),
      fields: String(fields ?? '').split(FIELD_SEPARATOR),
      tags: String(tags ?? ''),
      deck: decks.get(noteDecks.get(idText(id)) ?? '') ?? '',
    }))
    .filter((note) => note.fields.some((field) => field.trim().length > 0));
}

function readNoteDecks(db: SqlRunner): Map<string, string> {
  const byNote = new Map<string, string>();
  if (!tableExists(db, 'cards')) return byNote;
  for (const [noteId, deckId, originalDeckId] of queryRows(db, 'SELECT nid, did, odid FROM cards ORDER BY ord')) {
    const key = idText(noteId);
    if (byNote.has(key)) continue;
    byNote.set(key, Number(originalDeckId) ? idText(originalDeckId) : idText(deckId));
  }
  return byNote;
}
