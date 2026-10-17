import type { Card } from './db';
import { tagKey, type TagSummary } from './tags';

export const UNTAGGED_KEY = 'SEM-ETIQUETA';
export const UNTAGGED_NAME = 'Sem etiqueta';

export function isUntagged(card: Card): boolean {
  return card.tags.length === 0;
}

export function countUntagged(cards: readonly Card[]): number {
  return cards.filter(isUntagged).length;
}

export function hasAnyTag(card: Card, keys: ReadonlySet<string>): boolean {
  if (keys.has(UNTAGGED_KEY) && isUntagged(card)) return true;
  return card.tags.some((tag) => keys.has(tagKey(tag)));
}

export function filterCardsByTags(cards: readonly Card[], keys: readonly string[]): Card[] {
  if (keys.length === 0) return [...cards];
  const wanted = new Set(keys);
  return cards.filter((card) => hasAnyTag(card, wanted));
}

export function withUntaggedOption(options: readonly TagSummary[], count: number): TagSummary[] {
  if (options.length === 0 || count === 0) return [...options];
  return [{ key: UNTAGGED_KEY, name: UNTAGGED_NAME, count }, ...options];
}
