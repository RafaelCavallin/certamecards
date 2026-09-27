import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAY, iso, startOfToday } from './dates';

describe('iso', () => {
  it('formata a data no fuso local como YYYY-MM-DD', () => {
    expect(iso(new Date(2026, 2, 9))).toBe('2026-03-09');
  });

  it('preenche mês e dia com zero à esquerda', () => {
    expect(iso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('startOfToday', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devolve a meia-noite do dia local', () => {
    vi.setSystemTime(new Date(2026, 2, 9, 14, 30, 0));

    const start = startOfToday();

    expect(new Date(start)).toEqual(new Date(2026, 2, 9, 0, 0, 0, 0));
  });

  it('aceita um instante explícito em vez de agora', () => {
    const start = startOfToday(new Date(2026, 5, 1, 23, 59).getTime());

    expect(new Date(start)).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
  });
});

describe('DAY', () => {
  it('vale 24 horas em milissegundos', () => {
    expect(DAY).toBe(24 * 60 * 60 * 1000);
  });
});
