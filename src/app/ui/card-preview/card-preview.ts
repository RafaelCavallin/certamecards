import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CardFace } from '../card-face/card-face';
import { previewCard } from '../../domain/card-preview';
import type { CardContent } from '../../domain/cards';

/** Prévia ao vivo do cartão, do jeito que ele aparece na revisão. */
@Component({
  selector: 'app-card-preview',
  imports: [CardFace],
  templateUrl: './card-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPreview {
  readonly content = input.required<CardContent>();

  readonly revealed = signal(false);
  readonly card = computed(() => previewCard(this.content()));
  readonly empty = computed(() => this.card().front.length === 0);

  toggle(): void {
    this.revealed.update((value) => !value);
  }
}
