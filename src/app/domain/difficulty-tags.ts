import type { DifficultCard } from './difficulty';
import { summarizeTags } from './tag-catalog';
import { countUntagged, hasAnyTag, withUntaggedOption } from './tag-filter';
import type { TagSummary } from './tags';

export function filterDifficultByTags(list: readonly DifficultCard[], keys: readonly string[]): DifficultCard[] {
  if (keys.length === 0) return [...list];
  const wanted = new Set(keys);
  return list.filter((item) => hasAnyTag(item.card, wanted));
}

export function difficultTagOptions(list: readonly DifficultCard[]): TagSummary[] {
  const cards = list.map((item) => item.card);
  return withUntaggedOption(summarizeTags(cards), countUntagged(cards));
}
