import { describe, expect, it } from 'vitest';
import { makeTaggedCard } from '../../test/card-fixtures';
import type { DifficultCard } from './difficulty';
import {
  answerReinforce,
  dropMissing,
  pickReinforceCards,
  reinforceProgress,
  startReinforce,
  summarizeReinforce,
  type ReinforceState,
} from './reinforce';
import type { BinaryRating } from './scheduler';

function difficult(count: number): DifficultCard[] {
  return Array.from({ length: count }, (_, i) => ({
    card: makeTaggedCard(`c${i}`, []),
    score: 100 - i,
    recentErrors: 0,
    totalErrors: 0,
    lastErrorAt: null,
  }));
}

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

function play(state: ReinforceState, ratings: BinaryRating[]): ReinforceState {
  return ratings.reduce(answerReinforce, state);
}

describe('pickReinforceCards', () => {
  it('pega exatamente os 30 de maior pontuação', () => {
    const ids = pickReinforceCards(difficult(45), sequence([0.3, 0.7]));

    expect([...ids].sort()).toEqual(difficult(30).map((item) => item.card.id).sort());
  });

  it('embaralha de forma diferente com sorteios diferentes', () => {
    const first = pickReinforceCards(difficult(10), sequence([0.1, 0.9, 0.5]));
    const second = pickReinforceCards(difficult(10), sequence([0.8, 0.2, 0.6]));

    expect(first).not.toEqual(second);
  });

  it('devolve todos quando há menos de 30', () => {
    expect(pickReinforceCards(difficult(12), Math.random)).toHaveLength(12);
  });
});

describe('answerReinforce', () => {
  const five = startReinforce(['a', 'b', 'c', 'd', 'e']);

  it('manda o cartão errado para o fim da fila', () => {
    const next = play(five, ['good', 'again']);

    expect([next.pending, next.misses]).toEqual([['c', 'd', 'e', 'b'], { b: 1 }]);
  });

  it('só avança o contador no acerto', () => {
    const next = play(five, ['good', 'again', 'good', 'good', 'good']);

    expect(reinforceProgress(next)).toEqual({ done: 4, total: 5 });
  });

  it('encerra quando o cartão errado finalmente é acertado', () => {
    const next = play(five, ['good', 'again', 'good', 'good', 'good', 'good']);

    expect([next.pending, reinforceProgress(next)]).toEqual([[], { done: 5, total: 5 }]);
  });

  it('não altera o estado recebido', () => {
    answerReinforce(five, 'again');

    expect(five).toEqual({ pending: ['a', 'b', 'c', 'd', 'e'], cleared: [], misses: {} });
  });

  it('com a fila vazia devolve o mesmo estado', () => {
    const empty = startReinforce([]);

    expect(answerReinforce(empty, 'good')).toBe(empty);
  });
});

describe('summarizeReinforce', () => {
  it('conta acertos de primeira e lista os errados na ordem do primeiro erro', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const ratings: BinaryRating[] = [
      'good', 'good', 'again', 'again', 'again', 'good', 'good', 'good', 'good', 'good',
      'again', 'good', 'good', 'good',
    ];
    const state = play(startReinforce(ids), ratings);

    expect(summarizeReinforce(state)).toEqual({
      total: 10,
      firstTry: 7,
      missed: [{ id: 'c', misses: 2 }, { id: 'd', misses: 1 }, { id: 'e', misses: 1 }],
    });
  });

  it('não lista errados quando todos acertam de primeira', () => {
    const state = play(startReinforce(['a', 'b']), ['good', 'good']);

    expect(summarizeReinforce(state)).toEqual({ total: 2, firstTry: 2, missed: [] });
  });
});

describe('dropMissing', () => {
  it('tira o excluído do total e mantém os já acertados', () => {
    const state = play(startReinforce(['a', 'b', 'c']), ['good']);

    const next = dropMissing(state, new Set(['c']));

    expect([next.pending, next.cleared, reinforceProgress(next).total]).toEqual([['c'], ['a'], 2]);
  });

  it('encerra a sessão quando todos os pendentes somem', () => {
    const next = dropMissing(startReinforce(['a', 'b']), new Set());

    expect(next.pending).toEqual([]);
  });
});
