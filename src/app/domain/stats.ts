import { State } from 'ts-fsrs';
import { liveCards } from './cards';
import { DAY, iso, startOfToday } from './dates';
import { db, type Card, type Deck, type ReviewLog } from './db';
import { currentStreak } from './stats-streak';

const RETENTION_WINDOW_DAYS = 30;
const FORECAST_DAYS = 14;
const MATURE_STABILITY_DAYS = 21;

export interface ForecastDay {
  day: string;
  count: number;
}

export interface Maturity {
  new: number;
  learning: number;
  mature: number;
}

export interface Stats {
  retention30: number | null;
  reviews30: number;
  reviewsTotal: number;
  streak: number;
  byDay: Map<string, number>;
  forecast: ForecastDay[];
  maturity: Maturity;
}

function buildByDay(logs: ReviewLog[]): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const log of logs) {
    const key = iso(new Date(log.reviewedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return byDay;
}

/** Carga futura: quantos cartões vencem em cada um dos próximos 14 dias. */
function buildForecast(cards: Card[]): ForecastDay[] {
  const start = startOfToday();
  return Array.from({ length: FORECAST_DAYS }, (_, i) => {
    const from = start + i * DAY;
    const to = from + DAY;
    const count = cards.filter(
      (card) => card.state !== State.New && card.due >= (i === 0 ? 0 : from) && card.due < to,
    ).length;
    const day =
      i === 0 ? 'hoje' : new Date(from).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return { day, count };
  });
}

function buildMaturity(cards: Card[]): Maturity {
  const learningStates = cards.filter((c) => c.state === State.Learning || c.state === State.Relearning);
  const review = cards.filter((c) => c.state === State.Review);
  return {
    new: cards.filter((c) => c.state === State.New).length,
    learning: review.filter((c) => c.stability < MATURE_STABILITY_DAYS).length + learningStates.length,
    mature: review.filter((c) => c.stability >= MATURE_STABILITY_DAYS).length,
  };
}

export async function computeStats(deck: Deck): Promise<Stats> {
  const [logs, cards, allCards] = await Promise.all([
    db.reviewLogs.toArray(),
    liveCards(deck.id).toArray(),
    db.cards.toArray(),
  ]);

  const byDay = buildByDay(logs);
  const cutoff = Date.now() - RETENTION_WINDOW_DAYS * DAY;
  const recent = logs.filter((log) => log.reviewedAt >= cutoff);
  const retention30 = recent.length
    ? recent.filter((log) => log.rating === 'good').length / recent.length
    : null;

  return {
    retention30,
    reviews30: recent.length,
    reviewsTotal: logs.length,
    streak: currentStreak(byDay, allCards, logs),
    byDay,
    forecast: buildForecast(cards),
    maturity: buildMaturity(cards),
  };
}
