import { describe, expect, it } from 'vitest';
import { makeTaggedCard } from '../../test/card-fixtures';
import { DAY } from './dates';
import type { ReviewLog } from './db';
import {
  countRecentErrors,
  difficultyScore,
  isDifficult,
  rankDifficult,
  summarizeErrorHistory,
  type ErrorHistory,
} from './difficulty';

const NOW = Date.parse('2026-03-09T12:00:00Z');

function makeLog(cardId: string, rating: ReviewLog['rating'], reviewedAt: number): ReviewLog {
  return { id: `${cardId}-${reviewedAt}-${rating}`, cardId, deckId: 'deck-1', rating, reviewedAt, stateBefore: 2, scheduledDays: 1, durationMs: 1000, dirty: 0 };
}

describe('difficultyScore e corte', () => {
  it('dobra os lapsos e soma os erros recentes', () => {
    expect(difficultyScore({ lapses: 2, recentErrors: 1 })).toBe(5);
  });

  it('inclui pontuação 5 e deixa de fora pontuação 2', () => {
    const cards = [makeTaggedCard('a', [], { lapses: 2 }), makeTaggedCard('b', [], { lapses: 1 })];

    const ranked = rankDifficult({ cards, recent: new Map([['a', 1]]), history: new Map(), streaks: new Map() });

    expect(ranked.map((entry) => [entry.card.id, entry.score])).toEqual([['a', 5]]);
  });

  it('inclui pontuação 3 vinda só de erros recentes', () => {
    const cards = [makeTaggedCard('a', [])];

    const ranked = rankDifficult({ cards, recent: new Map([['a', 3]]), history: new Map(), streaks: new Map() });

    expect(ranked).toHaveLength(1);
  });
});

describe('rankDifficult e a saída por acertos seguidos', () => {
  const cards = [makeTaggedCard('a', [], { lapses: 4 })];

  it('tira o cartão com 3 acertos seguidos mesmo com lapsos', () => {
    const ranked = rankDifficult({ cards, recent: new Map(), history: new Map(), streaks: new Map([['a', 3]]) });

    expect(ranked).toEqual([]);
  });

  it('mantém o cartão com 2 acertos seguidos e informa a sequência', () => {
    const ranked = rankDifficult({ cards, recent: new Map(), history: new Map(), streaks: new Map([['a', 2]]) });

    expect(ranked.map((entry) => [entry.card.id, entry.streak])).toEqual([['a', 2]]);
  });

  it('isDifficult aplica pontuação e sequência juntas', () => {
    const card = makeTaggedCard('a', [], { lapses: 1 });

    expect([isDifficult(card, new Map([['a', 1]]), new Map()), isDifficult(card, new Map([['a', 1]]), new Map([['a', 3]])), isDifficult(card, new Map(), new Map())]).toEqual([true, false, false]);
  });
});

describe('countRecentErrors', () => {
  const since = NOW - 30 * DAY;

  it('conta o erro exatamente no limite da janela', () => {
    const counts = countRecentErrors([makeLog('a', 'again', since)], since);

    expect(counts.get('a')).toBe(1);
  });

  it('ignora o erro um milissegundo antes da janela', () => {
    const counts = countRecentErrors([makeLog('a', 'again', since - 1)], since);

    expect(counts.has('a')).toBe(false);
  });

  it('nunca conta acertos', () => {
    const counts = countRecentErrors([makeLog('a', 'good', NOW)], since);

    expect(counts.has('a')).toBe(false);
  });
});

describe('rankDifficult ordem', () => {
  it('ordena por pontuação, último erro e criação, e põe quem não tem data por último', () => {
    const cards = [
      makeTaggedCard('s5-old', [], { lapses: 2, createdAt: 1 }),
      makeTaggedCard('s5-new', [], { lapses: 2, createdAt: 2 }),
      makeTaggedCard('s7', [], { lapses: 3 }),
      makeTaggedCard('s5-none', [], { lapses: 2, createdAt: 0 }),
    ];
    const recent = new Map([['s7', 1], ['s5-old', 1], ['s5-new', 1], ['s5-none', 1]]);
    const history = new Map<string, ErrorHistory>([
      ['s7', { total: 4, lastAt: NOW - 3 * DAY }],
      ['s5-old', { total: 3, lastAt: NOW - 10 * DAY }],
      ['s5-new', { total: 3, lastAt: NOW - DAY }],
    ]);

    const ranked = rankDifficult({ cards, recent, history, streaks: new Map() });

    expect(ranked.map((entry) => entry.card.id)).toEqual(['s7', 's5-new', 's5-old', 's5-none']);
  });

  it('desempata pela criação mais antiga quando tudo é igual', () => {
    const cards = [makeTaggedCard('b', [], { lapses: 2, createdAt: 9 }), makeTaggedCard('a', [], { lapses: 2, createdAt: 3 })];

    const ranked = rankDifficult({ cards, recent: new Map([['a', 1], ['b', 1]]), history: new Map(), streaks: new Map() });

    expect(ranked.map((entry) => entry.card.id)).toEqual(['a', 'b']);
  });

  it('exclui cartão apagado mesmo que venha na entrada', () => {
    const cards = [makeTaggedCard('gone', [], { lapses: 5, deletedAt: 10 })];

    expect(rankDifficult({ cards, recent: new Map(), history: new Map(), streaks: new Map() })).toEqual([]);
  });
});

describe('summarizeErrorHistory', () => {
  it('guarda o total de erros e o mais recente', () => {
    const logs = [makeLog('a', 'again', 100), makeLog('a', 'again', 300), makeLog('a', 'again', 200), makeLog('a', 'again', 50), makeLog('a', 'good', 900)];

    expect(summarizeErrorHistory(logs).get('a')).toEqual({ total: 4, lastAt: 300 });
  });

  it('omite o cartão sem nenhum erro', () => {
    expect(summarizeErrorHistory([makeLog('a', 'good', 100)]).has('a')).toBe(false);
  });
});
