import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createDeck, deleteDeck, DEFAULT_DECK_NAME, ensureDefaultDeck } from './decks';
import { db } from './db';

afterEach(resetDb);

describe('ensureDefaultDeck', () => {
  it('cria o baralho padrão na primeira abertura', async () => {
    const deck = await ensureDefaultDeck();

    expect(deck?.name).toBe(DEFAULT_DECK_NAME);
    expect(deck?.deletedAt).toBe(0);
    expect(await db.decks.count()).toBe(1);
  });

  it('não recria baralho após descarte local de uma conta vinculada', async () => {
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });

    const deck = await ensureDefaultDeck();

    expect(deck).toBeNull();
    expect(await db.decks.count()).toBe(0);
  });

  it('não duplica quando chamada duas vezes seguidas (concorrência)', async () => {
    const [first, second] = await Promise.all([ensureDefaultDeck(), ensureDefaultDeck()]);

    expect(second?.id).toBe(first?.id);
    expect(await db.decks.count()).toBe(1);
  });

  it('devolve null sem recriar quando o último baralho foi excluído', async () => {
    const created = await ensureDefaultDeck();
    await deleteDeck(created!.id);

    const deck = await ensureDefaultDeck();

    expect(deck).toBeNull();
    expect(await db.decks.count()).toBe(1);
  });

  it('devolve o primeiro baralho vivo quando já existem baralhos', async () => {
    await createDeck('Primeiro');
    const second = await createDeck('Segundo');
    await deleteDeck(second.id);

    const deck = await ensureDefaultDeck();

    expect(deck?.name).toBe('Primeiro');
  });
});

