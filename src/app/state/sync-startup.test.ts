import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { expect, it, vi } from 'vitest';
import { App } from '../app';
import { AppUpdate } from './app-update';
import { DeckStore } from './deck-store';
import { SyncStore } from './sync-store';

it('inicializa a sincronização mesmo antes de abrir Ajustes', () => {
  const startup = vi.fn(() => ({ status: () => 'signed-out' }));
  const injector = Injector.create({ providers: [
    { provide: DeckStore, useValue: { deck: () => null, totalDue: () => 0 } },
    { provide: AppUpdate, useValue: {} },
    { provide: SyncStore, useFactory: startup },
  ] });

  runInInjectionContext(injector, () => new App());

  expect(startup).toHaveBeenCalledOnce();
});
