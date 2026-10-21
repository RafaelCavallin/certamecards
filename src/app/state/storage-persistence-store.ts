import { Service, signal } from '@angular/core';
import { browserPersistenceManager, requestPersistence, type PersistenceState } from '../domain/storage-persistence';

@Service()
export class StoragePersistence {
  private readonly stateSignal = signal<PersistenceState | undefined>(undefined);

  readonly state = this.stateSignal.asReadonly();

  async request(): Promise<void> {
    this.stateSignal.set(await requestPersistence(browserPersistenceManager()));
  }
}
