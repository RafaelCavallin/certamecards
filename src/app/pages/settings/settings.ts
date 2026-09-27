import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DeckStore } from '../../state/deck-store';

const APP_VERSION = '0.1.0';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly deckStore = inject(DeckStore);

  readonly version = APP_VERSION;
  readonly name = signal('');
  readonly saved = signal(false);

  constructor() {
    effect(() => {
      const deck = this.deckStore.deck();
      if (deck) this.name.set(deck.name);
    });
  }

  onNameInput(value: string): void {
    this.name.set(value);
    this.saved.set(false);
  }

  async save(): Promise<void> {
    const deck = this.deckStore.deck();
    if (!deck) return;
    await this.deckStore.renameDeck(deck.id, this.name());
    this.saved.set(true);
  }
}
