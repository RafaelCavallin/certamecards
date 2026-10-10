import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from './auth-store';
import { BackupStore } from './backup-store';
import { SyncStore } from './sync-store';
import { GENERIC_READ_FAILURE, GENERIC_RESTORE_FAILURE, SAFETY_BACKUP_FAILURE, backupFailureMessage, warnBackup } from '../domain/backup-errors';
import { createBackup } from '../domain/backup-export';
import type { BackupPreview, RestorePlan, RestoreProgress, RestoreReport } from '../domain/backup-format';
import { confirmationFor } from '../domain/backup-labels';
import { hasStudyData } from '../domain/backup-records';
import { readBackup, restoreBackup } from '../domain/backup-restore';
import { canGoBackFrom, previousRestoreStep, type RestoreStep } from '../domain/backup-steps';
import { deliverFile } from '../domain/file-delivery';

@Injectable()
export class BackupRestoreSession {
  private readonly store = inject(BackupStore);
  private readonly auth = inject(AuthStore);
  private readonly sync = inject(SyncStore);

  readonly step = signal<RestoreStep>('pick');
  readonly preview = signal<BackupPreview | null>(null);
  readonly plan = signal<RestorePlan>('merge');
  readonly progress = signal<RestoreProgress | null>(null);
  readonly report = signal<RestoreReport | null>(null);
  readonly error = signal<string | null>(null);
  readonly canGoBack = computed(() => canGoBackFrom(this.step()));
  readonly confirmation = computed(() => {
    const preview = this.preview();
    return preview ? confirmationFor({ plan: this.plan(), accountMismatch: preview.accountMismatch }) : null;
  });

  async pickFile(file: File): Promise<void> {
    this.error.set(null);
    this.step.set('reading');
    try {
      this.preview.set(await readBackup(file));
      this.plan.set('merge');
      this.step.set('preview');
    } catch (error: unknown) {
      warnBackup('read', error);
      this.error.set(backupFailureMessage(error, GENERIC_READ_FAILURE));
      this.step.set('pick');
    }
  }

  async proceed(): Promise<void> {
    if (this.confirmation()) this.step.set('confirm');
    else await this.run();
  }

  async run(): Promise<void> {
    const preview = this.preview();
    if (!preview) return;
    this.error.set(null);
    this.step.set('restoring');
    this.progress.set({ done: 0, total: 0 });
    if (this.plan() === 'replace' && !(await this.saveSafetyBackup())) return;
    try {
      this.report.set(await restoreBackup({ preview, plan: this.plan(), onProgress: (progress) => this.progress.set(progress) }));
      this.preview.set(null);
      this.step.set('done');
      if (this.auth.session()) void this.sync.syncNow('manual');
    } catch (error: unknown) {
      warnBackup('restore', error);
      this.error.set(backupFailureMessage(error, GENERIC_RESTORE_FAILURE));
      this.step.set('preview');
    }
  }

  back(): void {
    this.error.set(null);
    if (this.step() === 'preview') this.preview.set(null);
    this.step.set(previousRestoreStep(this.step()));
  }

  private async saveSafetyBackup(): Promise<boolean> {
    if (!(await hasStudyData())) return true;
    try {
      const result = await createBackup();
      await deliverFile(result.blob, result.fileName);
      this.store.markBackedUp(Date.now());
      return true;
    } catch (error: unknown) {
      warnBackup('safety-backup', error);
      this.error.set(SAFETY_BACKUP_FAILURE);
      this.step.set('preview');
      return false;
    }
  }
}
