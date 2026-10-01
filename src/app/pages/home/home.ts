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
import { DifficultShortcut } from './difficult-shortcut';
import { StudyFilter } from './study-filter';
import { DeckStore } from '../../state/deck-store';
import { DueTick } from '../../state/due-tick';
import { TagFilterStore } from '../../state/tag-filter-store';
import { loadHomeSnapshot } from '../../domain/home-data';
import { homeView, studyButtonLabel, type HomeFilterInfo } from '../../domain/home-summary';
import type { TagSummary } from '../../domain/tags';
import type { Deck } from '../../domain/db';

@Component({
  selector: 'app-home',
  imports: [Heatmap, StudyFilter, DifficultShortcut],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly router = inject(Router);
  private readonly deckStore = inject(DeckStore);
  private readonly dueTick = inject(DueTick);
  private readonly tagFilter = inject(TagFilterStore);

  private readonly totalSignal = signal<number | undefined>(undefined);
  private readonly queueSizeSignal = signal<number | null>(null);
  private readonly minutesSignal = signal(0);
  private readonly byDaySignal = signal<Map<string, number>>(new Map());
  private readonly filterSignal = signal<HomeFilterInfo | null>(null);
  readonly options = signal<TagSummary[]>([]);

  readonly view = computed(() =>
    homeView({
      total: this.totalSignal(),
      queueSize: this.queueSizeSignal(),
      minutes: this.minutesSignal(),
      filter: this.filterSignal(),
    }),
  );
  readonly studyLabel = computed(() => studyButtonLabel(this.queueSizeSignal()));
  readonly studyKeys = computed(() => this.tagFilter.keysFor(this.deckStore.deck()?.id ?? ''));
  readonly byDay = this.byDaySignal.asReadonly();
  readonly hasHistory = computed(() => this.byDaySignal().size > 0);

  constructor() {
    let lastDeckId: string | null = null;
    effect(() => {
      const deck = this.deckStore.deck();
      this.dueTick.tick();
      const keys = this.tagFilter.keysFor(deck?.id ?? '');
      if (!deck) return;
      if (deck.id !== lastDeckId) {
        lastDeckId = deck.id;
        this.queueSizeSignal.set(null);
      }
      void this.refresh(deck, keys);
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

  setStudyKeys(keys: string[]): void {
    const deck = this.deckStore.deck();
    if (deck) this.tagFilter.set(deck.id, keys);
  }

  clearFilter(): void {
    this.setStudyKeys([]);
  }

  private async refresh(deck: Deck, keys: string[]): Promise<void> {
    const snapshot = await loadHomeSnapshot(deck, keys);
    this.totalSignal.set(snapshot.total);
    this.queueSizeSignal.set(snapshot.queueSize);
    this.minutesSignal.set(snapshot.minutes);
    this.byDaySignal.set(snapshot.byDay);
    this.options.set(snapshot.options);
    this.filterSignal.set(snapshot.filter);
    this.tagFilter.reconcile(deck.id, snapshot.existingKeys);
  }
}
