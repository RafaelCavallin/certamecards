import { afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase sem configuração', () => {
  it('não carrega cliente sem configuração', async () => {
    vi.resetModules();
    vi.doMock('../../environments/env', () => ({ env: null }));
    const module = await import('./supabase');

    const client = await module.getSupabase();

    expect(module.isSyncConfigured()).toBe(false);
    expect(client).toBeNull();
    vi.doUnmock('../../environments/env');
  });
});

describe('supabase configurado', () => {
  afterEach(() => {
    vi.doUnmock('../../environments/env');
    vi.doUnmock('@supabase/supabase-js');
    vi.resetModules();
  });

  it('cria o cliente uma única vez e reaproveita em chamadas seguintes', async () => {
    const createClient = vi.fn(() => ({ mocked: true }));
    vi.resetModules();
    vi.doMock('../../environments/env', () => ({ env: { supabaseUrl: 'https://local.test', supabasePublishableKey: 'key' } }));
    vi.doMock('@supabase/supabase-js', () => ({ createClient }));
    const module = await import('./supabase');

    const first = await module.getSupabase();
    const second = await module.getSupabase();

    expect(module.isSyncConfigured()).toBe(true);
    expect(createClient).toHaveBeenCalledOnce();
    expect(first).toBe(second);
  });
});
