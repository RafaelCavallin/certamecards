import { DECK_NAME_MAX } from './card-limits';
import { classifyNotetype, type FieldMapping } from './anki-mapping';
import type { AnkiCollection, AnkiNote, AnkiNotetype } from './anki-types';

export interface SourceDeckSummary {
  name: string;
  count: number;
}

export interface SelectionInput {
  collection: AnkiCollection;
  decks: ReadonlySet<string>;
  mappings: Readonly<Record<string, FieldMapping>>;
}

const COLLATION_LOCALE = 'pt-BR';
const DECK_PATH_SEPARATOR = '::';
const FILE_EXTENSION = /\.[^.]+$/;
const FALLBACK_DECK_NAME = 'Importado do Anki';
const CLOZE_NUMBERS = /\{\{c(\d+)::/g;

export function summarizeSourceDecks(collection: AnkiCollection): SourceDeckSummary[] {
  const counts = new Map<string, number>();
  for (const note of collection.notes) counts.set(note.deck, (counts.get(note.deck) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, COLLATION_LOCALE));
}

export function selectedNotes(collection: AnkiCollection, decks: ReadonlySet<string>): AnkiNote[] {
  return collection.notes.filter((note) => decks.has(note.deck));
}

export function notetypesInSelection(collection: AnkiCollection, decks: ReadonlySet<string>): AnkiNotetype[] {
  const used = new Set(selectedNotes(collection, decks).map((note) => note.notetypeId));
  return collection.notetypes.filter((notetype) => used.has(notetype.id));
}

export function countPlannedCards(input: SelectionInput): number {
  const notetypes = new Map(input.collection.notetypes.map((notetype) => [notetype.id, notetype]));
  return selectedNotes(input.collection, input.decks).reduce((total, note) => {
    const notetype = notetypes.get(note.notetypeId);
    const mapping = input.mappings[note.notetypeId];
    if (!notetype || !mapping?.include) return total;
    return total + plannedForNote(note, notetype, mapping);
  }, 0);
}

function plannedForNote(note: AnkiNote, notetype: AnkiNotetype, mapping: FieldMapping): number {
  if (classifyNotetype(notetype) !== 'cloze') return 1;
  const field = note.fields[mapping.front] ?? '';
  return new Set([...field.matchAll(CLOZE_NUMBERS)].map((match) => match[1])).size;
}

export function toggleMember(set: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
}

export function suggestDeckName(input: { fileName: string; decks: readonly string[] }): string {
  const named = input.decks.filter((deck) => deck.length > 0);
  const base = named.length === 1 ? lastLevel(named[0]) : input.fileName.replace(FILE_EXTENSION, '');
  return base.trim().slice(0, DECK_NAME_MAX) || FALLBACK_DECK_NAME;
}

function lastLevel(deck: string): string {
  return deck.split(DECK_PATH_SEPARATOR).pop() ?? deck;
}
