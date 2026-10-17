import { describe, expect, it } from 'vitest';
import { makeTaggedCard } from '../../test/card-fixtures';
import { cardInfoRows, formatDaysAhead, intervalLabel } from './card-history';

const NOW = new Date(2026, 2, 9, 15).getTime();
const DAY = 86_400_000;

describe('intervalLabel', () => {
  it('fala em dias até dois meses e em meses depois', () => {
    expect([intervalLabel(0), intervalLabel(1), intervalLabel(12), intervalLabel(59)]).toEqual([
      'menos de 1 dia',
      '1 dia',
      '12 dias',
      '59 dias',
    ]);
    expect(intervalLabel(95)).toBe('3 meses');
  });
});

describe('formatDaysAhead', () => {
  it('fala hoje para o que já venceu, amanhã e em N dias', () => {
    expect(formatDaysAhead(NOW - 3 * DAY, NOW)).toBe('hoje');
    expect(formatDaysAhead(NOW + 2 * 3_600_000, NOW)).toBe('hoje');
    expect(formatDaysAhead(NOW + DAY, NOW)).toBe('amanhã');
    expect(formatDaysAhead(NOW + 5 * DAY, NOW)).toBe('em 5 dias');
  });
});

describe('cardInfoRows', () => {
  it('cartão nunca revisado mostra só a situação e quando foi criado', () => {
    const card = makeTaggedCard('a', [], { state: 0, reps: 0, createdAt: NOW - 3 * DAY });

    expect(cardInfoRows(card, NOW)).toEqual([
      { label: 'Situação', value: 'Novo' },
      { label: 'Criado', value: 'há 3 dias' },
    ]);
  });

  it('cartão revisado mostra o histórico, a próxima revisão e o intervalo atual', () => {
    const card = makeTaggedCard('a', [], {
      state: 2,
      reps: 7,
      lapses: 2,
      lastReview: NOW - DAY,
      due: NOW + 11 * DAY,
      scheduledDays: 12,
      createdAt: NOW - 40 * DAY,
    });

    expect(cardInfoRows(card, NOW)).toEqual([
      { label: 'Situação', value: 'Em revisão' },
      { label: 'Revisões', value: '7' },
      { label: 'Esquecimentos', value: '2' },
      { label: 'Última revisão', value: 'ontem' },
      { label: 'Próxima revisão', value: 'em 11 dias' },
      { label: 'Intervalo', value: '12 dias' },
      { label: 'Criado', value: 'há 40 dias' },
    ]);
  });

  it('usa travessão quando falta a data da última revisão', () => {
    const card = makeTaggedCard('a', [], { state: 3, reps: 4, lastReview: undefined });

    expect(cardInfoRows(card, NOW)).toContainEqual({ label: 'Última revisão', value: '—' });
    expect(cardInfoRows(card, NOW)[0]).toEqual({ label: 'Situação', value: 'Reaprendendo' });
  });
});
