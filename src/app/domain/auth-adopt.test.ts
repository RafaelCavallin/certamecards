import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, type Deck } from './db';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { resetDb } from '../../test/db-helpers';

const client = { auth: { signOut: vi.fn(async () => ({ error: null })) }, from: vi.fn() };
vi.mock('./supabase', () => ({ getSupabase: async () => client }));
const { completeSignIn, decideOnSignIn, getBoundUserId } = await import('./auth');

function remoteHas(count: number): void {
  client.from.mockReturnValue({ select: () => ({ eq: async () => ({ count }) }) } as never);
}

function seedDeck(overrides: Partial<Deck> = {}): Deck {
  return { ...makeDeck('seed'), name: 'Meus cartões', dirty: 1, ...overrides };
}

afterEach(async () => {
  await resetDb();
  client.from.mockReset();
});

describe('decideOnSignIn com o baralho padrão intocado', () => {
  it('adota a conta sem perguntar quando o aparelho só tem o baralho padrão vazio', async () => {
    await db.decks.add(seedDeck());
    remoteHas(3);

    const result = await decideOnSignIn('user-2');

    expect(result).toEqual({ kind: 'auto-adopt', plan: 'adopt' });
  });

  it('pergunta quando o baralho vazio tem outro nome', async () => {
    await db.decks.add(seedDeck({ name: 'Direito' }));
    remoteHas(3);

    expect((await decideOnSignIn('user-2')).kind).toBe('prompt');
  });

  it('pergunta quando o baralho padrão tem cartões', async () => {
    await db.decks.add(seedDeck());
    await db.cards.add(makeTaggedCard('c1', [], { deckId: 'seed' }));
    remoteHas(3);

    expect((await decideOnSignIn('user-2')).kind).toBe('prompt');
  });

  it('pergunta quando só sobrou um cartão apagado, que ainda precisa subir', async () => {
    await db.decks.add(seedDeck());
    await db.cards.add(makeTaggedCard('c1', [], { deckId: 'seed', deletedAt: 5, dirty: 1 }));
    remoteHas(3);

    expect((await decideOnSignIn('user-2')).kind).toBe('prompt');
  });
});

describe('completeSignIn com o plano adotar', () => {
  it('remove os baralhos locais, limpa os cursores e vincula a conta', async () => {
    await db.decks.add(seedDeck());
    await db.syncState.put({ key: 'cursor:decks', value: '2026-01-01T00:00:00Z' });

    await completeSignIn('user-2', 'adopt');

    expect(await db.decks.count()).toBe(0);
    expect(await db.syncState.get('cursor:decks')).toBeUndefined();
    expect(await getBoundUserId()).toBe('user-2');
  });
});
