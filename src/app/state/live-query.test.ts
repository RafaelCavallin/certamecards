import { Subject } from 'rxjs';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../domain/db';
import { newDeckRecord } from '../domain/decks';
import { resetDb } from '../../test/db-helpers';
import { liveQueryOn } from './live-query';

const WAIT_MS = 50;

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, WAIT_MS));
}

function collect(trigger$: Subject<number>, querier: () => Promise<number>) {
  const values: number[] = [];
  const subscription = liveQueryOn(trigger$, querier).subscribe((value) => values.push(value));
  return { values, stop: () => subscription.unsubscribe() };
}

describe('liveQueryOn', () => {
  beforeAll(() => db.open());

  afterEach(resetDb);

  it('emite depois do primeiro gatilho', async () => {
    const trigger$ = new Subject<number>();
    const { values, stop } = collect(trigger$, () => db.decks.count());

    trigger$.next(1);
    await wait();

    expect(values).toEqual([0]);
    stop();
  });

  it('reemite quando há escrita no banco, sem novo gatilho', async () => {
    const trigger$ = new Subject<number>();
    const { values, stop } = collect(trigger$, () => db.decks.count());
    trigger$.next(1);
    await wait();

    await db.decks.add(newDeckRecord('A'));
    await wait();

    expect(values.at(-1)).toBe(1);
    stop();
  });

  it('refaz a consulta a cada gatilho, mesmo sem escrita', async () => {
    let runs = 0;
    const trigger$ = new Subject<number>();
    const { stop } = collect(trigger$, async () => ++runs);

    trigger$.next(1);
    await wait();
    trigger$.next(2);
    await wait();

    expect(runs).toBe(2);
    stop();
  });
});
