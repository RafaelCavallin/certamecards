import { iso } from './dates';
import type { ForecastDay, Stats } from './stats';

export const FORECAST_PREVIEW_DAYS = 7;
const PERCENT = 100;
const TOMORROW_INDEX = 1;

export interface HomeRhythm {
  streak: number;
  retention30: number | null;
  reviewedToday: number;
  forecast: ForecastDay[];
}

export function homeRhythm(stats: Stats, today: Date): HomeRhythm {
  return {
    streak: stats.streak,
    retention30: stats.retention30,
    reviewedToday: stats.byDay.get(iso(today)) ?? 0,
    forecast: stats.forecast.slice(TOMORROW_INDEX, TOMORROW_INDEX + FORECAST_PREVIEW_DAYS),
  };
}

export function retentionLabel(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * PERCENT)}%`;
}

export function streakLabel(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`;
}

export function reviewsLabel(count: number): string {
  return count === 1 ? '1 revisão' : `${count} revisões`;
}

export function tomorrowLabel(forecast: readonly ForecastDay[]): string | null {
  const tomorrow = forecast[0];
  if (!tomorrow) return null;
  return `amanhã: ${tomorrow.count} ${tomorrow.count === 1 ? 'cartão' : 'cartões'}`;
}
