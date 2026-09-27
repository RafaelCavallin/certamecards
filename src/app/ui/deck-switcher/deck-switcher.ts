import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DeckStore } from '../../state/deck-store';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { DeckRow } from './deck-row';

@Component({
  selector: 'app-deck-switcher',
  imports: [DeckRow, ConfirmDialog],
  templateUrl: './deck-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckSwitcher {
  private readonly deckStore = inject(DeckStore);

  readonly decks = this.deckStore.decks;
  readonly activeDeck = this.deckStore.deck;

  readonly creating = signal(false);
  readonly newName = signal('');
  readonly editingId = signal<string | null>(null);
  readonly editName = signal('');
  readonly error = signal<string | null>(null);

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly confirmDialog = viewChild.required(ConfirmDialog);
  private pendingDeleteId: string | null = null;

  open(): void {
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
    this.creating.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  select(id: string): void {
    this.deckStore.switchDeck(id);
    this.close();
  }

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
    this.close();
  }

  startRename(id: string, name: string): void {
    this.editingId.set(id);
    this.editName.set(name);
  }

  async confirmRename(id: string): Promise<void> {
    await this.deckStore.renameDeck(id, this.editName());
    this.editingId.set(null);
  }

  askRemove(id: string): void {
    if ((this.decks() ?? []).length <= 1) {
      this.error.set('Não é possível excluir o único baralho. Crie outro antes.');
      return;
    }
    this.pendingDeleteId = id;
    this.confirmDialog().open();
  }

  async confirmRemove(): Promise<void> {
    if (!this.pendingDeleteId) return;
    await this.deckStore.removeDeck(this.pendingDeleteId);
    this.pendingDeleteId = null;
  }
}
