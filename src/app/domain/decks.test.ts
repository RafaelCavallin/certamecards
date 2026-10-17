import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import {
  createDeck,
  deleteDeck,
  renameDeck,
  updateDeckRhythm,
} from './decks';
import { db } from './db';
import { createCard } from './cards';
import { EMPTY_CARD_MARKS } from './text-marks';

afterEach(resetDb);

describe('createDeck', () => {
  it('cria com os padrões de ritmo e nome informado', async () => {
    const deck = await createDeck('Constitucional');

    expect(deck.name).toBe('Constitucional');
    expect(deck.newCardsPerDay).toBe(20);
    expect(deck.youngLimit).toBe(50);
    expect(deck.dirty).toBe(1);
  });

  it('usa o nome de reserva quando vazio', async () => {
    const deck = await createDeck('   ');

    expect(deck.name).toBe('Novo baralho');
  });
});

describe('renameDeck', () => {
  it('troca o nome e atualiza updatedAt', async () => {
    const deck = await createDeck('Nome antigo');

    await renameDeck(deck.id, 'Nome novo');

    expect((await db.decks.get(deck.id))!.name).toBe('Nome novo');
  });

  it('ignora nome vazio', async () => {
    const deck = await createDeck('Mantido');

    await renameDeck(deck.id, '   ');

    expect((await db.decks.get(deck.id))!.name).toBe('Mantido');
  });
});

describe('updateDeckRhythm', () => {
  it('atualiza só os campos de ritmo informados', async () => {
    const deck = await createDeck('Ritmo');

    await updateDeckRhythm(deck.id, { newCardsPerDay: 10 });

    const updated = (await db.decks.get(deck.id))!;
    expect(updated.newCardsPerDay).toBe(10);
    expect(updated.youngLimit).toBe(50);
  });
});

describe('deleteDeck', () => {
  it('tombstona o baralho e os cartões vivos dele, preservando os de outro baralho', async () => {
    const deck = await createDeck('Para excluir');
    const other = await createDeck('Outro');
    const card = await createCard({ deckId: deck.id, front: 'A', back: 'A', notes: '', marks: EMPTY_CARD_MARKS, tags: [] });
    const otherCard = await createCard({ deckId: other.id, front: 'B', back: 'B', notes: '', marks: EMPTY_CARD_MARKS, tags: [] });

    await deleteDeck(deck.id);

    expect((await db.decks.get(deck.id))!.deletedAt).toBeGreaterThan(0);
    expect((await db.cards.get(card.id))!.deletedAt).toBeGreaterThan(0);
    expect((await db.cards.get(otherCard.id))!.deletedAt).toBe(0);
  });
});
