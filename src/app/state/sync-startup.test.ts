import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { expect, it, vi } from 'vitest';
import { App } from '../app';
import { AppUpdate } from './app-update';
import { DeckStore } from './deck-store';
import { SyncStore } from './sync-store';
import { ThemeStore } from './theme-store';

function createApp(): { startupSync: ReturnType<typeof vi.fn>; startupTheme: ReturnType<typeof vi.fn> } {
  const startupSync = vi.fn(() => ({ status: () => 'signed-out' }));
  const startupTheme = vi.fn(() => ({}));
  const injector = Injector.create({ providers: [
    { provide: DeckStore, useValue: { deck: () => null, totalDue: () => 0 } },
    { provide: AppUpdate, useValue: {} },
    { provide: SyncStore, useFactory: startupSync },
    { provide: ThemeStore, useFactory: startupTheme },
  ] });
  runInInjectionContext(injector, () => new App());
  return { startupSync, startupTheme };
}

it('inicializa a sincronização mesmo antes de abrir Ajustes', () => {
  const { startupSync } = createApp();

  expect(startupSync).toHaveBeenCalledOnce();
});

it('inicializa o tema na abertura do app, sem depender de Ajustes', () => {
  const { startupTheme } = createApp();

  expect(startupTheme).toHaveBeenCalledOnce();
});
