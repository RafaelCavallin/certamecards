import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Heatmap } from '../../ui/heatmap/heatmap';
import { DeckStore } from '../../state/deck-store';
import { DueTick } from '../../state/due-tick';
import { liveCards } from '../../domain/cards';
import { buildQueue, estimateMinutes } from '../../domain/queue';
import { computeStats } from '../../domain/stats';
import { homeView, studyButtonLabel } from '../../domain/home-summary';
import type { Deck } from '../../domain/db';

@Component({
  selector: 'app-home',
  imports: [Heatmap],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly router = inject(Router);
  private readonly deckStore = inject(DeckStore);
  private readonly dueTick = inject(DueTick);

  private readonly totalSignal = signal<number | undefined>(undefined);
  private readonly queueSizeSignal = signal<number | null>(null);
  private readonly minutesSignal = signal(0);
  private readonly byDaySignal = signal<Map<string, number>>(new Map());

  readonly view = computed(() =>
    homeView({
      total: this.totalSignal(),
      queueSize: this.queueSizeSignal(),
      minutes: this.minutesSignal(),
    }),
  );
  readonly studyLabel = computed(() => studyButtonLabel(this.queueSizeSignal()));
  readonly byDay = this.byDaySignal.asReadonly();
  readonly hasHistory = computed(() => this.byDaySignal().size > 0);

  constructor() {
    let lastDeckId: string | null = null;
    effect(() => {
      const deck = this.deckStore.deck();
      this.dueTick.tick();
      if (!deck) return;
      if (deck.id !== lastDeckId) {
        lastDeckId = deck.id;
        this.queueSizeSignal.set(null);
      }
      void this.refresh(deck);
    });
  }

  goStudy(): void {
    void this.router.navigateByUrl('/revisar');
  }

  goAddCard(): void {
    void this.router.navigateByUrl('/cartoes/novo');
  }

  goProgress(): void {
    void this.router.navigateByUrl('/progresso');
  }

  private async refresh(deck: Deck): Promise<void> {
    const [total, queue, stats] = await Promise.all([
      liveCards(deck.id).count(),
      buildQueue(deck),
      computeStats(deck),
    ]);
    this.totalSignal.set(total);
    this.queueSizeSignal.set(queue.length);
    this.byDaySignal.set(stats.byDay);
    this.minutesSignal.set(await estimateMinutes(queue.length));
  }
}
