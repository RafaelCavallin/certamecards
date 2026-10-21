import { DestroyRef, Service, inject, signal } from '@angular/core';
import { browserStorage } from '../domain/local-storage';
import { dismissStoreLoss, pendingStoreLoss } from '../domain/store-marker';
import { initStoreMarker, watchConnectionClosed } from '../domain/storage-loss';

@Service()
export class StorageHealth {
  private readonly storage = browserStorage();
  private readonly connectionLostSignal = signal(false);
  private readonly lostAtSignal = signal<number | null>(null);

  readonly connectionLost = this.connectionLostSignal.asReadonly();
  readonly lostAt = this.lostAtSignal.asReadonly();

  constructor() {
    void this.checkPendingLoss();
    const stop = watchConnectionClosed(() => this.connectionLostSignal.set(true));
    inject(DestroyRef).onDestroy(stop);
  }

  dismissLoss(): void {
    dismissStoreLoss(this.storage);
    this.lostAtSignal.set(null);
  }

  reload(): void {
    location.reload();
  }

  private async checkPendingLoss(): Promise<void> {
    try {
      await initStoreMarker(this.storage);
    } catch (error: unknown) {
      console.error('Não foi possível abrir o banco local.', error);
    }
    this.lostAtSignal.set(pendingStoreLoss(this.storage));
  }
}
