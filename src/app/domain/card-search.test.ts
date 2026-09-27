import { describe, expect, it } from 'vitest';
import { searchCards } from './card-search';
import { EMPTY_CARD_MARKS } from './text-marks';
import type { Card } from './db';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deckId: 'd1',
    front: 'Frente',
    back: 'Verso',
    notes: '',
    marks: EMPTY_CARD_MARKS,
    tags: [],
    due: 0,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    learningSteps: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: 0,
    dirty: 0,
    ...overrides,
  };
}

describe('searchCards', () => {
  it('encontra sem diferenciar caixa nem acento', () => {
    const cards = [makeCard({ id: 'com-acento', notes: 'O prázo é de dez dias' })];

    expect(searchCards(cards, 'PRAZO')).toEqual(cards);
  });

  it('busca só nas Notas quando é lá que o termo está', () => {
    const alvo = makeCard({ id: 'tem-nota', notes: 'Prazo de dez dias' });
    const fora = makeCard({ id: 'sem-nota', front: 'Outro assunto', back: 'Outro', notes: '' });

    expect(searchCards([alvo, fora], 'prazo')).toEqual([alvo]);
  });

  it('busca em Frente, Verso e Notas', () => {
    const front = makeCard({ id: 'front', front: 'prazo na frente' });
    const back = makeCard({ id: 'back', back: 'prazo no verso' });
    const notes = makeCard({ id: 'notes', notes: 'prazo na nota' });

    expect(searchCards([front, back, notes], 'prazo')).toEqual([front, back, notes]);
  });

  it('devolve tudo quando a busca está vazia', () => {
    const cards = [makeCard({ id: 'a' }), makeCard({ id: 'b' })];

    expect(searchCards(cards, '   ')).toEqual(cards);
  });

  it('devolve lista vazia quando nada corresponde', () => {
    const cards = [makeCard({ front: 'Constitucional' })];

    expect(searchCards(cards, 'penal')).toEqual([]);
  });
});
