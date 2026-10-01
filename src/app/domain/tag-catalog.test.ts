import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { db } from './db';
import { listDeckTags, listTagCatalog, suggestTags, summarizeTags } from './tag-catalog';
import type { TagSummary } from './tags';

afterEach(resetDb);

describe('summarizeTags', () => {
  it('soma a contagem e usa a grafia majoritária', () => {
    const cards = [
      makeTaggedCard('a', ['Cespe']),
      makeTaggedCard('b', ['CESPE']),
      makeTaggedCard('c', ['CESPE']),
      makeTaggedCard('d', ['CESPE']),
    ];

    expect(summarizeTags(cards)).toEqual([{ key: 'cespe', name: 'CESPE', count: 4 }]);
  });

  it('conta uma vez o cartão com duas grafias e desempata pela menor', () => {
    const summary = summarizeTags([makeTaggedCard('a', ['Cespe', 'CESPE'])]);

    expect(summary).toEqual([{ key: 'cespe', name: 'Cespe', count: 1 }]);
  });

  it('ordena alfabeticamente sem acento', () => {
    const cards = [makeTaggedCard('a', ['Banca', 'Álcool', 'Zeta'])];

    expect(summarizeTags(cards).map((entry) => entry.name)).toEqual(['Álcool', 'Banca', 'Zeta']);
  });
});

describe('suggestTags', () => {
  const catalog: TagSummary[] = [
    { key: 'art. 37', name: 'Art. 37', count: 5 },
    { key: 'art. 5º', name: 'Art. 5º', count: 12 },
    { key: 'pegadinha', name: 'Pegadinha', count: 2 },
  ];

  it('casa começo de palavra e ordena por contagem', () => {
    const names = suggestTags({ catalog, query: 'art', exclude: [] }).map((entry) => entry.name);

    expect(names).toEqual(['Art. 5º', 'Art. 37']);
  });

  it('casa palavra no meio da etiqueta', () => {
    const names = suggestTags({ catalog, query: '37', exclude: [] }).map((entry) => entry.name);

    expect(names).toEqual(['Art. 37']);
  });

  it('ignora caixa e acento e exclui chips do cartão', () => {
    expect(suggestTags({ catalog, query: 'PEG', exclude: [] })).toHaveLength(1);
    expect(suggestTags({ catalog, query: 'peg', exclude: ['Pégadinha'] })).toEqual([]);
  });

  it('devolve vazio para consulta vazia e respeita o limite', () => {
    expect(suggestTags({ catalog, query: '  ', exclude: [] })).toEqual([]);
    expect(suggestTags({ catalog, query: 'art', exclude: [], limit: 1 })).toHaveLength(1);
  });
});

describe('listTagCatalog', () => {
  it('ignora cartões excluídos e baralhos excluídos', async () => {
    await db.decks.bulkAdd([makeDeck('deck-1'), makeDeck('deck-2'), makeDeck('morto', 5)]);
    await db.cards.bulkAdd([
      makeTaggedCard('a', ['x']),
      makeTaggedCard('b', ['x'], { deckId: 'deck-2' }),
      makeTaggedCard('c', ['x', 'y'], { deletedAt: 9 }),
      makeTaggedCard('d', ['z'], { deckId: 'morto' }),
    ]);

    expect(await listTagCatalog()).toEqual([{ key: 'x', name: 'x', count: 2 }]);
  });

  it('listDeckTags considera só o baralho pedido', async () => {
    await db.cards.bulkAdd([
      makeTaggedCard('a', ['x']),
      makeTaggedCard('b', ['y'], { deckId: 'deck-2' }),
    ]);

    expect(await listDeckTags('deck-2')).toEqual([{ key: 'y', name: 'y', count: 1 }]);
  });
});
