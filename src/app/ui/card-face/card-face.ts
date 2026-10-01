import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MarkedText } from '../marked-text/marked-text';
import { TagChips } from '../tag-chips/tag-chips';
import { frontSizeClass } from '../../domain/type-scale';
import type { Card } from '../../domain/db';

/** Frente, sempre visível; Verso e Notas só depois de revelar — reusado no reforço da Fase 2. */
@Component({
  selector: 'app-card-face',
  imports: [MarkedText, TagChips],
  templateUrl: './card-face.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFace {
  readonly card = input.required<Card>();
  readonly revealed = input(false);

  readonly frontClass = computed(() => frontSizeClass(this.card().front));
}
