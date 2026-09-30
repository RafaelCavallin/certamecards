import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const session = { user: { id: 'user-1', email: 'teste@example.test' } } as Session;
const completeSignIn = vi.fn(async () => undefined);
const decideOnSignIn = vi.fn(async () => ({ kind: 'prompt', local: { decks: 1, cards: 0, reviewLogs: 0 }, remote: { decks: 1, cards: 1, reviewLogs: 0 } }));
const client = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null } })),
    signInWithPassword: vi.fn(async () => ({ data: { session }, error: null })),
  },
};

vi.mock('../domain/auth', () => ({
  completeSignIn,
  decideOnSignIn,
}));
vi.mock('../domain/supabase', () => ({
  getSupabase: async () => client,
  isSyncConfigured: () => true,
}));

const { AuthStore } = await import('./auth-store');

afterEach(() => vi.clearAllMocks());

describe('AuthStore', () => {
  it('só anuncia sessão ativa após vincular a conta adotada', async () => {
    let finish!: () => void;
    const linking = new Promise<void>((resolve) => { finish = resolve; });
    decideOnSignIn.mockResolvedValueOnce({ kind: 'auto-adopt', local: { decks: 1, cards: 0, reviewLogs: 0 }, remote: { decks: 0, cards: 0, reviewLogs: 0 } });
    completeSignIn.mockImplementationOnce(() => linking);
    const store = new AuthStore();
    const signIn = store.signIn('teste@example.test', 'senha-local');
    await vi.waitFor(() => expect(completeSignIn).toHaveBeenCalledWith('user-1', 'merge'));

    expect(store.phase()).not.toBe('signed-in');
    finish();
    await signIn;
    expect(store.phase()).toBe('signed-in');
  });

  it('remove a sessão exibida ao cancelar a decisão de login', async () => {
    const store = new AuthStore();
    await store.signIn('teste@example.test', 'senha-local');

    await store.resolveDecision('cancel');

    expect(completeSignIn).toHaveBeenCalledWith('user-1', 'cancel');
    expect(store.session()).toBeNull();
    expect(store.phase()).toBe('signed-out');
    expect(store.pendingDecision()).toBeNull();
  });
});
