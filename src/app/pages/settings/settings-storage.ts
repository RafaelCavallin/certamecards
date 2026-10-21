import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { StoragePersistence } from '../../state/storage-persistence-store';

@Component({
  selector: 'app-settings-storage',
  templateUrl: './settings-storage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsStorage {
  readonly persistence = inject(StoragePersistence);
  readonly asking = signal(false);

  async protect(): Promise<void> {
    this.asking.set(true);
    try {
      await this.persistence.request();
    } finally {
      this.asking.set(false);
    }
  }
}
