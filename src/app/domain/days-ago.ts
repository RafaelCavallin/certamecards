import { DAY, startOfToday } from './dates';
import type { DifficultCard } from './difficulty';
import { EXIT_STREAK } from './difficulty-streak';

export function formatDaysAgo(at: number, now: number): string {
  const days = Math.round((startOfToday(now) - startOfToday(at)) / DAY);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

export function difficultyCaption(item: DifficultCard, now: number): string {
  const times = Math.max(item.totalErrors, item.card.lapses);
  const errors = `errou ${times} ${times === 1 ? 'vez' : 'vezes'}`;
  const parts = [errors];
  if (item.lastErrorAt !== null) parts.push(`último erro ${formatDaysAgo(item.lastErrorAt, now)}`);
  if (item.streak > 0) parts.push(`${item.streak} de ${EXIT_STREAK} acertos para sair`);
  return parts.join(' · ');
}
