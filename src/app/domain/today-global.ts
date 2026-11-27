import { liveCards } from './cards';
import type { Deck } from './db';
import { liveDecks } from './decks';
import { countDueLaterToday } from './home-rhythm';
import { queueCount } from './queue';

async function countDeckToday(deck: Deck, now: number): Promise<number> {
  const [pending, cards] = await Promise.all([queueCount(deck), liveCards(deck.id).toArray()]);
  return pending + countDueLaterToday(cards, now);
}

/** Quanto falta estudar hoje em todos os baralhos: o que já venceu (fila) mais o que volta ainda hoje. */
export async function countTodayAcrossDecks(now: number): Promise<number> {
  const decks = await liveDecks();
  const counts = await Promise.all(decks.map((deck) => countDeckToday(deck, now)));
  return counts.reduce((sum, count) => sum + count, 0);
}
