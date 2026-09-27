import { DestroyRef, Service, inject, signal } from '@angular/core';
import { SwUpdate, type VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

function isVersionReady(event: { type: string }): event is VersionReadyEvent {
  return event.type === 'VERSION_READY';
}

/** Aviso de nova versão do service worker — a única borda RxJS além de `live-query.ts`. */
@Service()
export class AppUpdate {
  private readonly swUpdate = inject(SwUpdate);
  private readonly availableSignal = signal(false);

  readonly available = this.availableSignal.asReadonly();

  constructor() {
    if (!this.swUpdate.isEnabled) return;
    const subscription = this.swUpdate.versionUpdates
      .pipe(filter(isVersionReady))
      .subscribe(() => this.availableSignal.set(true));
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  reload(): void {
    document.location.reload();
  }
}
