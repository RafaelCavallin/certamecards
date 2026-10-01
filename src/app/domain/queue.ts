import { State } from 'ts-fsrs';
import { liveCards } from './cards';
import { db, type Card, type Deck } from './db';
import { countIntroducedToday, interleave, isYoung } from './queue-mix';
import { hasAnyTag } from './tag-filter';

const FALLBACK_REVIEW_MS = 8000;
const MAX_REVIEW_MS = 60_000;
const RECENT_LOGS_LIMIT = 50;

export interface QueueFilter {
  tagKeys: string[];
}

export interface QueueContext {
  all: Card[];
  now: number;
  room: number;
}

export async function loadQueueContext(deck: Deck): Promise<QueueContext> {
  const all = await liveCards(deck.id).toArray();
  const introducedToday = await countIntroducedToday(deck.id);
  const roomByYoung = Math.max(0, deck.youngLimit - all.filter(isYoung).length);
  const roomByDaily = Math.max(0, deck.newCardsPerDay - introducedToday);
  return { all, now: Date.now(), room: Math.min(roomByYoung, roomByDaily) };
}

export function assembleQueue(context: QueueContext, matches: (card: Card) => boolean): Card[] {
  const candidates = context.all.filter(matches);
  const due = candidates
    .filter((card) => card.state !== State.New && card.due <= context.now)
    .sort((a, b) => a.due - b.due);
  const fresh = candidates
    .filter((card) => card.state === State.New)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, context.room);
  return interleave(due, fresh);
}

export function tagPredicate(tagKeys: readonly string[]): (card: Card) => boolean {
  if (tagKeys.length === 0) return () => true;
  const keys = new Set(tagKeys);
  return (card) => hasAnyTag(card, keys);
}

/**
 * Fila do dia: vencidos primeiro por data; novos entram apenas na
 * velocidade em que os anteriores são consolidados, limitados por
 * "novos por dia" e pelo teto de não firmados. O filtro de etiquetas
 * (OU) escolhe os candidatos; os limites do baralho valem depois dele.
 */
export async function buildQueue(deck: Deck, filter?: QueueFilter): Promise<Card[]> {
  const context = await loadQueueContext(deck);
  return assembleQueue(context, tagPredicate(filter?.tagKeys ?? []));
}

export async function queueCount(deck: Deck): Promise<number> {
  return (await buildQueue(deck)).length;
}

/** Soma de vários baralhos — o total pendente que o indicador do cabeçalho mostra (RF20). */
export async function totalQueueCount(decks: Deck[]): Promise<number> {
  const sizes = await Promise.all(decks.map(queueCount));
  return sizes.reduce((sum, n) => sum + n, 0);
}

/** Média móvel do tempo por revisão — só para a estimativa da Home. */
export async function estimateMinutes(queueSize: number): Promise<number> {
  const recent = await db.reviewLogs.orderBy('reviewedAt').reverse().limit(RECENT_LOGS_LIMIT).toArray();
  const average = recent.length
    ? recent.reduce((sum, log) => sum + Math.min(log.durationMs || FALLBACK_REVIEW_MS, MAX_REVIEW_MS), 0) /
      recent.length
    : FALLBACK_REVIEW_MS;
  return Math.max(1, Math.round((queueSize * average) / 60_000));
}
