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

describe('saída por acertos seguidos', () => {
  const REVIEW = 2;

  function goods(cardId: string, count: number): ReviewLog[] {
    return Array.from({ length: count }, (_, n) => ({ ...makeLog(cardId, NOW - 1000 + n, 'good'), stateBefore: REVIEW as ReviewLog['stateBefore'] }));
  }

  function errors(cardId: string, count: number): ReviewLog[] {
    return Array.from({ length: count }, (_, n) => makeLog(cardId, NOW - 10_000 - n * 100));
  }

  it('tira da lista e da contagem o cartão com 3 acertos depois do último erro', async () => {
    await seed([makeTaggedCard('a', [], { lapses: 2 })], [...errors('a', 1), ...goods('a', 3)]);

    expect([(await listDifficult('deck-1', NOW)).length, await countDifficult('deck-1', NOW)]).toEqual([0, 0]);
  });

  it('mantém o cartão com 2 acertos e mostra o progresso', async () => {
    await seed([makeTaggedCard('a', [], { lapses: 2 })], [...errors('a', 1), ...goods('a', 2)]);

    const [entry] = await listDifficult('deck-1', NOW);

    expect(entry.streak).toBe(2);
  });

  it('traz o cartão de volta com um novo erro', async () => {
    await seed([makeTaggedCard('a', [], { lapses: 2 })], [...errors('a', 1), ...goods('a', 3), makeLog('a', NOW - 500)]);

    expect((await listDifficult('deck-1', NOW)).map((entry) => entry.card.id)).toEqual(['a']);
  });

  it('tira o cartão depois de 3 respostas reais "Acertei" em revisão', async () => {
    const deck = makeDeck('deck-1');
    await db.decks.add(deck);
    await seed([makeTaggedCard('a', [], { lapses: 2, state: State.Review, due: 1, stability: 10, reps: 5, lastReview: NOW - DAY })], []);

    for (let n = 0; n < 3; n += 1) {
      const card = (await db.cards.get('a')) as Card;
      await db.cards.update('a', { state: State.Review });
      await answer({ card: { ...card, state: State.Review }, deck, rating: 'good', durationMs: 1000 });
    }

    expect(await countDifficult('deck-1')).toBe(0);
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
