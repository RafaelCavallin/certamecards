import type { Card } from './db';
import { tagKey } from './tags';

export function hasAllTags(card: Card, keys: readonly string[]): boolean {
  const cardKeys = new Set(card.tags.map(tagKey));
  return keys.every((key) => cardKeys.has(key));
}

export function hasAnyTag(card: Card, keys: ReadonlySet<string>): boolean {
  return card.tags.some((tag) => keys.has(tagKey(tag)));
}

export function filterCardsByTags(cards: readonly Card[], keys: readonly string[]): Card[] {
  return cards.filter((card) => hasAllTags(card, keys));
}
