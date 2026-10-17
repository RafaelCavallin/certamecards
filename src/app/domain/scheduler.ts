import { fsrs, generatorParameters, Rating, type CardInput, type FSRS, type RecordLogItem } from 'ts-fsrs';
import { db, uid, type Card, type Deck, type ReviewLog } from './db';

/** Único ponto de tradução entre a UI binária e o algoritmo. */
export type BinaryRating = 'again' | 'good';

function toFsrsRating(rating: BinaryRating): Rating.Again | Rating.Good {
  return rating === 'again' ? Rating.Again : Rating.Good;
}

const instancesByRetention = new Map<number, FSRS>();

/** Uma instância do FSRS por `requestRetention` — o baralho decide a retenção alvo. */
function schedulerFor(requestRetention: number): FSRS {
  const cached = instancesByRetention.get(requestRetention);
  if (cached) return cached;
  const instance = fsrs(generatorParameters({ request_retention: requestRetention, enable_fuzz: true }));
  instancesByRetention.set(requestRetention, instance);
  return instance;
}

export interface AnswerInput {
  card: Card;
  deck: Deck;
  rating: BinaryRating;
  durationMs: number;
}

function toFsrsCardInput(card: Card): CardInput {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
  };
}

function buildLog(input: AnswerInput, next: RecordLogItem['card'], now: Date): ReviewLog {
  return {
    id: uid(),
    cardId: input.card.id,
    deckId: input.card.deckId,
    rating: input.rating,
    reviewedAt: now.getTime(),
    stateBefore: input.card.state,
    scheduledDays: next.scheduled_days,
    durationMs: input.durationMs,
    dirty: 1,
  };
}

/**
 * Aplica a resposta do usuário. O FSRS deduz a dificuldade do histórico — a
 * UI só informa se lembrou ou não. Card e log são gravados na mesma
 * transação: um sem o outro deixaria o histórico incoerente com o agendamento.
 */
export async function answer(input: AnswerInput): Promise<void> {
  const { card, deck, rating } = input;
  const now = new Date();
  const { card: next } = schedulerFor(deck.requestRetention).next(toFsrsCardInput(card), now, toFsrsRating(rating));
  const log = buildLog(input, next, now);
  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    await db.cards.update(card.id, {
      due: next.due.getTime(),
      stability: next.stability,
      difficulty: next.difficulty,
      elapsedDays: next.elapsed_days,
      scheduledDays: next.scheduled_days,
      learningSteps: next.learning_steps,
      reps: next.reps,
      lapses: next.lapses,
      state: next.state,
      lastReview: now.getTime(),
      updatedAt: now.getTime(),
    });
    await db.reviewLogs.add(log);
  });
}
