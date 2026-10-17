import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { db } from './db';
import { pushDirty } from './sync-push';
import { renameTag } from './tag-bulk';

afterEach(async () => {
  db.cards.hook('updating').unsubscribe(failOnThirdUpdate);
  await resetDb();
});

let updates = 0;
function failOnThirdUpdate(): undefined {
  updates += 1;
  if (updates === 3) throw new Error('falha simulada');
  return undefined;
}

describe('renameTag', () => {
  it('junta equivalentes num cartão só, marca dirty e atualiza updatedAt', async () => {
    await db.decks.add(makeDeck('deck-1'));
    await db.cards.bulkAdd([
      makeTaggedCard('a', ['Cespe']),
      makeTaggedCard('b', ['Cespe', 'CESPE']),
      makeTaggedCard('c', ['Cebraspe', 'CESPE', 'outra']),
      makeTaggedCard('d', ['outra']),
    ]);

    const result = await renameTag({ fromKey: 'cebraspe', newName: 'cespe' });
    const renamed = await renameTag({ fromKey: 'cespe', newName: 'CESPE' });

    const cards = await db.cards.orderBy('id').toArray();
    expect(result).toEqual({ updated: 1 });
    expect(renamed).toEqual({ updated: 3 });
    expect(cards.map((card) => card.tags)).toEqual([['CESPE'], ['CESPE'], ['CESPE', 'outra'], ['outra']]);
    expect(cards.map((card) => card.dirty)).toEqual([1, 1, 1, 0]);
    expect(cards[0].updatedAt).toBeGreaterThan(1);
    expect(cards[3].updatedAt).toBe(1);
  });

  it('rejeita nome inválido sem tocar em nada', async () => {
    await db.cards.add(makeTaggedCard('a', ['x']));

    await expect(renameTag({ fromKey: 'x', newName: ' ' })).rejects.toThrow('Digite um nome');
    expect((await db.cards.get('a'))?.tags).toEqual(['x']);
  });

  it('aborta tudo quando falha no meio', async () => {
    await db.cards.bulkAdd(['a', 'b', 'c', 'd'].map((id) => makeTaggedCard(id, ['x'])));
    updates = 0;
    db.cards.hook('updating', failOnThirdUpdate);

    await expect(renameTag({ fromKey: 'x', newName: 'novo' })).rejects.toThrow();

    const tags = (await db.cards.toArray()).map((card) => card.tags);
    expect(tags).toEqual([['x'], ['x'], ['x'], ['x']]);
  });

  it('envia no push os cartões renomeados com as tags novas', async () => {
    await db.cards.add(makeTaggedCard('a', ['velha']));
    await renameTag({ fromKey: 'velha', newName: 'Nova' });
    const { client, rpcCalls } = createFakeSupabase({ rpc: () => ({ error: null }) });

    await pushDirty(client);

    const sent = (rpcCalls[0].args as { p_cards: { tags: string[] }[] }).p_cards;
    expect(sent[0].tags).toEqual(['Nova']);
  });
});
