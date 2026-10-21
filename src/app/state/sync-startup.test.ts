import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { expect, it, vi } from 'vitest';
import { App } from '../app';
import { AppUpdate } from './app-update';
import { DeckStore } from './deck-store';
import { StorageHealth } from './storage-health';
import { StoragePersistence } from './storage-persistence-store';
import { SyncStore } from './sync-store';
import { ThemeStore } from './theme-store';

interface StartupSpies {
  startupSync: ReturnType<typeof vi.fn>;
  startupTheme: ReturnType<typeof vi.fn>;
  startupHealth: ReturnType<typeof vi.fn>;
  requestPersistence: ReturnType<typeof vi.fn>;
}

function createApp(): StartupSpies {
  const startupSync = vi.fn(() => ({ status: () => 'signed-out' }));
  const startupTheme = vi.fn(() => ({}));
  const startupHealth = vi.fn(() => ({}));
  const requestPersistence = vi.fn(() => Promise.resolve());
  const injector = Injector.create({ providers: [
    { provide: DeckStore, useValue: { deck: () => null, totalDue: () => 0 } },
    { provide: AppUpdate, useValue: {} },
    { provide: SyncStore, useFactory: startupSync },
    { provide: ThemeStore, useFactory: startupTheme },
    { provide: StorageHealth, useFactory: startupHealth },
    { provide: StoragePersistence, useValue: { request: requestPersistence } },
  ] });
  runInInjectionContext(injector, () => new App());
  return { startupSync, startupTheme, startupHealth, requestPersistence };
}

it('inicializa a sincronização mesmo antes de abrir Ajustes', () => {
  const { startupSync } = createApp();

  expect(startupSync).toHaveBeenCalledOnce();
});

it('inicializa o tema na abertura do app, sem depender de Ajustes', () => {
  const { startupTheme } = createApp();

  expect(startupTheme).toHaveBeenCalledOnce();
});

it('observa a perda dos dados locais desde a abertura do app', () => {
  const { startupHealth } = createApp();

  expect(startupHealth).toHaveBeenCalledOnce();
});

it('pede armazenamento persistente na abertura do app', () => {
  const { requestPersistence } = createApp();

  expect(requestPersistence).toHaveBeenCalledOnce();
});
