import { State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { PREVIEW_CARD_ID, previewCard } from './card-preview';
import type { CardContent } from './cards';
import { EMPTY_CARD_MARKS } from './text-marks';

const CONTENT: CardContent = { front: '  Frente  ', back: 'Verso', notes: '', marks: EMPTY_CARD_MARKS, tags: ['FGV'] };

describe('previewCard', () => {
  it('usa sempre o mesmo id, para a galeria não refazer a consulta a cada tecla', () => {
    expect(previewCard(CONTENT).id).toBe(PREVIEW_CARD_ID);
    expect(previewCard({ ...CONTENT, front: 'Outra' }).id).toBe(PREVIEW_CARD_ID);
  });

  it('mostra o texto como será salvo, com as etiquetas', () => {
    const card = previewCard(CONTENT);

    expect(card.front).toBe('Frente');
    expect(card.back).toBe('Verso');
    expect(card.tags).toEqual(['FGV']);
  });

  it('nasce como cartão novo e sem baralho', () => {
    const card = previewCard(CONTENT);

    expect(card.state).toBe(State.New);
    expect(card.deckId).toBe('');
  });
});
