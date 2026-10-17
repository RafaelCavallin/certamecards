import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackupRestoreSession } from '../../state/backup-restore-session';
import { summaryLines } from '../../domain/backup-summary-text';

@Component({
  selector: 'app-backup-summary',
  imports: [RouterLink],
  templateUrl: './backup-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupSummary {
  readonly session = inject(BackupRestoreSession);
  readonly lines = computed(() => {
    const report = this.session.report();
    return report ? summaryLines(report) : [];
  });
}
