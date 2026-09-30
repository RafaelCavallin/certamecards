import { DestroyRef, Service, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from './auth-store';
import { syncNow, type SyncOutcome, type SyncReason } from '../domain/sync';

const LAST_SYNC_KEY = 'certamecards.lastSync';
export type SyncStatus = 'disabled' | 'offline' | 'syncing' | 'synced' | 'error' | 'signed-out';

@Service()
export class SyncStore {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly statusSignal = signal<SyncStatus>('disabled');
  private readonly lastSyncSignal = signal<number>(Number(localStorage.getItem(LAST_SYNC_KEY)) || 0);
  readonly status = this.statusSignal.asReadonly();
  readonly lastSyncAt = this.lastSyncSignal.asReadonly();

  constructor() {
    this.registerTriggers();
  }

  async syncNow(reason: SyncReason): Promise<SyncOutcome> {
    this.statusSignal.set('syncing');
    const outcome = await syncNow(reason);
    this.statusSignal.set(outcome.status === 'ok' ? 'synced' : outcome.status);
    if (outcome.status === 'ok') this.recordSuccess(outcome.at);
    return outcome;
  }

  private recordSuccess(at: number): void {
    this.lastSyncSignal.set(at);
    localStorage.setItem(LAST_SYNC_KEY, String(at));
  }

  private registerTriggers(): void {
    effect(() => {
      if (this.authStore.phase() === 'signed-in' && !this.authStore.pendingDecision()) void this.syncNow('signin');
    });
    this.registerOnlineTrigger();
    this.registerNavigationTrigger();
    void this.syncNow('boot');
  }

  private registerOnlineTrigger(): void {
    const onOnline = () => void this.syncNow('online');
    window.addEventListener('online', onOnline);
    this.destroyRef.onDestroy(() => window.removeEventListener('online', onOnline));
  }

  private registerNavigationTrigger(): void {
    const isHomeNavigation = (event: unknown): event is NavigationEnd => event instanceof NavigationEnd && event.urlAfterRedirects === '/';
    const subscription = this.router.events.pipe(filter(isHomeNavigation)).subscribe(() => void this.syncNow('boot'));
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
