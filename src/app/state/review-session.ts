import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DeckStore } from './deck-store';
import { buildQueue } from '../domain/queue';
import { answer as answerCard, type BinaryRating } from '../domain/scheduler';
import type { Card } from '../domain/db';

@Injectable()
export class ReviewSession {
  private readonly deckStore = inject(DeckStore);
  private readonly queueSignal = signal<Card[] | null>(null);
  private readonly indexSignal = signal(0);
  private readonly answeringSignal = signal(false);
  private readonly doneSignal = signal(0);
  private shownAt = Date.now();

  readonly queue = this.queueSignal.asReadonly();
  readonly index = this.indexSignal.asReadonly();
  readonly current = computed(() => this.queueSignal()?.[this.indexSignal()]);
  private readonly currentId = computed(() => this.current()?.id);
  readonly revealed = signal(false);
  readonly answering = this.answeringSignal.asReadonly();
  readonly done = this.doneSignal.asReadonly();

  constructor() {
    let loaded = false;
    effect(() => {
      const deck = this.deckStore.deck();
      if (!deck || loaded) return;
      loaded = true;
      void buildQueue(deck).then((queue) => this.queueSignal.set(queue));
    });
    effect(() => {
      this.currentId();
      this.revealed.set(false);
      this.shownAt = Date.now();
    });
  }

  reveal(): void {
    this.revealed.set(true);
  }

  async answer(rating: BinaryRating): Promise<void> {
    const card = this.current();
    const deck = this.deckStore.deck();
    if (!card || !deck || this.answeringSignal()) return;
    this.answeringSignal.set(true);
    try {
      await answerCard({ card, deck, rating, durationMs: Date.now() - this.shownAt });
      this.doneSignal.update((n) => n + 1);
      this.indexSignal.update((i) => i + 1);
    } finally {
      this.answeringSignal.set(false);
    }
  }

  replaceCurrent(card: Card): void {
    const queue = this.queueSignal();
    if (!queue) return;
    const next = [...queue];
    next[this.indexSignal()] = card;
    this.queueSignal.set(next);
  }
}
