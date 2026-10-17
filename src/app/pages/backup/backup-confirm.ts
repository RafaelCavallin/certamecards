import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BackupRestoreSession } from '../../state/backup-restore-session';

@Component({
  selector: 'app-backup-confirm',
  templateUrl: './backup-confirm.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupConfirm {
  readonly session = inject(BackupRestoreSession);
}
