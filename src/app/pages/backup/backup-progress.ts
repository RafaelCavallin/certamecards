import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BackupRestoreSession } from '../../state/backup-restore-session';
import { formatCount, progressMilestone } from '../../domain/anki-import-text';

const FULL_PERCENT = 100;

@Component({
  selector: 'app-backup-progress',
  templateUrl: './backup-progress.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupProgress {
  readonly session = inject(BackupRestoreSession);

  readonly label = computed(() => {
    const { done, total } = this.session.progress() ?? { done: 0, total: 0 };
    return total > 0 ? `Restaurando… ${formatCount(done)} de ${formatCount(total)}` : 'Restaurando…';
  });
  readonly percent = computed(() => {
    const { done, total } = this.session.progress() ?? { done: 0, total: 0 };
    return total > 0 ? Math.round((done / total) * FULL_PERCENT) : 0;
  });
  readonly milestone = computed(() => {
    const { done, total } = this.session.progress() ?? { done: 0, total: 0 };
    return `${progressMilestone(done, total)}% concluído`;
  });
}
