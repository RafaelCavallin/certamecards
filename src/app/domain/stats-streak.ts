import { DAY, iso } from './dates';
import type { Card, ReviewLog } from './db';

function groupLogsByCard(logs: ReviewLog[]): Map<string, ReviewLog[]> {
  const byCard = new Map<string, ReviewLog[]>();
  for (const log of logs) {
    const list = byCard.get(log.cardId);
    if (list) list.push(log);
    else byCard.set(log.cardId, [log]);
  }
  for (const list of byCard.values()) list.sort((a, b) => a.reviewedAt - b.reviewedAt);
  return byCard;
}

function earliestDayStart(cards: Card[], logs: ReviewLog[]): number | null {
  const earliestRaw = Math.min(...cards.map((c) => c.createdAt), ...logs.map((l) => l.reviewedAt));
  if (!Number.isFinite(earliestRaw)) return null;
  const day = new Date(earliestRaw);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
}

/**
 * Cartão vencido nesse dia = devido antes do fim do dia, considerando só
 * revisões anteriores ao início do dia (o dia em questão ainda não teve
 * nenhuma revisão registrada).
 */
function hadCardDue(dayStart: number, cards: Card[], logsByCard: Map<string, ReviewLog[]>): boolean {
  const dayEnd = dayStart + DAY;
  return cards.some((card) => {
    let due = card.createdAt;
    for (const log of logsByCard.get(card.id) ?? []) {
      if (log.reviewedAt >= dayStart) break;
      due = log.reviewedAt + log.scheduledDays * DAY;
    }
    return due < dayEnd;
  });
}

/**
 * Dias seguidos de estudo. O dia de hoje ainda em branco não quebra a
 * sequência, e um dia sem nenhum cartão vencido também não — só quebra
 * quando havia cartão esperando revisão e nenhuma revisão aconteceu
 * naquele dia (em qualquer baralho).
 */
export function currentStreak(byDay: Map<string, number>, cards: Card[], logs: ReviewLog[]): number {
  const logsByCard = groupLogsByCard(logs);
  const earliest = earliestDayStart(cards, logs);
  if (earliest === null) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!byDay.get(iso(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (cursor.getTime() >= earliest) {
    if (byDay.get(iso(cursor))) {
      streak++;
    } else if (hadCardDue(cursor.getTime(), cards, logsByCard)) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
