import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BackupExportSession } from '../../state/backup-export-session';
import { BackupStore } from '../../state/backup-store';
import { estimateLabel, lastBackupLabel } from '../../domain/backup-labels';
import { NOTHING_TO_SAVE_HINT } from '../../domain/backup-errors';

const FULL_PERCENT = 100;

@Component({
  selector: 'app-backup-export',
  templateUrl: './backup-export.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupExport {
  readonly session = inject(BackupExportSession);
  private readonly store = inject(BackupStore);

  readonly nothingToSave = NOTHING_TO_SAVE_HINT;
  readonly empty = computed(() => this.session.hasContent() === false);
  readonly lastBackup = computed(() => lastBackupLabel(this.store.lastBackupAt(), Date.now()));
  readonly estimate = computed(() => {
    const bytes = this.session.estimate();
    return bytes === undefined ? null : estimateLabel(bytes);
  });
  readonly percent = computed(() => {
    const progress = this.session.progress();
    if (progress?.phase !== 'zip' || !progress.total) return null;
    return Math.round(((progress.done ?? 0) / progress.total) * FULL_PERCENT);
  });
}
