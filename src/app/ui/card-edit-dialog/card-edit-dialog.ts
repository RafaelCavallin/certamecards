import { ChangeDetectionStrategy, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { CardForm } from '../card-form/card-form';
import { ImagePrefetch } from '../../state/image-prefetch';
import { loadCardDraft, type CardDraft } from '../../domain/card-draft';
import { saveCardEdit } from '../../domain/card-save';
import type { Card } from '../../domain/db';

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

  readonly draft = signal<CardDraft | null>(null);

  open(card: Card): void {
    this.cardId = card.id;
    this.draft.set(null);
    this.dialog().nativeElement.showModal();
    void this.load(card.id);
  }

  isOpen(): boolean {
    return this.dialog().nativeElement.open;
  }

  private async load(cardId: string): Promise<void> {
    await this.prefetch.request([cardId]);
    const draft = await loadCardDraft(cardId);
    if (this.cardId === cardId) this.draft.set(draft);
  }

  async onCancel(event: Event): Promise<void> {
    event.preventDefault();
    const form = this.form();
    if (!form || (await form.confirmDiscard())) this.dialog().nativeElement.close();
  }

  readonly save = async (draft: CardDraft): Promise<void> => {
    if (!this.cardId) return;
    const card = await saveCardEdit({ cardId: this.cardId, draft });
    this.saved.emit(card);
    this.dialog().nativeElement.close();
  };
}
