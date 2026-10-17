import type { TagSummary } from './tags';

export const QUICK_TAGS_MAX = 4;

export interface QuickTags {
  chips: TagSummary[];
  hasMore: boolean;
}

export function quickTags(options: readonly TagSummary[], selected: readonly string[]): QuickTags {
  const chosen = new Set(selected);
  const ranked = options.filter((option) => option.count > 0).sort((a, b) => b.count - a.count);
  const top = ranked.slice(0, QUICK_TAGS_MAX);
  const shown = new Set(top.map((option) => option.key));
  const extra = options.filter((option) => chosen.has(option.key) && !shown.has(option.key));
  const chips = [...top, ...extra];
  return { chips, hasMore: chips.length < options.length };
}

export function toggleKey(selected: readonly string[], key: string): string[] {
  if (selected.includes(key)) return selected.filter((item) => item !== key);
  return [...selected, key];
}
