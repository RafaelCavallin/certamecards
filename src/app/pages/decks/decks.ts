import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmDialog } from '../../ui/confirm-dialog/confirm-dialog';
import { DeckStore } from '../../state/deck-store';
import { DeckPanel } from './deck-panel';

const ONLY_DECK_MESSAGE = 'Não é possível excluir o único baralho. Crie outro antes.';

@Component({
  selector: 'app-decks',
  imports: [ConfirmDialog, DeckPanel],
  templateUrl: './decks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Decks {
  private readonly deckStore = inject(DeckStore);
  private readonly router = inject(Router);
  private readonly confirmDialog = viewChild.required(ConfirmDialog);
  private pendingDeleteId: string | null = null;

  readonly decks = this.deckStore.decks;
  readonly activeId = computed(() => this.deckStore.deck()?.id);
  readonly creating = signal(false);
  readonly newName = signal('');
  readonly error = signal<string | null>(null);

  startCreate(): void {
    this.error.set(null);
    this.newName.set('');
    this.creating.set(true);
  }

  async confirmCreate(): Promise<void> {
    const name = this.newName().trim();
    if (!name) return;
    await this.deckStore.createDeck(name);
    this.creating.set(false);
  }

  openCards(id: string): void {
    this.deckStore.switchDeck(id);
  }

  study(id: string): void {
    this.deckStore.switchDeck(id);
    void this.router.navigate(['/revisar']);
  }

  async rename(id: string, name: string): Promise<void> {
    await this.deckStore.renameDeck(id, name);
  }

  askRemove(id: string): void {
    if ((this.decks() ?? []).length <= 1) {
      this.error.set(ONLY_DECK_MESSAGE);
      return;
    }
    this.error.set(null);
    this.pendingDeleteId = id;
    this.confirmDialog().open();
  }

  async confirmRemove(): Promise<void> {
    if (!this.pendingDeleteId) return;
    await this.deckStore.removeDeck(this.pendingDeleteId);
    this.pendingDeleteId = null;
  }
}
