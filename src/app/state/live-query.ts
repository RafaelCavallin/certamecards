import { type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';

/**
 * Único ponto onde o Dexie vira signal. `initialValue: undefined` reflete o
 * estado "ainda carregando" sem exigir que cada consumidor trate isso à mão.
 */
export function liveQuerySignal<T>(querier: () => Promise<T> | T): Signal<T | undefined> {
  return toSignal(liveQuery(querier), { initialValue: undefined });
}
