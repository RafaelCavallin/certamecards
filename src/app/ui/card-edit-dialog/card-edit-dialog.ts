import { ChangeDetectionStrategy, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { CardForm } from '../card-form/card-form';
import { ImagePrefetch } from '../../state/image-prefetch';
import { loadCardDraftState, type CardDraft, type DraftLoadState } from '../../domain/card-draft';
import { saveCardEdit } from '../../domain/card-save';
import type { Card } from '../../domain/db';

type DialogLoad = DraftLoadState | { status: 'loading' };

@Component({
  selector: 'app-card-edit-dialog',
  imports: [CardForm],
  templateUrl: './card-edit-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditDialog {
  readonly saved = output<Card>();

  private readonly prefetch = inject(ImagePrefetch);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly form = viewChild(CardForm);
  private cardId: string | null = null;

  readonly loadState = signal<DialogLoad>({ status: 'loading' });

  open(card: Card): void {
    this.cardId = card.id;
    this.loadState.set({ status: 'loading' });
    this.dialog().nativeElement.showModal();
    void this.read(card.id);
  }

  isOpen(): boolean {
    return this.dialog().nativeElement.open;
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  private async read(cardId: string): Promise<void> {
    await this.prefetch.request([cardId]);
    const state = await loadCardDraftState(cardId);
    if (this.cardId === cardId) this.loadState.set(state);
  }

  async onCancel(event: Event): Promise<void> {
    event.preventDefault();
    const form = this.form();
    if (!form || (await form.confirmDiscard())) this.close();
  }

  readonly save = async (draft: CardDraft): Promise<void> => {
    if (!this.cardId) return;
    const card = await saveCardEdit({ cardId: this.cardId, draft });
    this.saved.emit(card);
    this.close();
  };
}
