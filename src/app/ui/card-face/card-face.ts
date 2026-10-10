import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ImageGallery } from '../image-gallery/image-gallery';
import { MarkedText } from '../marked-text/marked-text';
import { TagChips } from '../tag-chips/tag-chips';
import { frontSizeClass } from '../../domain/type-scale';
import type { Card } from '../../domain/db';

/** Frente, sempre visível; Verso e Notas só depois de revelar — reusado no reforço da Fase 2. */
@Component({
  selector: 'app-card-face',
  imports: [ImageGallery, MarkedText, TagChips],
  templateUrl: './card-face.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFace {
  readonly card = input.required<Card>();
  readonly revealed = input(false);

  readonly frontClass = computed(() => frontSizeClass(this.card().front));
}
