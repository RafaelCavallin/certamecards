import { db, type Card } from './db';
import { liveCards } from './cards';
import { tagKey, type TagSummary } from './tags';

export const SUGGESTIONS_MAX = 8;
const COLLATION_LOCALE = 'pt-BR';
const WORD_SPLIT_PATTERN = /[\s.,;:/\-()]+/;

export interface SuggestInput {
  catalog: readonly TagSummary[];
  query: string;
  exclude: readonly string[];
  limit?: number;
}

interface TagBucket {
  key: string;
  count: number;
  spellings: Map<string, number>;
}

export function compareTagNames(a: TagSummary, b: TagSummary): number {
  return a.key.localeCompare(b.key, COLLATION_LOCALE);
}

export function summarizeTags(cards: readonly Card[]): TagSummary[] {
  const buckets = new Map<string, TagBucket>();
  for (const card of cards) collectCardTags(buckets, card);
  return [...buckets.values()].map(toSummary).sort(compareTagNames);
}

function collectCardTags(buckets: Map<string, TagBucket>, card: Card): void {
  const countedKeys = new Set<string>();
  for (const tag of card.tags) {
    const key = tagKey(tag);
    const bucket = buckets.get(key) ?? { key, count: 0, spellings: new Map() };
    bucket.spellings.set(tag, (bucket.spellings.get(tag) ?? 0) + 1);
    if (!countedKeys.has(key)) bucket.count += 1;
    countedKeys.add(key);
    buckets.set(key, bucket);
  }
}

function toSummary(bucket: TagBucket): TagSummary {
  const [name] = [...bucket.spellings.entries()].sort(
    ([nameA, usesA], [nameB, usesB]) =>
      usesB - usesA || nameA.localeCompare(nameB, COLLATION_LOCALE),
  )[0];
  return { key: bucket.key, name, count: bucket.count };
}

export async function listTagCatalog(): Promise<TagSummary[]> {
  const liveDeckIds = new Set(await db.decks.where('deletedAt').equals(0).primaryKeys());
  const cards = await db.cards
    .where('deletedAt')
    .equals(0)
    .filter((card) => liveDeckIds.has(card.deckId))
    .toArray();
  return summarizeTags(cards);
}

export async function listDeckTags(deckId: string): Promise<TagSummary[]> {
  return summarizeTags(await liveCards(deckId).toArray());
}

export function suggestTags(input: SuggestInput): TagSummary[] {
  const needle = tagKey(input.query);
  if (!needle) return [];
  const excluded = new Set(input.exclude.map(tagKey));
  return input.catalog
    .filter((entry) => !excluded.has(entry.key) && startsSomeWord(entry.key, needle))
    .sort((a, b) => b.count - a.count || compareTagNames(a, b))
    .slice(0, input.limit ?? SUGGESTIONS_MAX);
}

function startsSomeWord(key: string, needle: string): boolean {
  return key.split(WORD_SPLIT_PATTERN).some((word) => word.startsWith(needle));
}
