import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardForm } from '../../ui/card-form/card-form';
import type { Card } from '../../domain/db';
import { getCard, updateCardContent, type CardContent } from '../../domain/cards';

@Component({
  selector: 'app-card-edit',
  imports: [CardForm],
  templateUrl: './card-edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEdit {
  private readonly location = inject(Location);
  private readonly cardId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  readonly card = signal<Card | null | undefined>(undefined);

  readonly initial = computed<CardContent | null>(() => {
    const card = this.card();
    return card
      ? { front: card.front, back: card.back, notes: card.notes, marks: card.marks }
      : null;
  });

  constructor() {
    void getCard(this.cardId).then((card) => this.card.set(card ?? null));
  }

  back(): void {
    this.location.back();
  }

  readonly save = async (content: CardContent): Promise<void> => {
    await updateCardContent(this.cardId, content);
    this.location.back();
  };
}
