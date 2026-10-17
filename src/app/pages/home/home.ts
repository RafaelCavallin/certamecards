import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Heatmap } from '../../ui/heatmap/heatmap';
import { DifficultShortcut } from './difficult-shortcut';
import { RhythmPanel } from './rhythm-panel';
import { StudyFilter } from './study-filter';
import { DeckStore } from '../../state/deck-store';
import { DueTick } from '../../state/due-tick';
import { TagFilterStore } from '../../state/tag-filter-store';
import { loadHomeSnapshot, type HomeSnapshot } from '../../domain/home-data';
import { homeView, studyButtonLabel } from '../../domain/home-summary';
import type { Deck } from '../../domain/db';

@Component({
  selector: 'app-home',
  imports: [Heatmap, RhythmPanel, StudyFilter, DifficultShortcut],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly router = inject(Router);
  private readonly deckStore = inject(DeckStore);
  private readonly dueTick = inject(DueTick);
  private readonly tagFilter = inject(TagFilterStore);

  private readonly snapshot = signal<HomeSnapshot | null>(null);
  private readonly queueSize = signal<number | null>(null);
  private latestRefresh = 0;

  readonly view = computed(() => {
    const snapshot = this.snapshot();
    return homeView({
      total: snapshot?.total,
      queueSize: this.queueSize(),
      minutes: snapshot?.minutes ?? 0,
      filter: snapshot?.filter ?? null,
    });
  });
  readonly studyLabel = computed(() => studyButtonLabel(this.queueSize()));
  readonly studyKeys = computed(() => this.tagFilter.keysFor(this.deckStore.deck()?.id ?? ''));
  readonly options = computed(() => this.snapshot()?.options ?? []);
  readonly byDay = computed(() => this.snapshot()?.byDay ?? new Map<string, number>());
  readonly hasHistory = computed(() => this.byDay().size > 0);
  readonly rhythm = computed(() => (this.hasHistory() ? (this.snapshot()?.rhythm ?? null) : null));

  constructor() {
    let lastDeckId: string | null = null;
    effect(() => {
      const deck = this.deckStore.deck();
      this.dueTick.tick();
      const keys = this.tagFilter.keysFor(deck?.id ?? '');
      if (!deck) return;
      if (deck.id !== lastDeckId) {
        lastDeckId = deck.id;
        this.queueSize.set(null);
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
    const request = ++this.latestRefresh;
    const snapshot = await loadHomeSnapshot(deck, keys);
    if (request !== this.latestRefresh) return;
    this.snapshot.set(snapshot);
    this.queueSize.set(snapshot.queueSize);
    this.tagFilter.reconcile(deck.id, snapshot.existingKeys);
  }
}
