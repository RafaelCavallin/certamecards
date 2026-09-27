import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { db, uid } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

afterEach(resetDb);

describe('uid', () => {
  it('gera identificadores diferentes a cada chamada', () => {
    expect(uid()).not.toBe(uid());
  });
});

describe('dirty-tracking nas tabelas', () => {
  it('marca dirty=1 e deletedAt=0 ao criar um baralho sem esses campos', async () => {
    await db.decks.add({
      id: 'd1',
      name: 'Meus cartões',
      newCardsPerDay: 20,
      youngLimit: 50,
      requestRetention: 0.9,
      createdAt: 1000,
      updatedAt: 1000,
    } as never);

    const deck = (await db.decks.get('d1'))!;
    expect(deck.dirty).toBe(1);
    expect(deck.deletedAt).toBe(0);
  });

  it('marca dirty=1 ao criar um cartão sem o campo', async () => {
    await db.cards.add({
      id: 'c1',
      deckId: 'd1',
      front: 'Frente',
      back: 'Verso',
      notes: '',
      marks: EMPTY_CARD_MARKS,
      tags: [],
      due: 1000,
      stability: 1,
      difficulty: 1,
      elapsedDays: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      createdAt: 1000,
      updatedAt: 1000,
    } as never);

    expect((await db.cards.get('c1'))!.dirty).toBe(1);
  });

  it('marca dirty=1 ao criar uma configuração sem o campo', async () => {
    await db.settings.add({
      id: 'me',
      dailyGoal: null,
      reminderEnabled: false,
      reminderMinute: 1200,
      timeZone: 'America/Sao_Paulo',
      updatedAt: 1000,
    } as never);

    expect((await db.settings.get('me'))!.dirty).toBe(1);
  });
});
