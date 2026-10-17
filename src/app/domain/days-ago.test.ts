import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTaggedCard } from '../../test/card-fixtures';
import { difficultyCaption, formatDaysAgo } from './days-ago';
import type { DifficultCard } from './difficulty';

const NOW = new Date(2026, 2, 9, 0, 1).getTime();

function entry(overrides: Partial<DifficultCard>, lapses = 0): DifficultCard {
  return { card: makeTaggedCard('a', [], { lapses }), score: 3, recentErrors: 0, totalErrors: 0, lastErrorAt: null, ...overrides };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('formatDaysAgo', () => {
  it('diz hoje para o mesmo dia', () => {
    expect(formatDaysAgo(new Date(2026, 2, 9, 0, 0).getTime(), NOW)).toBe('hoje');
  });

  it('diz ontem para o dia civil anterior, mesmo a minutos de distância', () => {
    expect(formatDaysAgo(new Date(2026, 2, 8, 23, 59).getTime(), NOW)).toBe('ontem');
  });

  it('diz há N dias a partir de dois dias', () => {
    expect(formatDaysAgo(new Date(2026, 2, 4, 12, 0).getTime(), NOW)).toBe('há 5 dias');
  });
});

describe('difficultyCaption', () => {
  const yesterday = new Date(2026, 2, 8, 20, 0).getTime();

  it('usa o total de erros e a data do último', () => {
    expect(difficultyCaption(entry({ totalErrors: 4, lastErrorAt: yesterday }), NOW)).toBe('errou 4 vezes · último erro ontem');
  });

  it('usa o singular para um erro', () => {
    expect(difficultyCaption(entry({ totalErrors: 1, lastErrorAt: yesterday }), NOW)).toBe('errou 1 vez · último erro ontem');
  });

  it('cai nos lapsos e omite a data quando não há log local', () => {
    expect(difficultyCaption(entry({}, 2), NOW)).toBe('errou 2 vezes');
  });
});
