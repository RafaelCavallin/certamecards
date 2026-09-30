import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';
import { resetDb } from '../../test/db-helpers';

const client = { auth: { signOut: vi.fn(async () => ({ error: null })) }, from: vi.fn(() => ({ select: () => ({ eq: async () => ({ count: 0 }) }) })) };
vi.mock('./supabase', () => ({ getSupabase: async () => client }));
const { completeSignIn, decideOnSignIn, getBoundUserId } = await import('./auth');

afterEach(async () => {
  await resetDb();
  client.auth.signOut.mockClear();
  client.from.mockImplementation(() => ({ select: () => ({ eq: async () => ({ count: 0 }) }) }));
});

describe('decideOnSignIn', () => {
  it('retoma a conta já vinculada', async () => {
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });
    const result = await decideOnSignIn('user-1');

    expect(result).toEqual({ kind: 'resume' });
  });

  it('adota automaticamente quando os dois lados estão vazios', async () => {
    const result = await decideOnSignIn('user-2');

    expect(result).toEqual({ kind: 'auto-adopt' });
  });

  it('adota automaticamente quando só há dado local', async () => {
    await db.decks.add({ id: 'deck-1', name: 'Direito', newCardsPerDay: 1, youngLimit: 1, requestRetention: .9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0 });

    const result = await decideOnSignIn('user-2');

    expect(result).toEqual({ kind: 'auto-adopt' });
  });

  it('pede decisão quando os dois lados têm dado e nenhuma conta está vinculada', async () => {
    await db.decks.add({ id: 'deck-1', name: 'Direito', newCardsPerDay: 1, youngLimit: 1, requestRetention: .9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0 });
    client.from.mockReturnValue({ select: () => ({ eq: async () => ({ count: 3 }) }) } as never);

    const result = await decideOnSignIn('user-2');

    expect(result.kind).toBe('prompt');
  });

  it('sinaliza troca de conta quando já há uma conta vinculada diferente', async () => {
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });
    await db.decks.add({ id: 'deck-1', name: 'Direito', newCardsPerDay: 1, youngLimit: 1, requestRetention: .9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0 });
    client.from.mockReturnValue({ select: () => ({ eq: async () => ({ count: 3 }) }) } as never);

    const result = await decideOnSignIn('user-2');

    expect(result.kind).toBe('switch');
  });
});

describe('completeSignIn', () => {
  it('vincula e marca os dados locais para merge', async () => {
    await db.decks.add({ id: 'deck-1', name: 'Direito', newCardsPerDay: 1, youngLimit: 1, requestRetention: .9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0 });

    await completeSignIn('user-1', 'merge');

    expect(await getBoundUserId()).toBe('user-1');
    expect((await db.decks.get('deck-1'))?.dirty).toBe(1);
  });

  it('não altera o banco ao cancelar e encerra a sessão', async () => {
    await completeSignIn('user-1', 'cancel');

    expect(client.auth.signOut).toHaveBeenCalledOnce();
    expect(await getBoundUserId()).toBeNull();
  });

  it('descarta os dados locais e vincula a conta remota', async () => {
    await db.decks.add({ id: 'deck-1', name: 'Direito', newCardsPerDay: 1, youngLimit: 1, requestRetention: .9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0 });

    await completeSignIn('user-1', 'discard');

    expect(await db.decks.count()).toBe(0);
    expect(await getBoundUserId()).toBe('user-1');
  });

  it('apaga tudo do aparelho ao trocar para outra conta', async () => {
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });
    await db.syncState.put({ key: 'cursor:decks', value: '2026-01-01T00:00:00Z' });
    await db.decks.add({ id: 'deck-1', name: 'Direito', newCardsPerDay: 1, youngLimit: 1, requestRetention: .9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0 });

    await completeSignIn('user-2', 'merge');

    expect(await db.decks.count()).toBe(0);
    expect(await getBoundUserId()).toBe('user-2');
    expect(await db.syncState.get('cursor:decks')).toBeUndefined();
  });
});
