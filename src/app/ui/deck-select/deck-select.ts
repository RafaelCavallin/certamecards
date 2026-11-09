import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { DeckStore } from '../../state/deck-store';

const MIN_DECKS_TO_CHOOSE = 2;

@Component({
  selector: 'app-deck-select',
  templateUrl: './deck-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckSelect {
  readonly deckId = model.required<string>();
  readonly decks = inject(DeckStore).decks;
  readonly canChoose = computed(() => (this.decks()?.length ?? 0) >= MIN_DECKS_TO_CHOOSE);
}
