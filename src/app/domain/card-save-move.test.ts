import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { makeCardImage } from '../../test/image-fixtures';
import { loadCardDraft } from './card-draft';
import { saveCardEdit } from './card-save';
import { db } from './db';

const NOW = 1_790_000_000_000;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  await db.decks.bulkAdd([makeDeck('deck-1'), makeDeck('deck-2'), makeDeck('apagado', 500)]);
  await db.cards.add(makeTaggedCard('c1', [], { front: 'Frente', back: 'Verso', due: 5000, reps: 3, lapses: 1, state: 2, updatedAt: 777 }));
  await db.cardImages.add(makeCardImage('i1', { cardId: 'c1', dirty: 0, updatedAt: 100 }));
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('saveCardEdit movendo de baralho', () => {
  it('troca o baralho sem reagendar nem tocar nas imagens', async () => {
    const draft = (await loadCardDraft('c1'))!;

    const saved = await saveCardEdit({ cardId: 'c1', draft, deckId: 'deck-2' });

    const card = (await db.cards.get('c1'))!;
    expect([card.deckId, card.updatedAt, card.dirty]).toEqual(['deck-2', NOW, 1]);
    expect([card.due, card.reps, card.lapses, card.state]).toEqual([5000, 3, 1, 2]);
    expect(saved).toMatchObject({ deckId: 'deck-2', updatedAt: NOW });
    expect((await db.cardImages.get('i1'))?.dirty).toBe(0);
  });

  it('grava texto e baralho na mesma atualização', async () => {
    const draft = (await loadCardDraft('c1'))!;
    const content = { ...draft.content, back: 'Verso novo' };

    await saveCardEdit({ cardId: 'c1', draft: { ...draft, content }, deckId: 'deck-2' });

    const card = (await db.cards.get('c1'))!;
    expect([card.deckId, card.back, card.updatedAt]).toEqual(['deck-2', 'Verso novo', NOW]);
  });

  it('não mexe no cartão quando o baralho e o texto são os mesmos', async () => {
    const draft = (await loadCardDraft('c1'))!;

    const saved = await saveCardEdit({ cardId: 'c1', draft, deckId: 'deck-1' });

    const card = (await db.cards.get('c1'))!;
    expect([card.deckId, card.updatedAt, card.dirty]).toEqual(['deck-1', 777, 0]);
    expect(saved.updatedAt).toBe(777);
  });

  it('recusa um baralho apagado e mantém o cartão onde estava', async () => {
    const draft = (await loadCardDraft('c1'))!;
    const content = { ...draft.content, back: 'Verso novo' };

    const attempt = saveCardEdit({ cardId: 'c1', draft: { ...draft, content }, deckId: 'apagado' });

    await expect(attempt).rejects.toThrow('Baralho não encontrado.');
    const card = (await db.cards.get('c1'))!;
    expect([card.deckId, card.back, card.updatedAt]).toEqual(['deck-1', 'Verso', 777]);
  });
});
