import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { makeLog } from '../../test/backup-fixtures';
import { db, type Card } from './db';
import { loadHomeSnapshot } from './home-data';
import { homeView } from './home-summary';
import { UNTAGGED_KEY } from './tag-filter';

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
    expect(snapshot.options.map((option) => [option.key, option.count])).toEqual([
      [UNTAGGED_KEY, 1],
      ['cespe', 2],
      ['fgv', 1],
    ]);
  });

  it('filtra por "Sem etiqueta", mantém a chave para reconciliar e mostra o nome', async () => {
    await db.cards.bulkAdd([dueCard('a', ['CESPE']), dueCard('b', []), dueCard('c', [])]);

    const snapshot = await loadHomeSnapshot(makeDeck('deck-1'), [UNTAGGED_KEY]);

    expect(snapshot.queueSize).toBe(2);
    expect(snapshot.existingKeys.has(UNTAGGED_KEY)).toBe(true);
    expect(snapshot.filter).toEqual({ names: ['Sem etiqueta'], unfilteredSize: 3 });
  });

  it('não oferece "Sem etiqueta" quando o baralho não tem etiquetas', async () => {
    await db.cards.bulkAdd([dueCard('a', []), dueCard('b', [])]);

    const snapshot = await loadHomeSnapshot(makeDeck('deck-1'), [UNTAGGED_KEY]);

    expect(snapshot.options).toEqual([]);
    expect(snapshot.queueSize).toBe(2);
    expect(snapshot.filter).toBeNull();
  });

  it('resume o ritmo com as revisões de hoje e a previsão a partir de amanhã', async () => {
    await db.cards.bulkAdd([
      dueCard('a', []),
      makeTaggedCard('b', [], { state: State.Review, due: NOW.getTime() + DAY, stability: 30 }),
    ]);
    await db.reviewLogs.bulkAdd([
      makeLog({ id: 'l1', cardId: 'a', reviewedAt: NOW.getTime() - 60_000 }),
      makeLog({ id: 'l2', cardId: 'a', reviewedAt: NOW.getTime() - 2 * DAY }),
    ]);

    const { rhythm } = await loadHomeSnapshot(makeDeck('deck-1'), []);

    expect(rhythm.reviewedToday).toBe(1);
    expect(rhythm.forecast).toHaveLength(7);
    expect(rhythm.forecast[0].count).toBe(1);
    expect(rhythm.forecast.some((day) => day.day === 'hoje')).toBe(false);
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
