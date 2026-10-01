import type { Card } from '../app/domain/db';
import { EMPTY_CARD_MARKS } from '../app/domain/text-marks';

export function makeTaggedCard(id: string, tags: string[], overrides: Partial<Card> = {}): Card {
  return {
    id,
    deckId: 'deck-1',
    front: `Frente ${id}`,
    back: `Verso ${id}`,
    notes: '',
    marks: EMPTY_CARD_MARKS,
    tags,
    due: 1,
    stability: 1,
    difficulty: 1,
    elapsedDays: 0,
    scheduledDays: 1,
    learningSteps: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: 0,
    dirty: 0,
    ...overrides,
  };
}

export function makeDeck(id: string, deletedAt = 0) {
  return { id, name: id, newCardsPerDay: 10, youngLimit: 10, requestRetention: 0.9, createdAt: 1, updatedAt: 1, deletedAt, dirty: 0 as const };
}
