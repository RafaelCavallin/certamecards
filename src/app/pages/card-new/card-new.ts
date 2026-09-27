import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CardForm } from '../../ui/card-form/card-form';
import { DeckStore } from '../../state/deck-store';
import { createCard, type CardContent } from '../../domain/cards';

@Component({
  selector: 'app-card-new',
  imports: [CardForm],
  templateUrl: './card-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardNew {
  private readonly deckStore = inject(DeckStore);

  readonly savedCount = signal(0);

  readonly save = async (content: CardContent): Promise<void> => {
    const deck = this.deckStore.deck();
    if (!deck) throw new Error('Nenhum baralho ativo.');
    await createCard({ ...content, deckId: deck.id });
    this.savedCount.update((count) => count + 1);
  };
}
