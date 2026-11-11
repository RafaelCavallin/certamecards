import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const session = { user: { id: 'user-1', email: 'teste@example.test', user_metadata: {} } } as Session;
const client = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null } })),
    signInWithPassword: vi.fn(async () => ({ data: { session }, error: null })),
    signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
    updateUser: vi.fn(async (attrs: { data: Record<string, unknown> }) => ({
      data: { user: { ...session.user, user_metadata: attrs.data } },
      error: null as { message: string; code?: string } | null,
    })),
  },
};

vi.mock('../domain/auth', () => ({
  completeSignIn: vi.fn(async () => undefined),
  decideOnSignIn: vi.fn(async () => ({ kind: 'auto-adopt', plan: 'merge' })),
}));
vi.mock('../domain/supabase', () => ({
  getSupabase: async () => client,
  isSyncConfigured: () => true,
}));

const { AuthStore } = await import('./auth-store');

afterEach(() => vi.clearAllMocks());

describe('AuthStore — nome do usuário', () => {
  it('grava o nome normalizado no display_name ao criar a conta', async () => {
    const store = new AuthStore();

    const result = await store.signUp('teste@example.test', 'senha-local', '  Maria   Silva ');

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'teste@example.test',
      password: 'senha-local',
      options: { data: { display_name: 'Maria Silva' } },
    });
    expect(result).toEqual({ error: null, needsConfirmation: true });
  });

  it('atualiza o nome exibido ao editar', async () => {
    const store = new AuthStore();
    await store.signIn('teste@example.test', 'senha-local');
    expect(store.displayName()).toBeNull();

    const result = await store.updateDisplayName(' Ana ');

    expect(client.auth.updateUser).toHaveBeenCalledWith({ data: { display_name: 'Ana' } });
    expect(result).toEqual({ error: null });
    expect(store.displayName()).toBe('Ana');
  });

  it('devolve o erro do Supabase em português e mantém o nome ao falhar a edição', async () => {
    client.auth.updateUser.mockResolvedValueOnce({ data: { user: session.user }, error: { message: 'Request rate limit reached', code: 'over_request_rate_limit' } });
    const store = new AuthStore();
    await store.signIn('teste@example.test', 'senha-local');

    const result = await store.updateDisplayName('Ana');

    expect(result.error).toMatch(/^Muitas tentativas seguidas/);
    expect(store.displayName()).toBeNull();
  });

  it('não edita o nome sem sessão', async () => {
    const store = new AuthStore();

    const result = await store.updateDisplayName('Ana');

    expect(result.error).not.toBeNull();
    expect(client.auth.updateUser).not.toHaveBeenCalled();
  });
});
