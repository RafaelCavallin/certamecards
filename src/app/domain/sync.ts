import { getBoundUserId } from './auth';
import { getSupabase } from './supabase';
import { pullAll } from './sync-pull';
import { pushDirty } from './sync-push';

export type SyncReason = 'manual' | 'signin' | 'online' | 'boot';
export type SyncOutcome =
  | { status: 'ok'; pulled: number; pushed: number; at: number }
  | { status: 'disabled' | 'signed-out' | 'offline' }
  | { status: 'error'; message: string };

const SYNC_LOCK_KEY = 'certamecards-sync';

export async function syncNow(reason: SyncReason): Promise<SyncOutcome> {
  void reason;
  if (!navigator.onLine) return { status: 'offline' };
  if (!navigator.locks) return runSync();
  return navigator.locks.request(SYNC_LOCK_KEY, { ifAvailable: true }, (lock) => (lock ? runSync() : skippedOutcome()));
}

async function runSync(): Promise<SyncOutcome> {
  const boundUserId = await getBoundUserId();
  if (!boundUserId) return { status: 'signed-out' };
  const client = await getSupabase();
  if (!client) return { status: 'disabled' };
  try {
    const { data } = await client.auth.getSession();
    if (!data.session) return { status: 'signed-out' };
    if (data.session.user.id !== boundUserId) return mismatchedAccountOutcome();
    const pulled = await pullAll(client);
    const pushed = await pushDirty(client);
    return { status: 'ok', pulled, pushed, at: Date.now() };
  } catch (error: unknown) {
    return isOffline(error) ? { status: 'offline' } : { status: 'error', message: errorMessage(error) };
  }
}

function skippedOutcome(): Promise<SyncOutcome> {
  return Promise.resolve({ status: 'ok', pulled: 0, pushed: 0, at: Date.now() });
}

function mismatchedAccountOutcome(): SyncOutcome {
  return { status: 'error', message: 'A sessão atual não é a conta vinculada a este aparelho.' };
}

function isOffline(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && /fetch|network/i.test(error.message));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'A sincronização falhou.';
}
