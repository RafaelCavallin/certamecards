import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckStore } from '../../state/deck-store';
import { liveQueryFor } from '../../state/live-query';
import { countDifficult } from '../../domain/difficulty-data';

@Component({
  selector: 'app-difficult-shortcut',
  imports: [RouterLink],
  templateUrl: './difficult-shortcut.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultShortcut {
  private readonly deckStore = inject(DeckStore);
  private readonly deckId = computed(() => this.deckStore.deck()?.id);

  readonly count = liveQueryFor(this.deckId, (deckId) => countDifficult(deckId));
  readonly label = computed(() => {
    const count = this.count() ?? 0;
    return `${count} ${count === 1 ? 'cartão difícil' : 'cartões difíceis'} · Reforçar`;
  });
}
