import { db } from './db';

export const BACKUP_REMINDER_DAYS = 30;
const DAY_MS = 86_400_000;

export interface ReminderInput {
  signedIn: boolean;
  hasCards: boolean;
  firstCardAt: number | null;
  lastBackupAt: number | null;
  now: number;
}

export interface ReminderFacts {
  hasCards: boolean;
  firstCardAt: number | null;
}

export function shouldSuggestBackup(input: ReminderInput): boolean {
  if (input.signedIn || !input.hasCards) return false;
  const anchor = input.lastBackupAt ?? input.firstCardAt;
  return anchor !== null && input.now - anchor > BACKUP_REMINDER_DAYS * DAY_MS;
}

export async function backupReminderFacts(): Promise<ReminderFacts> {
  const first = await db.cards.orderBy('createdAt').filter((card) => card.deletedAt === 0).first();
  return { hasCards: first !== undefined, firstCardAt: first?.createdAt ?? null };
}
