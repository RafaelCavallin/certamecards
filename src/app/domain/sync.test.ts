import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';

const getSupabase = vi.fn();
vi.mock('./supabase', () => ({ getSupabase: () => getSupabase() }));
const { syncNow } = await import('./sync');

afterEach(async () => { await resetDb(); vi.clearAllMocks(); });

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

describe('syncNow', () => {
  it('não usa rede sem conta vinculada', async () => {
    setOnline(true);

    expect(await syncNow('manual')).toEqual({ status: 'signed-out' });
  });

  it('sinaliza offline sem tentar a rede', async () => {
    setOnline(false);
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });

    expect(await syncNow('manual')).toEqual({ status: 'offline' });
  });

  it('sinaliza indisponibilidade quando há conta sem configuração', async () => {
    setOnline(true);
    getSupabase.mockResolvedValue(null);
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });

    expect(await syncNow('manual')).toEqual({ status: 'disabled' });
  });

  it('sincroniza com sucesso quando há conta vinculada e sessão válida', async () => {
    setOnline(true);
    getSupabase.mockResolvedValue(createFakeSupabase({ session: { user: { id: 'user-1' } } }).client);
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });

    const outcome = await syncNow('manual');

    expect(outcome.status).toBe('ok');
  });
});
