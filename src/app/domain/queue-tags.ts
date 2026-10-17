import type { Deck } from './db';
import { assembleQueue, loadQueueContext, tagPredicate } from './queue';

export async function tagQueueCounts(
  deck: Deck,
  keys: readonly string[],
): Promise<Map<string, number>> {
  const context = await loadQueueContext(deck);
  return new Map(keys.map((key) => [key, assembleQueue(context, tagPredicate([key])).length]));
}
