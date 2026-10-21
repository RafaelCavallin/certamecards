import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsBackup } from './settings-backup';
import { SettingsImages } from './settings-images';
import { SettingsStorage } from './settings-storage';
import { SettingsTheme } from './settings-theme';
import { AuthStore } from '../../state/auth-store';
import { SyncStore } from '../../state/sync-store';
import { liveQuerySignal } from '../../state/live-query';
import { pendingUploadCount } from '../../domain/card-images';
import { formatRelativeSync } from '../../domain/format-relative-time';
import { pendingUploadsLabel } from '../../domain/image-labels';

const APP_VERSION = '0.1.0';

@Component({
  selector: 'app-settings',
  imports: [RouterLink, SettingsBackup, SettingsImages, SettingsStorage, SettingsTheme],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  readonly auth = inject(AuthStore);
  readonly sync = inject(SyncStore);

  readonly version = APP_VERSION;
  private readonly pending = liveQuerySignal(pendingUploadCount);
  readonly pendingLabel = computed(() => ((this.pending() ?? 0) > 0 ? pendingUploadsLabel(this.pending() ?? 0) : null));

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
