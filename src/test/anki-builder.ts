import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { zipSync } from 'fflate';
import initSqlJs from 'sql.js';
import type { WasmLoader } from '../app/domain/anki-reader';

export interface BuilderNotetype {
  id: number;
  name: string;
  fields: string[];
  type?: number;
}

export interface BuilderNote {
  notetypeId: number;
  fields: string[];
  tags?: string;
  deckId?: number;
}

export interface BuilderInput {
  notetypes: BuilderNotetype[];
  notes: BuilderNote[];
  decks?: { id: number; name: string }[];
  entry?: 'collection.anki2' | 'collection.anki21';
}

const DEFAULT_DECK_ID = 1;
const LEGACY_SCHEMA = [
  'CREATE TABLE col (id integer primary key, models text, decks text)',
  'CREATE TABLE notes (id integer primary key, guid text, mid integer, mod integer, usn integer, tags text, flds text, sfld text, csum integer, flags integer, data text)',
  'CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer, odid integer)',
];

export const loadTestWasm: WasmLoader = async () => {
  const require = createRequire(import.meta.url);
  const bytes = await readFile(require.resolve('sql.js/dist/sql-wasm.wasm'));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

export async function buildLegacyCollection(input: BuilderInput): Promise<Uint8Array> {
  const SQL = await initSqlJs({ wasmBinary: await loadTestWasm() });
  const db = new SQL.Database();
  LEGACY_SCHEMA.forEach((sql) => db.run(sql));
  db.run('INSERT INTO col VALUES (1, ?, ?)', [modelsJson(input.notetypes), decksJson(input.decks)]);
  input.notes.forEach((note, index) => {
    const id = index + 1;
    db.run('INSERT INTO notes (id, mid, tags, flds) VALUES (?, ?, ?, ?)', [
      id,
      note.notetypeId,
      note.tags ?? '',
      note.fields.join('\u001f'),
    ]);
    db.run('INSERT INTO cards VALUES (?, ?, ?, 0, 0)', [id, id, note.deckId ?? DEFAULT_DECK_ID]);
  });
  const bytes = db.export();
  db.close();
  return bytes;
}

export async function buildLegacyPackage(input: BuilderInput): Promise<Uint8Array> {
  const collection = await buildLegacyCollection(input);
  return zipSync({ [input.entry ?? 'collection.anki21']: collection, media: new TextEncoder().encode('{}') });
}

export function packageFile(bytes: Uint8Array, name = 'baralho.apkg'): File {
  return new File([bytes.slice().buffer], name);
}

function modelsJson(notetypes: readonly BuilderNotetype[]): string {
  const entries = notetypes.map((type) => [
    String(type.id),
    { name: type.name, type: type.type ?? 0, flds: type.fields.map((name, ord) => ({ name, ord })) },
  ]);
  return JSON.stringify(Object.fromEntries(entries));
}

function decksJson(decks: BuilderInput['decks']): string {
  const list = decks ?? [{ id: DEFAULT_DECK_ID, name: 'Padrão' }];
  return JSON.stringify(Object.fromEntries(list.map((deck) => [String(deck.id), { name: deck.name }])));
}
