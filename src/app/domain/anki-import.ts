import { contentKey, dropDuplicates } from './anki-dedupe';
import type { CardDraft } from './anki-draft';
import { AnkiImportError } from './anki-errors';
import { liveCards, newCardRecord, type NewCardInput } from './cards';
import { db, type Card, type Deck } from './db';
import { deckNameOrFallback, newDeckRecord } from './decks';

export const INSERT_CHUNK_SIZE = 500;

export type ImportTarget = { kind: 'existing'; deckId: string } | { kind: 'new'; name: string };

export interface ImportInput {
  drafts: readonly CardDraft[];
  target: ImportTarget;
  signal: AbortSignal;
  onProgress: (done: number, total: number) => void;
  chunkSize?: number;
}

export interface ImportOutcome {
  deckId: string;
  deckName: string;
  created: number;
  duplicates: number;
}

export async function existingContentKeys(deckId: string): Promise<Set<string>> {
  const cards = await liveCards(deckId).toArray();
  return new Set(cards.map(contentKey));
}

export async function importDrafts(input: ImportInput): Promise<ImportOutcome> {
  return db.transaction('rw', db.decks, db.cards, () => writeImport(input));
}

async function writeImport(input: ImportInput): Promise<ImportOutcome> {
  const { target } = input;
  const deck = target.kind === 'new' ? newDeckRecord(deckNameOrFallback(target.name)) : await liveDeck(target.deckId);
  const existing = target.kind === 'existing' ? await existingContentKeys(deck.id) : new Set<string>();
  const { unique, duplicates } = dropDuplicates(input.drafts, existing);
  if (unique.length === 0) return { deckId: deck.id, deckName: deck.name, created: 0, duplicates };
  if (target.kind === 'new') await db.decks.add(deck);
  await insertInChunks(toCards(unique, deck.id), input);
  return { deckId: deck.id, deckName: deck.name, created: unique.length, duplicates };
}

async function liveDeck(deckId: string): Promise<Deck> {
  const deck = await db.decks.get(deckId);
  if (!deck || deck.deletedAt !== 0) throw new Error('Baralho de destino não encontrado.');
  return deck;
}

function toCards(drafts: readonly CardDraft[], deckId: string): Card[] {
  const now = Date.now();
  return drafts.map((draft, index) => ({
    ...newCardRecord(cardInput(draft, deckId), now),
    createdAt: now + index,
    updatedAt: now + index,
  }));
}

function cardInput(draft: CardDraft, deckId: string): NewCardInput {
  return { deckId, front: draft.front, back: draft.back, notes: draft.notes, marks: draft.marks, tags: draft.tags };
}

async function insertInChunks(cards: readonly Card[], input: ImportInput): Promise<void> {
  const size = input.chunkSize ?? INSERT_CHUNK_SIZE;
  for (let start = 0; start < cards.length; start += size) {
    if (input.signal.aborted) throw new AnkiImportError('cancelled');
    await db.cards.bulkAdd(cards.slice(start, start + size));
    input.onProgress(Math.min(start + size, cards.length), cards.length);
  }
}
