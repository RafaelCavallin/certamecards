import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { deleteDeck } from './decks';
import { buildQueue, estimateMinutes, interleave, queueCount, totalQueueCount } from './queue';
import { db, type Card, type Deck } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

const NOW = new Date('2026-03-09T12:00:00Z');
const DAY = 86_400_000;

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deckId: 'd1',
    front: 'Frente',
    back: 'Verso',
    notes: '',
    marks: EMPTY_CARD_MARKS,
    tags: [],
    due: NOW.getTime() - DAY,
    stability: 10,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 1,
    learningSteps: 0,
    reps: 3,
    lapses: 0,
    state: State.Review,
    lastReview: NOW.getTime() - DAY,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: 0,
    dirty: 0,
    ...overrides,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: 'd1',
    name: 'Constitucional',
    newCardsPerDay: 20,
    youngLimit: 50,
    requestRetention: 0.9,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: 0,
    dirty: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('interleave', () => {
  it('distribui os novos entre os vencidos em vez de empilhar no fim', () => {
    const due = [makeCard({ id: 'v1' }), makeCard({ id: 'v2' }), makeCard({ id: 'v3' }), makeCard({ id: 'v4' })];
    const fresh = [makeCard({ id: 'n1' }), makeCard({ id: 'n2' })];

    expect(interleave(due, fresh).map((c) => c.id)).toEqual(['v1', 'v2', 'n1', 'v3', 'v4', 'n2']);
  });

  it('devolve só os vencidos quando não há novos', () => {
    const due = [makeCard({ id: 'v1' })];

    expect(interleave(due, [])).toEqual(due);
  });

  it('devolve só os novos quando não há vencidos', () => {
    const fresh = [makeCard({ id: 'n1' })];

    expect(interleave([], fresh)).toEqual(fresh);
  });
});

describe('buildQueue', () => {
  it('limita os novos a "novos por dia" mesmo com mais disponíveis', async () => {
    const fresh = Array.from({ length: 30 }, (_, i) =>
      makeCard({ id: `n${i}`, state: State.New, createdAt: i }),
    );
    await db.cards.bulkAdd(fresh);

    const queue = await buildQueue(makeDeck({ newCardsPerDay: 10 }));

    expect(queue).toHaveLength(10);
    expect(queue.map((c) => c.id)).toEqual(fresh.slice(0, 10).map((c) => c.id));
  });

  it('respeita o teto de cartões ainda não firmados mesmo com "novos por dia" alto', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'young1', state: State.Learning, due: NOW.getTime() + DAY }),
      makeCard({ id: 'young2', stability: 2, due: NOW.getTime() + DAY }),
      makeCard({ id: 'n1', state: State.New }),
      makeCard({ id: 'n2', state: State.New }),
    ]);

    const queue = await buildQueue(makeDeck({ newCardsPerDay: 20, youngLimit: 2 }));

    expect(queue).toEqual([]);
  });

  it('põe os vencidos em ordem de vencimento', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'novo-atraso', due: NOW.getTime() - DAY }),
      makeCard({ id: 'mais-atrasado', due: NOW.getTime() - 5 * DAY }),
    ]);

    const queue = await buildQueue(makeDeck({ newCardsPerDay: 0 }));

    expect(queue.map((c) => c.id)).toEqual(['mais-atrasado', 'novo-atraso']);
  });

  it('desconta do teto diário os novos já introduzidos hoje', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'introduzido' }),
      makeCard({ id: 'n1', state: State.New, createdAt: 1 }),
      makeCard({ id: 'n2', state: State.New, createdAt: 2 }),
    ]);
    await db.reviewLogs.add({
      id: 'l1',
      cardId: 'introduzido',
      deckId: 'd1',
      rating: 'good',
      reviewedAt: NOW.getTime() - 3600_000,
      stateBefore: State.New,
      scheduledDays: 1,
      durationMs: 1000,
      dirty: 0,
    });

    const queue = await buildQueue(makeDeck({ newCardsPerDay: 2 }));

    expect(queue.filter((c) => c.state === State.New).map((c) => c.id)).toEqual(['n1']);
  });
});

describe('queueCount', () => {
  it('conta a fila do dia do baralho: vencidos e os novos que couberem', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'vencido' }),
      makeCard({ id: 'futuro', due: NOW.getTime() + DAY }),
      makeCard({ id: 'novo', state: State.New }),
      makeCard({ id: 'excluido', deletedAt: 500 }),
      makeCard({ id: 'outro-baralho', deckId: 'd2' }),
    ]);

    expect(await queueCount(makeDeck())).toBe(2);
  });
});

describe('totalQueueCount', () => {
  it('soma os baralhos, para o indicador de fila no cabeçalho', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'a' }),
      makeCard({ id: 'b', deckId: 'd2' }),
      makeCard({ id: 'c', deckId: 'd2', state: State.New }),
    ]);

    expect(await totalQueueCount([makeDeck(), makeDeck({ id: 'd2' })])).toBe(3);
  });

  it('devolve zero sem baralhos', async () => {
    expect(await totalQueueCount([])).toBe(0);
  });
});

describe('fila após excluir o baralho', () => {
  it('fica vazia quando o baralho e os cartões são tombstonados', async () => {
    await db.decks.add(makeDeck());
    await db.cards.bulkAdd([makeCard({ id: 'c1' }), makeCard({ id: 'c2', state: State.New })]);

    await deleteDeck('d1');

    expect(await buildQueue(makeDeck())).toEqual([]);
  });
});

describe('estimateMinutes', () => {
  it('usa 8s por cartão quando ainda não há histórico', async () => {
    expect(await estimateMinutes(15)).toBe(2);
  });

  it('usa a média das revisões recentes', async () => {
    await db.reviewLogs.bulkAdd(
      Array.from({ length: 10 }, (_, i) => ({
        id: `l${i}`,
        cardId: 'c1',
        deckId: 'd1',
        rating: 'good' as const,
        reviewedAt: NOW.getTime() - i * 1000,
        stateBefore: State.Review,
        scheduledDays: 1,
        durationMs: 30_000,
        dirty: 0 as const,
      })),
    );

    expect(await estimateMinutes(10)).toBe(5);
  });

  it('usa o tempo de referência quando um log vier com duração zerada', async () => {
    await db.reviewLogs.add({
      id: 'l1',
      cardId: 'c1',
      deckId: 'd1',
      rating: 'good',
      reviewedAt: NOW.getTime(),
      stateBefore: State.Review,
      scheduledDays: 1,
      durationMs: 0,
      dirty: 0,
    });

    expect(await estimateMinutes(1)).toBe(1);
  });
});
