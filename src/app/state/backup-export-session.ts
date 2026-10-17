import { Injectable, inject, signal } from '@angular/core';
import { BackupStore } from './backup-store';
import { liveQuerySignal } from './live-query';
import { GENERIC_EXPORT_FAILURE, backupFailureMessage, warnBackup } from '../domain/backup-errors';
import { estimateBackupSize } from '../domain/backup-estimate';
import { createBackup, type ExportProgress } from '../domain/backup-export';
import { missingImagesLabel } from '../domain/backup-labels';
import { hasBackupContent } from '../domain/backup-records';
import { deliverFile } from '../domain/file-delivery';

@Injectable()
export class BackupExportSession {
  private readonly store = inject(BackupStore);

  readonly estimate = liveQuerySignal(estimateBackupSize);
  readonly hasContent = liveQuerySignal(hasBackupContent);
  readonly exporting = signal(false);
  readonly progress = signal<ExportProgress | null>(null);
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);

  async exportNow(): Promise<void> {
    if (this.exporting()) return;
    this.reset();
    try {
      const result = await createBackup((progress) => this.progress.set(progress));
      await deliverFile(result.blob, result.fileName);
      this.store.markBackedUp(Date.now());
      this.notice.set(result.missingImages > 0 ? missingImagesLabel(result.missingImages) : null);
      this.done.set(true);
    } catch (error: unknown) {
      warnBackup('export', error);
      this.error.set(backupFailureMessage(error, GENERIC_EXPORT_FAILURE));
    } finally {
      this.exporting.set(false);
      this.progress.set(null);
    }
  }

  private reset(): void {
    this.exporting.set(true);
    this.done.set(false);
    this.notice.set(null);
    this.error.set(null);
  }
}
