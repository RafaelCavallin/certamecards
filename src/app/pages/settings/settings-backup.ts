import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth-store';
import { BackupStore } from '../../state/backup-store';
import { liveQuerySignal } from '../../state/live-query';
import { backupReminderFacts, shouldSuggestBackup } from '../../domain/backup-reminder';

@Component({
  selector: 'app-settings-backup',
  imports: [RouterLink],
  templateUrl: './settings-backup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBackup {
  private readonly auth = inject(AuthStore);
  private readonly store = inject(BackupStore);
  private readonly facts = liveQuerySignal(backupReminderFacts);

  readonly suggest = computed(() => {
    const facts = this.facts();
    if (!facts) return false;
    return shouldSuggestBackup({
      signedIn: this.auth.session() !== null,
      hasCards: facts.hasCards,
      firstCardAt: facts.firstCardAt,
      lastBackupAt: this.store.lastBackupAt(),
      now: Date.now(),
    });
  });
}
