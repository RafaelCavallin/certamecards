import { db } from './db';
import { getSupabase } from './supabase';

const BOUND_USER_KEY = 'boundUserId';
const CURSOR_KEYS = ['cursor:decks', 'cursor:cards', 'cursor:review_logs', 'cursor:user_settings'];

export interface DataSummary {
  decks: number;
  cards: number;
  reviewLogs: number;
}

export type SignInPlan = 'merge' | 'discard' | 'cancel';
export type SignInDecision =
  | { kind: 'resume' | 'auto-adopt' }
  | { kind: 'prompt' | 'switch'; local: DataSummary; remote: DataSummary };

export async function getBoundUserId(): Promise<string | null> {
  const row = await db.syncState.get(BOUND_USER_KEY);
  return typeof row?.value === 'string' ? row.value : null;
}

export async function decideOnSignIn(userId: string): Promise<SignInDecision> {
  const boundUserId = await getBoundUserId();
  if (boundUserId === userId) return { kind: 'resume' };
  const [local, remote] = await Promise.all([localSummary(), remoteSummary()]);
  if (isEmpty(local) || isEmpty(remote)) return { kind: 'auto-adopt' };
  return boundUserId ? { kind: 'switch', local, remote } : { kind: 'prompt', local, remote };
}

export async function completeSignIn(userId: string, plan: SignInPlan): Promise<void> {
  if (plan === 'cancel') return cancelSignIn();
  const previousUserId = await getBoundUserId();
  const isAccountSwitch = Boolean(previousUserId) && previousUserId !== userId;
  if (plan === 'discard' || isAccountSwitch) await wipeLocalData();
  else await mergeLocalData();
  await db.syncState.put({ key: BOUND_USER_KEY, value: userId });
}

async function cancelSignIn(): Promise<void> {
  const client = await getSupabase();
  await client?.auth.signOut();
}

async function mergeLocalData(): Promise<void> {
  await clearCursors();
  await markDirty();
}

async function localSummary(): Promise<DataSummary> {
  const [decks, cards, reviewLogs] = await Promise.all([
    db.decks.filter((row) => row.deletedAt === 0).count(),
    db.cards.filter((row) => row.deletedAt === 0).count(),
    db.reviewLogs.count(),
  ]);
  return { decks, cards, reviewLogs };
}

async function remoteSummary(): Promise<DataSummary> {
  const client = await getSupabase();
  if (!client) return { decks: 0, cards: 0, reviewLogs: 0 };
  const [decks, cards, reviewLogs] = await Promise.all([
    client.from('decks').select('id', { count: 'exact', head: true }).eq('deleted_at', 0),
    client.from('cards').select('id', { count: 'exact', head: true }).eq('deleted_at', 0),
    client.from('review_logs').select('id', { count: 'exact', head: true }),
  ]);
  return { decks: decks.count ?? 0, cards: cards.count ?? 0, reviewLogs: reviewLogs.count ?? 0 };
}

function isEmpty(summary: DataSummary): boolean {
  return summary.decks === 0 && summary.cards === 0 && summary.reviewLogs === 0;
}

async function markDirty(): Promise<void> {
  await Promise.all([
    db.decks.toCollection().modify({ dirty: 1 }),
    db.cards.toCollection().modify({ dirty: 1 }),
    db.reviewLogs.toCollection().modify({ dirty: 1 }),
    db.settings.toCollection().modify({ dirty: 1 }),
  ]);
}

async function clearCursors(): Promise<void> {
  await db.syncState.bulkDelete(CURSOR_KEYS);
}

async function wipeLocalData(): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, db.reviewLogs, db.settings, db.syncState, async () => {
    await db.decks.clear();
    await db.cards.clear();
    await db.reviewLogs.clear();
    await db.settings.clear();
    await db.syncState.clear();
  });
}
