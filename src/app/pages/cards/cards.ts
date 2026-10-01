import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ConfirmDialog } from '../../ui/confirm-dialog/confirm-dialog';
import { TagFilter } from '../../ui/tag-filter/tag-filter';
import { CardRow } from './card-row';
import { DeckStore } from '../../state/deck-store';
import { deleteCards, liveCards } from '../../domain/cards';
import { searchCards } from '../../domain/card-search';
import { summarizeTags } from '../../domain/tag-catalog';
import { filterCardsByTags } from '../../domain/tag-filter';
import type { Card } from '../../domain/db';

const ROW_SIZE = 124;

@Component({
  selector: 'app-cards',
  imports: [ScrollingModule, ConfirmDialog, TagFilter, CardRow],
  templateUrl: './cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cards {
  private readonly deckStore = inject(DeckStore);
  private readonly pendingDelete = signal<string[]>([]);
  private readonly confirmDialog = viewChild.required(ConfirmDialog);
  readonly rowSize = ROW_SIZE;
  readonly deckName = computed(() => this.deckStore.deck()?.name ?? '');
  readonly cards = signal<Card[] | undefined>(undefined);
  readonly query = signal('');
  readonly selected = signal<Set<string>>(new Set());

  readonly selectedTags = signal<string[]>([]);
  readonly tagOptions = computed(() => summarizeTags(this.cards() ?? []));
  readonly activeTags = computed(() => {
    const known = new Set(this.tagOptions().map((option) => option.key));
    return this.selectedTags().filter((key) => known.has(key));
  });
  readonly filtered = computed(() =>
    searchCards(filterCardsByTags(this.cards() ?? [], this.activeTags()), this.query()),
  );
  readonly selectedCount = computed(() => this.selected().size);

  readonly confirmMessage = computed(() => {
    const count = this.pendingDelete().length;
    if (count <= 1) return 'Excluir este cartão? Não tem como desfazer.';
    return `Excluir ${count} cartões? Não tem como desfazer.`;
  });

  constructor() {
    effect(() => {
      const deck = this.deckStore.deck();
      if (!deck) return;
      this.selectedTags.set([]);
      void this.refresh(deck.id);
    });
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selected.set(next);
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  askRemoveOne(id: string): void {
    this.pendingDelete.set([id]);
    this.confirmDialog().open();
  }

  askRemoveSelected(): void {
    if (this.selectedCount() === 0) return;
    this.pendingDelete.set([...this.selected()]);
    this.confirmDialog().open();
  }

  async confirmRemove(): Promise<void> {
    const ids = this.pendingDelete();
    await deleteCards(ids);
    const remaining = new Set(this.selected());
    ids.forEach((id) => remaining.delete(id));
    this.selected.set(remaining);
    const deck = this.deckStore.deck();
    if (deck) await this.refresh(deck.id);
  }

  private async refresh(deckId: string): Promise<void> {
    this.cards.set(await liveCards(deckId).reverse().sortBy('createdAt'));
  }
}
