import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth-store';
import { liveQuerySignal } from '../../state/live-query';
import { browserStorage } from '../../domain/local-storage';
import {
  accountNudgeFacts,
  nudgeLevel,
  readDismissedLevel,
  shouldNudgeAccount,
  writeDismissedLevel,
} from '../../domain/account-nudge';

@Component({
  selector: 'app-account-nudge',
  imports: [RouterLink],
  templateUrl: './account-nudge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountNudge {
  private readonly auth = inject(AuthStore);
  private readonly storage = browserStorage();
  private readonly facts = liveQuerySignal(accountNudgeFacts);
  private readonly dismissed = signal(readDismissedLevel(this.storage));
  private readonly level = computed(() => {
    const facts = this.facts();
    return facts ? nudgeLevel(facts) : 0;
  });

  readonly cards = computed(() => this.facts()?.cards ?? 0);
  readonly visible = computed(() =>
    shouldNudgeAccount({
      signedOut: this.auth.phase() === 'signed-out',
      level: this.level(),
      dismissedLevel: this.dismissed(),
    }),
  );

  dismiss(): void {
    writeDismissedLevel(this.storage, this.level());
    this.dismissed.set(this.level());
  }
}
