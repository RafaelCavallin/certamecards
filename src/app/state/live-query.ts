import { type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { type Observable, concat, of, switchMap } from 'rxjs';

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

/**
 * Refaz o `liveQuery` a cada valor de `trigger$`, além de a cada escrita no
 * banco. Observable puro, para ser testável sem Angular.
 */
export function liveQueryOn<T>(trigger$: Observable<unknown>, querier: () => Promise<T> | T): Observable<T> {
  return trigger$.pipe(switchMap(() => liveQuery(querier)));
}

/**
 * Para consultas que dependem de `Date.now()`: o Dexie só avisa escrita, então
 * `trigger` (o `DueTick`) força o recálculo com a passagem do tempo. Mantém o
 * último valor enquanto recalcula, sem voltar ao placeholder a cada passo.
 */
export function liveQueryTicking<T>(trigger: Signal<unknown>, querier: () => Promise<T> | T): Signal<T | undefined> {
  return toSignal(liveQueryOn(toObservable(trigger), querier), { initialValue: undefined });
}
