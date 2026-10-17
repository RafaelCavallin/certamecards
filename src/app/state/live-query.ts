import { type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { concat, of, switchMap } from 'rxjs';

/**
 * Único ponto onde o Dexie vira signal. `initialValue: undefined` reflete o
 * estado "ainda carregando" sem exigir que cada consumidor trate isso à mão.
 */
export function liveQuerySignal<T>(querier: () => Promise<T> | T): Signal<T | undefined> {
  return toSignal(liveQuery(querier), { initialValue: undefined });
}

/**
 * Como `liveQuerySignal`, mas refaz a consulta quando `source` muda (ex.: troca
 * de baralho). Volta a `undefined` enquanto a nova consulta carrega.
 */
export function liveQueryFor<K, T>(
  source: Signal<K | undefined>,
  querier: (key: K) => Promise<T> | T,
): Signal<T | undefined> {
  const stream = toObservable(source).pipe(
    switchMap((key) =>
      key === undefined ? of(undefined) : concat(of(undefined), liveQuery(() => querier(key))),
    ),
  );
  return toSignal(stream, { initialValue: undefined });
}
