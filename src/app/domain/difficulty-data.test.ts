import { State } from 'ts-fsrs';
import { afterEach, describe, expect, it } from 'vitest';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { deleteCards } from './cards';
import { DAY } from './dates';
import { db, type Card, type ReviewLog } from './db';
import { countDifficult, listDifficult, liveCardIds } from './difficulty-data';
import { answer } from './scheduler';
import { pullAll } from './sync-pull';

const NOW = Date.parse('2026-03-09T12:00:00Z');

afterEach(async () => resetDb());

function makeLog(cardId: string, reviewedAt: number, rating: ReviewLog['rating'] = 'again', deckId = 'deck-1'): ReviewLog {
  return { id: `${cardId}-${reviewedAt}-${rating}`, cardId, deckId, rating, reviewedAt, stateBefore: 2, scheduledDays: 1, durationMs: 1000, dirty: 0 };
}

async function seed(cards: Card[], logs: ReviewLog[]): Promise<void> {
  await db.cards.bulkAdd(cards);
  await db.reviewLogs.bulkAdd(logs);
}

describe('listDifficult', () => {
  it('ignora cartões excluídos e de outro baralho', async () => {
    const logs = ['a', 'gone', 'other'].flatMap((id) => [1, 2, 3].map((n) => makeLog(id, NOW - n * 1000)));
    await seed(
      [makeTaggedCard('a', []), makeTaggedCard('gone', [], { deletedAt: 5 }), makeTaggedCard('other', [], { deckId: 'deck-2' })],
      logs,
    );

    const list = await listDifficult('deck-1', NOW);

    expect(list.map((entry) => entry.card.id)).toEqual(['a']);
  });

  it('conta o histórico inteiro no total e só 30 dias nos recentes', async () => {
    const old = NOW - 31 * DAY;
    await seed([makeTaggedCard('a', [])], [makeLog('a', old), makeLog('a', NOW - 3000), makeLog('a', NOW - 2000), makeLog('a', NOW - 1000)]);

    const [entry] = await listDifficult('deck-1', NOW);

    expect([entry.recentErrors, entry.totalErrors, entry.lastErrorAt]).toEqual([3, 4, NOW - 1000]);
  });

  it('ordena por pontuação desc', async () => {
    const logs = [1, 2, 3, 4].map((n) => makeLog('b', NOW - n)).concat([1, 2, 3].map((n) => makeLog('a', NOW - n)));
    await seed([makeTaggedCard('a', []), makeTaggedCard('b', [])], logs);

    const list = await listDifficult('deck-1', NOW);

    expect(list.map((entry) => entry.card.id)).toEqual(['b', 'a']);
  });
});

describe('listDifficult depois de uma resposta real', () => {
  it('inclui o cartão no terceiro erro pela revisão normal', async () => {
    const deck = makeDeck('deck-1');
    const card = makeTaggedCard('a', [], { state: State.Review, due: 1, stability: 10, reps: 3, lastReview: NOW - DAY });
    await db.decks.add(deck);
    await seed([card], [makeLog('a', Date.now() - 2000), makeLog('a', Date.now() - 1000)]);
    const before = await listDifficult('deck-1');

    await answer({ card, deck, rating: 'again', durationMs: 1000 });

    const after = await listDifficult('deck-1');
    expect([before.length, after.map((entry) => entry.card.id)]).toEqual([0, ['a']]);
  });
});

describe('countDifficult', () => {
  it('é zero sem difíceis', async () => {
    await seed([makeTaggedCard('a', [])], []);

    expect(await countDifficult('deck-1', NOW)).toBe(0);
  });

  it('bate com o tamanho da lista', async () => {
    const ids = ['a', 'b', 'c', 'd'];
    await seed(ids.map((id) => makeTaggedCard(id, [])), ids.flatMap((id) => [1, 2, 3].map((n) => makeLog(id, NOW - n))));

    expect([await countDifficult('deck-1', NOW), (await listDifficult('deck-1', NOW)).length]).toEqual([4, 4]);
  });
});

describe('logs vindos do pull', () => {
  it('entram na pontuação do cartão local', async () => {
    await seed([makeTaggedCard('a', [])], []);
    const rows = [1, 2, 3].map((n) => ({
      id: `r${n}`, card_id: 'a', deck_id: 'deck-1', rating: 'again', reviewed_at: Date.now() - n * 1000,
      state_before: 2, scheduled_days: 1, duration_ms: 1000, synced_at: `2026-01-01T00:00:0${n}Z`,
    }));
    const { client } = createFakeSupabase({ tables: { review_logs: rows } });

    await pullAll(client);

    expect((await listDifficult('deck-1')).map((entry) => entry.card.id)).toEqual(['a']);
  });
});

describe('liveCardIds', () => {
  it('não lista o cartão excluído', async () => {
    await seed([makeTaggedCard('a', []), makeTaggedCard('b', [])], []);

    await deleteCards(['a']);

    expect(await liveCardIds('deck-1')).toEqual(['b']);
  });
});
