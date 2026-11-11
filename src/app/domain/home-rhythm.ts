import { State } from 'ts-fsrs';
import { DAY, iso, startOfToday } from './dates';
import type { Card } from './db';
import type { ForecastDay, Stats } from './stats';

export const FORECAST_PREVIEW_DAYS = 7;
const PERCENT = 100;
const TOMORROW_INDEX = 1;
const EMPTY_WITH_LEARNING = 'Nada agendado para os próximos dias. Os cartões em aprendizado voltam ainda hoje.';
const EMPTY_FORECAST = 'Nada agendado para os próximos 7 dias.';

export interface HomeRhythm {
  streak: number;
  retention30: number | null;
  reviewedToday: number;
  laterToday: number;
  forecast: ForecastDay[];
}

export function homeRhythm(stats: Stats, cards: readonly Card[], now: Date): HomeRhythm {
  return {
    streak: stats.streak,
    retention30: stats.retention30,
    reviewedToday: stats.byDay.get(iso(now)) ?? 0,
    laterToday: countDueLaterToday(cards, now.getTime()),
    forecast: stats.forecast.slice(TOMORROW_INDEX, TOMORROW_INDEX + FORECAST_PREVIEW_DAYS),
  };
}

export function countDueLaterToday(cards: readonly Card[], now: number): number {
  const endOfToday = startOfToday(now) + DAY;
  return cards.filter((card) => card.state !== State.New && card.due > now && card.due < endOfToday).length;
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

function cardsLabel(count: number): string {
  return `${count} ${count === 1 ? 'cartão' : 'cartões'}`;
}

export function laterTodayLabel(count: number): string | null {
  return count === 0 ? null : `ainda hoje: ${cardsLabel(count)}`;
}

export function forecastEmptyMessage(rhythm: HomeRhythm): string | null {
  if (rhythm.forecast.some((day) => day.count > 0)) return null;
  return rhythm.laterToday > 0 ? EMPTY_WITH_LEARNING : EMPTY_FORECAST;
}

export function tomorrowLabel(forecast: readonly ForecastDay[]): string | null {
  const tomorrow = forecast[0];
  if (!tomorrow) return null;
  return `amanhã: ${cardsLabel(tomorrow.count)}`;
}
