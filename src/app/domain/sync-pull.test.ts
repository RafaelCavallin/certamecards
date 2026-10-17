import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, type Card } from './db';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { pullAll } from './sync-pull';
import { toCardRow } from './sync-rows';
import { EMPTY_CARD_MARKS } from './text-marks';

function makeCard(overrides: Partial<Card> = {}): Card {
  return { id: 'card-1', deckId: 'deck-1', front: 'F', back: 'B', notes: '', marks: EMPTY_CARD_MARKS, tags: [], due: 1, stability: 1, difficulty: 1, elapsedDays: 0, scheduledDays: 1, learningSteps: 0, reps: 0, lapses: 0, state: 0, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0, ...overrides };
}

afterEach(async () => resetDb());

describe('pullAll', () => {
  it('encerra tabelas vazias sem alterar o banco', async () => {
    const { client } = createFakeSupabase();

    const count = await pullAll(client);

    expect(count).toBe(0);
  });

  it('aplica uma linha remota nova ao Dexie', async () => {
    const remoteCard = { ...toCardRow(makeCard()), synced_at: '2026-01-01T00:00:10Z' };
    const { client } = createFakeSupabase({ tables: { cards: [remoteCard] } });

    const count = await pullAll(client);

    expect(count).toBe(1);
    expect((await db.cards.get('card-1'))?.front).toBe('F');
  });

  it('não reaplica a mesma linha ao repuxar a janela de overlap', async () => {
    const remoteCard = { ...toCardRow(makeCard()), synced_at: '2026-01-01T00:00:10Z' };
    const { client } = createFakeSupabase({ tables: { cards: [remoteCard] } });
    await pullAll(client);

    const secondCount = await pullAll(client);

    expect(secondCount).toBe(0);
    expect(await db.cards.count()).toBe(1);
  });

  it('grava no Dexie as etiquetas normalizadas sem reenviar', async () => {
    const remoteCard = { ...toCardRow(makeCard({ tags: ['Cespe', 'CESPE'] })), synced_at: '2026-01-01T00:00:10Z' };
    const { client } = createFakeSupabase({ tables: { cards: [remoteCard] } });

    await pullAll(client);

    const stored = await db.cards.get('card-1');
    expect(stored?.tags).toEqual(['Cespe']);
    expect(stored?.dirty).toBe(0);
  });

  it('avisa no console e descarta uma linha remota inválida sem derrubar a página', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const validCard = { ...toCardRow(makeCard()), synced_at: '2026-01-01T00:00:10Z' };
    const invalidCard = { id: 'card-2', marks: [], synced_at: '2026-01-01T00:00:11Z' };
    const { client } = createFakeSupabase({ tables: { cards: [invalidCard, validCard] } });

    const count = await pullAll(client);

    expect(count).toBe(1);
    expect(await db.cards.get('card-2')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cards'), expect.objectContaining({ ids: ['card-2'] }));
    warn.mockRestore();
  });
});
