import type { Card } from './db';
import { DIACRITICS_PATTERN } from './tags';

function normalize(text: string): string {
  return text.normalize('NFD').replace(DIACRITICS_PATTERN, '').toLowerCase();
}

/** Busca sem acento e sem caixa em Frente, Verso e Notas. */
export function searchCards(cards: Card[], query: string): Card[] {
  const needle = normalize(query.trim());
  if (!needle) return cards;
  return cards.filter((card) =>
    [card.front, card.back, card.notes].some((field) => normalize(field).includes(needle)),
  );
}
