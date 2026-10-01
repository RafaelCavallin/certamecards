import { ChangeDetectionStrategy, Component, ElementRef, computed, output, signal, viewChild } from '@angular/core';
import { CardForm } from '../card-form/card-form';
import { updateCardContent, type CardContent } from '../../domain/cards';
import type { Card } from '../../domain/db';

@Component({
  selector: 'app-card-edit-dialog',
  imports: [CardForm],
  templateUrl: './card-edit-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditDialog {
  readonly saved = output<Card>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly card = signal<Card | null>(null);

  readonly initial = computed<CardContent | null>(() => {
    const card = this.card();
    return card
      ? { front: card.front, back: card.back, notes: card.notes, marks: card.marks, tags: card.tags }
      : null;
  });

  open(card: Card): void {
    this.card.set(card);
    this.dialog().nativeElement.showModal();
  }

  isOpen(): boolean {
    return this.dialog().nativeElement.open;
  }

  readonly save = async (content: CardContent): Promise<void> => {
    const card = this.card();
    if (!card) return;
    const updated = await updateCardContent(card.id, content);
    this.saved.emit({ ...card, ...updated });
    this.dialog().nativeElement.close();
  };
}
