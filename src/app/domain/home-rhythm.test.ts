import { describe, expect, it } from 'vitest';
import {
  FORECAST_PREVIEW_DAYS,
  homeRhythm,
  retentionLabel,
  reviewsLabel,
  streakLabel,
  tomorrowLabel,
} from './home-rhythm';
import type { Stats } from './stats';

const TODAY = new Date(2026, 2, 9, 15);

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    retention30: 0.87,
    reviews30: 40,
    reviewsTotal: 120,
    streak: 12,
    byDay: new Map([['2026-03-09', 14], ['2026-03-08', 30]]),
    forecast: Array.from({ length: 14 }, (_, index) => ({ day: `d${index}`, count: index })),
    maturity: { new: 1, learning: 2, mature: 3 },
    ...overrides,
  };
}

describe('homeRhythm', () => {
  it('resume sequência, retenção, revisões de hoje e a previsão a partir de amanhã', () => {
    const rhythm = homeRhythm(makeStats(), TODAY);

    expect(rhythm.streak).toBe(12);
    expect(rhythm.retention30).toBe(0.87);
    expect(rhythm.reviewedToday).toBe(14);
    expect(rhythm.forecast).toHaveLength(FORECAST_PREVIEW_DAYS);
    expect(rhythm.forecast[0]).toEqual({ day: 'd1', count: 1 });
    expect(rhythm.forecast.at(-1)).toEqual({ day: 'd7', count: 7 });
  });

  it('conta zero revisões hoje quando o dia ainda está em branco', () => {
    const rhythm = homeRhythm(makeStats({ byDay: new Map([['2026-03-08', 30]]) }), TODAY);

    expect(rhythm.reviewedToday).toBe(0);
  });
});

describe('rótulos do ritmo', () => {
  it('formata a retenção em porcentagem inteira, ou travessão sem dados', () => {
    expect(retentionLabel(0.876)).toBe('88%');
    expect(retentionLabel(null)).toBe('—');
  });

  it('flexiona dias e revisões no singular e no plural', () => {
    expect([streakLabel(1), streakLabel(0), streakLabel(12)]).toEqual(['1 dia', '0 dias', '12 dias']);
    expect([reviewsLabel(1), reviewsLabel(3)]).toEqual(['1 revisão', '3 revisões']);
  });

  it('descreve a carga de amanhã a partir da previsão', () => {
    expect(tomorrowLabel([{ day: '10/03', count: 54 }, { day: '11/03', count: 9 }])).toBe('amanhã: 54 cartões');
    expect(tomorrowLabel([{ day: '10/03', count: 1 }])).toBe('amanhã: 1 cartão');
    expect(tomorrowLabel([])).toBeNull();
  });
});
