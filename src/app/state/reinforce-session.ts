import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DeckStore } from './deck-store';
import { liveQueryFor } from './live-query';
import { filterDifficultByTags } from '../domain/difficulty';
import { listDifficult, liveCardIds } from '../domain/difficulty-data';
import {
  answerReinforce,
  dropMissing,
  pickReinforceCards,
  reinforceProgress,
  startReinforce,
  summarizeReinforce,
  type ReinforceState,
} from '../domain/reinforce';
import type { Card } from '../domain/db';
import type { BinaryRating } from '../domain/scheduler';

export interface MissedItem {
  card: Card;
  misses: number;
}

@Injectable()
export class ReinforceSession {
  private readonly deckStore = inject(DeckStore);
  private readonly stateSignal = signal<ReinforceState | null>(null);
  private readonly cardsSignal = signal<ReadonlyMap<string, Card>>(new Map());
  private readonly deckId = computed(() => this.deckStore.deck()?.id);
  private readonly alive = liveQueryFor(this.deckId, liveCardIds);

  readonly revealed = signal(false);
  readonly loading = computed(() => this.stateSignal() === null);
  readonly current = computed(() => {
    const id = this.stateSignal()?.pending[0];
    return id === undefined ? undefined : this.cardsSignal().get(id);
  });
  readonly again = computed(() => (this.stateSignal()?.misses[this.current()?.id ?? ''] ?? 0) > 0);
  readonly progress = computed(() => {
    const state = this.stateSignal();
    return state ? reinforceProgress(state) : { done: 0, total: 0 };
  });
  readonly empty = computed(() => this.finished() && this.progress().total === 0);
  readonly summary = computed(() => {
    const state = this.stateSignal();
    return state && this.finished() && state.cleared.length > 0 ? summarizeReinforce(state) : null;
  });
  readonly missedItems = computed<MissedItem[]>(() =>
    (this.summary()?.missed ?? []).flatMap((missed) => {
      const card = this.cardsSignal().get(missed.id);
      return card ? [{ card, misses: missed.misses }] : [];
    }),
  );

  constructor() {
    effect(() => {
      const alive = this.alive();
      if (alive) this.stateSignal.update((state) => state && dropMissing(state, new Set(alive)));
    });
  }

  async start(deckId: string, tagKeys: readonly string[]): Promise<void> {
    const list = filterDifficultByTags(await listDifficult(deckId), tagKeys);
    const ids = pickReinforceCards(list, Math.random);
    this.cardsSignal.set(new Map(list.map((item) => [item.card.id, item.card])));
    this.stateSignal.set(startReinforce(ids));
  }

  reveal(): void {
    if (this.current()) this.revealed.set(true);
  }

  answer(rating: BinaryRating): void {
    if (!this.current()) return;
    this.revealed.set(false);
    this.stateSignal.update((state) => state && answerReinforce(state, rating));
  }

  replaceCard(card: Card): void {
    this.cardsSignal.update((cards) => new Map(cards).set(card.id, card));
  }

  private finished(): boolean {
    const state = this.stateSignal();
    return state !== null && state.pending.length === 0;
  }
}
