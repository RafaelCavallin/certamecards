import { describe, expect, it } from 'vitest';
import type { ReviewLog } from './db';
import { EXIT_STREAK, countReviewStreaks, hasLeftDifficult } from './difficulty-streak';

const LEARNING = 1;
const REVIEW = 2;
const RELEARNING = 3;

function makeLog(cardId: string, reviewedAt: number, rating: ReviewLog['rating'], stateBefore: ReviewLog['stateBefore'] = REVIEW): ReviewLog {
  return { id: `${cardId}-${reviewedAt}`, cardId, deckId: 'deck-1', rating, reviewedAt, stateBefore, scheduledDays: 1, durationMs: 1000, dirty: 0 };
}

describe('countReviewStreaks', () => {
  it('conta os acertos em revisão depois do último erro', () => {
    const logs = [makeLog('a', 1, 'again'), makeLog('a', 2, 'good'), makeLog('a', 3, 'good'), makeLog('a', 4, 'good')];

    expect(countReviewStreaks(logs).get('a')).toBe(3);
  });

  it('zera a sequência quando há um erro no meio', () => {
    const logs = [makeLog('a', 1, 'good'), makeLog('a', 2, 'good'), makeLog('a', 3, 'again'), makeLog('a', 4, 'good')];

    expect(countReviewStreaks(logs).get('a')).toBe(1);
  });

  it('não soma nem zera com acertos em aprendizado ou reaprendizado', () => {
    const logs = [
      makeLog('a', 1, 'good'),
      makeLog('a', 2, 'good', LEARNING),
      makeLog('a', 3, 'good', RELEARNING),
    ];

    expect(countReviewStreaks(logs).get('a')).toBe(1);
  });

  it('zera com erro feito em aprendizado', () => {
    const logs = [makeLog('a', 1, 'good'), makeLog('a', 2, 'again', LEARNING)];

    expect(countReviewStreaks(logs).get('a')).toBe(0);
  });

  it('ordena por data antes de contar', () => {
    const logs = [makeLog('a', 4, 'good'), makeLog('a', 1, 'again'), makeLog('a', 3, 'good'), makeLog('a', 2, 'good')];

    expect(countReviewStreaks(logs).get('a')).toBe(3);
  });

  it('separa as sequências por cartão', () => {
    const logs = [makeLog('a', 1, 'good'), makeLog('b', 2, 'again'), makeLog('a', 3, 'good')];

    expect([countReviewStreaks(logs).get('a'), countReviewStreaks(logs).get('b')]).toEqual([2, 0]);
  });

  it('deixa o cartão sem logs fora do mapa', () => {
    expect(countReviewStreaks([]).has('a')).toBe(false);
  });
});

describe('hasLeftDifficult', () => {
  it('só sai a partir do limite de acertos', () => {
    const streaks = new Map([['a', EXIT_STREAK], ['b', EXIT_STREAK - 1]]);

    expect([hasLeftDifficult('a', streaks), hasLeftDifficult('b', streaks), hasLeftDifficult('c', streaks)]).toEqual([true, false, false]);
  });
});
