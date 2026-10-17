import { DAY, startOfToday } from './dates';
import { formatDaysAgo } from './days-ago';
import type { Card, FsrsState } from './db';

const DAYS_PER_MONTH = 30;
const MONTHS_FROM_DAYS = 60;

const STATE_LABELS: Record<FsrsState, string> = {
  0: 'Novo',
  1: 'Aprendendo',
  2: 'Em revisão',
  3: 'Reaprendendo',
};

export interface InfoRow {
  label: string;
  value: string;
}

export function intervalLabel(days: number): string {
  if (days < 1) return 'menos de 1 dia';
  if (days === 1) return '1 dia';
  if (days < MONTHS_FROM_DAYS) return `${days} dias`;
  return `${Math.round(days / DAYS_PER_MONTH)} meses`;
}

export function formatDaysAhead(at: number, now: number): string {
  const days = Math.round((startOfToday(at) - startOfToday(now)) / DAY);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'amanhã';
  return `em ${days} dias`;
}

function historyRows(card: Card, now: number): InfoRow[] {
  if (card.reps === 0) return [];
  return [
    { label: 'Revisões', value: String(card.reps) },
    { label: 'Esquecimentos', value: String(card.lapses) },
    { label: 'Última revisão', value: card.lastReview ? formatDaysAgo(card.lastReview, now) : '—' },
    { label: 'Próxima revisão', value: formatDaysAhead(card.due, now) },
    { label: 'Intervalo', value: intervalLabel(card.scheduledDays) },
  ];
}

export function cardInfoRows(card: Card, now: number): InfoRow[] {
  return [
    { label: 'Situação', value: STATE_LABELS[card.state] },
    ...historyRows(card, now),
    { label: 'Criado', value: formatDaysAgo(card.createdAt, now) },
  ];
}
