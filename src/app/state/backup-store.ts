import { Service, signal } from '@angular/core';
import { LAST_BACKUP_KEY, parseLastBackupAt } from '../domain/backup-storage';

function readStored(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

function writeStored(at: number): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(at));
  } catch {
    return;
  }
}

@Service()
export class BackupStore {
  private readonly lastBackupSignal = signal<number | null>(parseLastBackupAt(readStored()));
  readonly lastBackupAt = this.lastBackupSignal.asReadonly();

  markBackedUp(at: number): void {
    this.lastBackupSignal.set(at);
    writeStored(at);
  }
}
