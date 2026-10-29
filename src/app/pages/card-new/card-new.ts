import { ChangeDetectionStrategy, Component, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { CardForm } from '../../ui/card-form/card-form';
import { DeckSelect } from '../../ui/deck-select/deck-select';
import { DeckStore } from '../../state/deck-store';
import { saveNewCard } from '../../domain/card-save';
import type { CardDraft } from '../../domain/card-draft';

@Component({
  selector: 'app-card-new',
  imports: [CardForm, DeckSelect],
  templateUrl: './card-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardNew {
  private readonly deckStore = inject(DeckStore);
  private readonly form = viewChild(CardForm);

  readonly savedCount = signal(0);
  readonly targetDeckId = linkedSignal(() => this.deckStore.deck()?.id ?? '');

  canLeave(): boolean | Promise<boolean> {
    return this.form()?.confirmDiscard() ?? true;
  }

  readonly save = async (draft: CardDraft): Promise<void> => {
    const deckId = this.targetDeckId();
    if (!deckId) throw new Error('Nenhum baralho ativo.');
    await saveNewCard({ deckId, draft });
    this.savedCount.update((count) => count + 1);
  };
}
