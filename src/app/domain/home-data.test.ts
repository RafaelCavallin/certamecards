import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { db, type Card } from './db';
import { loadHomeSnapshot } from './home-data';
import { homeView } from './home-summary';

const NOW = new Date('2026-03-09T12:00:00Z');
const DAY = 86_400_000;

function dueCard(id: string, tags: string[]): Card {
  return makeTaggedCard(id, tags, { state: State.Review, due: NOW.getTime() - DAY, stability: 30 });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('loadHomeSnapshot', () => {
  it('sem filtro traz a fila inteira e as opções com a contagem de hoje', async () => {
    await db.cards.bulkAdd([dueCard('a', ['CESPE']), dueCard('b', ['CESPE', 'FGV']), dueCard('c', [])]);

    const snapshot = await loadHomeSnapshot(makeDeck('deck-1'), []);

    expect(snapshot.queueSize).toBe(3);
    expect(snapshot.filter).toBeNull();
    expect(snapshot.options.map((option) => [option.key, option.count])).toEqual([['cespe', 2], ['fgv', 1]]);
  });

  it('com filtro conta só os filtrados e informa o total sem filtro', async () => {
    await db.cards.bulkAdd([dueCard('a', ['CESPE']), dueCard('b', ['FGV']), dueCard('c', ['FGV'])]);

    const snapshot = await loadHomeSnapshot(makeDeck('deck-1'), ['fgv']);

    expect(snapshot.queueSize).toBe(2);
    expect(snapshot.filter).toEqual({ names: ['FGV'], unfilteredSize: 3 });
  });

  it('ignora chave que não existe mais e expõe as existentes para reconciliar', async () => {
    await db.cards.add(dueCard('a', ['CESPE']));

    const snapshot = await loadHomeSnapshot(makeDeck('deck-1'), ['sumiu']);

    expect(snapshot.queueSize).toBe(1);
    expect(snapshot.filter).toBeNull();
    expect([...snapshot.existingKeys]).toEqual(['cespe']);
  });

  it('etiqueta sem cartões hoje leva ao estado vazio filtrado', async () => {
    await db.cards.bulkAdd([
      dueCard('a', ['CESPE']),
      makeTaggedCard('b', ['FGV'], { state: State.Review, due: NOW.getTime() + DAY, stability: 30 }),
    ]);

    const snapshot = await loadHomeSnapshot(makeDeck('deck-1'), ['fgv']);
    const view = homeView({ total: snapshot.total, queueSize: snapshot.queueSize, minutes: snapshot.minutes, filter: snapshot.filter });

    expect(view).toEqual({ kind: 'filtered-empty', filter: { names: ['FGV'], unfilteredSize: 1 } });
  });
});
