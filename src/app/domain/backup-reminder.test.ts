import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { BACKUP_DAY, BACKUP_NOW, makeCard } from '../../test/backup-fixtures';
import { backupReminderFacts, shouldSuggestBackup, type ReminderInput } from './backup-reminder';
import { db } from './db';

afterEach(resetDb);

const base: ReminderInput = {
  signedIn: false,
  hasCards: true,
  firstCardAt: BACKUP_NOW - 90 * BACKUP_DAY,
  lastBackupAt: null,
  now: BACKUP_NOW,
};

describe('shouldSuggestBackup', () => {
  it('sugere com mais de 30 dias desde o último backup', () => {
    expect(shouldSuggestBackup({ ...base, lastBackupAt: BACKUP_NOW - 31 * BACKUP_DAY })).toBe(true);
  });

  it('não sugere com 29 dias nem com exatamente 30', () => {
    expect(shouldSuggestBackup({ ...base, lastBackupAt: BACKUP_NOW - 29 * BACKUP_DAY })).toBe(false);
    expect(shouldSuggestBackup({ ...base, lastBackupAt: BACKUP_NOW - 30 * BACKUP_DAY })).toBe(false);
  });

  it('não sugere com conta conectada nem sem cartões', () => {
    expect(shouldSuggestBackup({ ...base, signedIn: true })).toBe(false);
    expect(shouldSuggestBackup({ ...base, hasCards: false, firstCardAt: null })).toBe(false);
  });

  it('sem backup nenhum, conta os dias a partir do primeiro cartão', () => {
    expect(shouldSuggestBackup(base)).toBe(true);
    expect(shouldSuggestBackup({ ...base, firstCardAt: BACKUP_NOW - 5 * BACKUP_DAY })).toBe(false);
  });
});

describe('backupReminderFacts', () => {
  it('devolve o primeiro cartão vivo, ignorando os excluídos', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'gone', createdAt: 1, deletedAt: 5 }),
      makeCard({ id: 'b', createdAt: 300 }),
      makeCard({ id: 'a', createdAt: 200 }),
    ]);

    expect(await backupReminderFacts()).toEqual({ hasCards: true, firstCardAt: 200 });
  });

  it('sem cartões vivos, não há primeiro cartão', async () => {
    expect(await backupReminderFacts()).toEqual({ hasCards: false, firstCardAt: null });
  });
});
