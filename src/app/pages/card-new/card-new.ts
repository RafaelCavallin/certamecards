import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { CardForm } from '../../ui/card-form/card-form';
import { DeckStore } from '../../state/deck-store';
import { saveNewCard } from '../../domain/card-save';
import type { CardDraft } from '../../domain/card-draft';

@Component({
  selector: 'app-card-new',
  imports: [CardForm],
  templateUrl: './card-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardNew {
  private readonly deckStore = inject(DeckStore);
  private readonly form = viewChild(CardForm);

  readonly savedCount = signal(0);

  canLeave(): boolean | Promise<boolean> {
    return this.form()?.confirmDiscard() ?? true;
  }

  readonly save = async (draft: CardDraft): Promise<void> => {
    const deck = this.deckStore.deck();
    if (!deck) throw new Error('Nenhum baralho ativo.');
    await saveNewCard({ deckId: deck.id, draft });
    this.savedCount.update((count) => count + 1);
  };
}
