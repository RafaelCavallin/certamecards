import { describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import { makeTaggedCard } from '../../test/card-fixtures';
import { DAY } from './dates';
import { countDueLaterToday, forecastEmptyMessage, laterTodayLabel, type HomeRhythm } from './home-rhythm';

const NOW = new Date(2026, 10, 10, 15).getTime();
const MINUTE = 60_000;

function makeRhythm(overrides: Partial<HomeRhythm> = {}): HomeRhythm {
  return {
    streak: 1,
    retention30: 0.65,
    reviewedToday: 20,
    laterToday: 0,
    forecast: Array.from({ length: 7 }, (_, index) => ({ day: `d${index}`, count: 0 })),
    ...overrides,
  };
}

describe('countDueLaterToday', () => {
  it('conta só os cartões em estudo que vencem depois de agora e antes da meia-noite', () => {
    const cards = [
      makeTaggedCard('aprendendo', [], { state: State.Learning, due: NOW + 10 * MINUTE }),
      makeTaggedCard('reaprendendo', [], { state: State.Relearning, due: NOW + MINUTE }),
      makeTaggedCard('ja-vencido', [], { state: State.Learning, due: NOW - MINUTE }),
      makeTaggedCard('amanha', [], { state: State.Review, due: NOW + DAY }),
      makeTaggedCard('novo', [], { state: State.New, due: NOW + MINUTE }),
    ];

    expect(countDueLaterToday(cards, NOW)).toBe(2);
  });
});

describe('laterTodayLabel', () => {
  it('flexiona a contagem e some quando não há nada mais hoje', () => {
    expect(laterTodayLabel(13)).toBe('ainda hoje: 13 cartões');
    expect(laterTodayLabel(1)).toBe('ainda hoje: 1 cartão');
    expect(laterTodayLabel(0)).toBeNull();
  });
});

describe('forecastEmptyMessage', () => {
  it('explica que os cartões em aprendizado voltam hoje quando a semana está vazia', () => {
    const message = forecastEmptyMessage(makeRhythm({ laterToday: 13 }));

    expect(message).toContain('voltam ainda hoje');
  });

  it('avisa que não há nada agendado quando nem hoje há cartões por vir', () => {
    expect(forecastEmptyMessage(makeRhythm())).toBe('Nada agendado para os próximos 7 dias.');
  });

  it('não mostra mensagem quando algum dia da semana tem cartões', () => {
    const forecast = [{ day: '11/11', count: 0 }, { day: '12/11', count: 4 }];

    expect(forecastEmptyMessage(makeRhythm({ forecast, laterToday: 3 }))).toBeNull();
  });
});
