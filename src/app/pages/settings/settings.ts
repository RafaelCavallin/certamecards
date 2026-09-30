import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth-store';
import { SyncStore } from '../../state/sync-store';
import { formatRelativeSync } from '../../domain/format-relative-time';

const APP_VERSION = '0.1.0';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  readonly auth = inject(AuthStore);
  readonly sync = inject(SyncStore);

  readonly version = APP_VERSION;
  async syncNow(): Promise<void> {
    await this.sync.syncNow('manual');
  }

  syncStatusText(): string {
    const status = this.sync.status();
    if (status === 'offline') return 'Offline — seus dados estão no aparelho.';
    if (status === 'synced') return formatRelativeSync(this.sync.lastSyncAt(), Date.now());
    if (status === 'error') return 'A sincronização falhou.';
    if (status === 'syncing') return 'Sincronizando…';
    return 'Ainda não sincronizado.';
  }
}
