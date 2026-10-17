import { liveCards } from './cards';
import type { Deck } from './db';
import { homeRhythm, type HomeRhythm } from './home-rhythm';
import type { HomeFilterInfo } from './home-summary';
import { estimateMinutes, buildQueue, queueCount } from './queue';
import { tagQueueCounts } from './queue-tags';
import { computeStats } from './stats';
import { summarizeTags } from './tag-catalog';
import { countUntagged, withUntaggedOption } from './tag-filter';
import type { TagSummary } from './tags';

export interface HomeSnapshot {
  total: number;
  queueSize: number;
  minutes: number;
  byDay: Map<string, number>;
  options: TagSummary[];
  existingKeys: Set<string>;
  filter: HomeFilterInfo | null;
  rhythm: HomeRhythm;
}

export async function loadHomeSnapshot(deck: Deck, studyKeys: readonly string[]): Promise<HomeSnapshot> {
  const cards = await liveCards(deck.id).toArray();
  const tags = withUntaggedOption(summarizeTags(cards), countUntagged(cards));
  const existingKeys = new Set(tags.map((tag) => tag.key));
  const activeKeys = studyKeys.filter((key) => existingKeys.has(key));
  const [queue, stats, counts] = await Promise.all([
    buildQueue(deck, { tagKeys: activeKeys }),
    computeStats(deck),
    tagQueueCounts(deck, [...existingKeys]),
  ]);
  const options = tags.map((tag) => ({ ...tag, count: counts.get(tag.key) ?? 0 }));
  const filter = await describeFilter(deck, tags, activeKeys);
  const minutes = await estimateMinutes(queue.length);
  const rhythm = homeRhythm(stats, new Date());
  return { total: cards.length, queueSize: queue.length, minutes, byDay: stats.byDay, options, existingKeys, filter, rhythm };
}

async function describeFilter(
  deck: Deck,
  tags: readonly TagSummary[],
  activeKeys: readonly string[],
): Promise<HomeFilterInfo | null> {
  if (activeKeys.length === 0) return null;
  const names = tags.filter((tag) => activeKeys.includes(tag.key)).map((tag) => tag.name);
  return { names, unfilteredSize: await queueCount(deck) };
}
