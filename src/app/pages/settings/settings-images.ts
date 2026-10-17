import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthStore } from '../../state/auth-store';
import { liveQuerySignal } from '../../state/live-query';
import { imageUsage } from '../../domain/card-images';
import { imageUsageLabel } from '../../domain/image-labels';

@Component({
  selector: 'app-settings-images',
  templateUrl: './settings-images.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsImages {
  private readonly auth = inject(AuthStore);
  private readonly usage = liveQuerySignal(imageUsage);

  readonly label = computed(() => {
    const usage = this.usage();
    return usage ? imageUsageLabel({ ...usage, withAccount: this.auth.session() !== null }) : '';
  });
}
