import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BackupRestoreSession } from '../../state/backup-restore-session';

@Component({
  selector: 'app-backup-pick',
  templateUrl: './backup-pick.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupPick {
  readonly session = inject(BackupRestoreSession);
  readonly reading = computed(() => this.session.step() === 'reading');

  pick(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.session.pickFile(file);
  }
}
