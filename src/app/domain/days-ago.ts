import { DAY, startOfToday } from './dates';
import type { DifficultCard } from './difficulty';

export function formatDaysAgo(at: number, now: number): string {
  const days = Math.round((startOfToday(now) - startOfToday(at)) / DAY);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

export function difficultyCaption(item: DifficultCard, now: number): string {
  const times = Math.max(item.totalErrors, item.card.lapses);
  const errors = `errou ${times} ${times === 1 ? 'vez' : 'vezes'}`;
  if (item.lastErrorAt === null) return errors;
  return `${errors} · último erro ${formatDaysAgo(item.lastErrorAt, now)}`;
}
