import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, type Card } from './db';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { pushDirty } from './sync-push';
import { EMPTY_CARD_MARKS } from './text-marks';

function makeCard(overrides: Partial<Card> = {}): Card {
  return { id: 'card-1', deckId: 'deck-1', front: 'F', back: 'B', notes: '', marks: EMPTY_CARD_MARKS, tags: [], due: 1, stability: 1, difficulty: 1, elapsedDays: 0, scheduledDays: 1, learningSteps: 0, reps: 0, lapses: 0, state: 0, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 1, ...overrides };
}

afterEach(async () => resetDb());

describe('pushDirty', () => {
  it('envia cards antes dos logs e limpa dirty', async () => {
    const { client, rpcCalls } = createFakeSupabase({ rpc: () => ({ error: null }) });
    await db.decks.add({ id: 'deck-1', name: 'Direito', newCardsPerDay: 1, youngLimit: 1, requestRetention: .9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 1 });
    await db.cards.add(makeCard());
    await db.reviewLogs.add({ id: 'log-1', cardId: 'card-1', deckId: 'deck-1', rating: 'good', reviewedAt: 1, stateBefore: 0, scheduledDays: 1, durationMs: 1, dirty: 1 });

    const count = await pushDirty(client);

    expect(count).toBe(3);
    expect(rpcCalls).toHaveLength(2);
    expect((rpcCalls[0].args as { p_cards: unknown[] }).p_cards).toHaveLength(1);
    expect((rpcCalls[1].args as { p_logs: unknown[] }).p_logs).toHaveLength(1);
    expect((await db.cards.get('card-1'))?.dirty).toBe(0);
    expect((await db.reviewLogs.get('log-1'))?.dirty).toBe(0);
  });

  it('divide mais de 200 cards sujos em lotes', async () => {
    const { client, rpcCalls } = createFakeSupabase({ rpc: () => ({ error: null }) });
    const cards = Array.from({ length: 201 }, (_, index) => makeCard({ id: `card-${index}` }));
    await db.cards.bulkAdd(cards);

    const count = await pushDirty(client);

    expect(count).toBe(201);
    expect(rpcCalls).toHaveLength(2);
    expect((rpcCalls[0].args as { p_cards: unknown[] }).p_cards).toHaveLength(200);
    expect((rpcCalls[1].args as { p_cards: unknown[] }).p_cards).toHaveLength(1);
  });

  it('avisa no console quando um chunk é rejeitado, com o código e sem conteúdo', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { client } = createFakeSupabase({ rpc: () => ({ error: { message: 'linha inválida', code: '23505' } }) });
    await db.cards.add(makeCard());

    await expect(pushDirty(client)).rejects.toMatchObject({ code: '23505' });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('23505'), expect.objectContaining({ cards: ['card-1'] }));
    warn.mockRestore();
  });
});
