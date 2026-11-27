import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HIGHLIGHT_COLOR_NAMES, HIGHLIGHT_COLORS, type HighlightColor } from '../../domain/highlight-colors';
import { highlightFill } from '../mark-styles/mark-styles';

export type SwatchMode = 'mark' | 'recolor';

const ACTION_LABEL: Record<SwatchMode, string> = { mark: 'Marcar em', recolor: 'Trocar para' };

/** Os botões de cor do marca-texto: círculo de 44 px de área de toque que nunca rouba a seleção do campo. */
@Component({
  selector: 'app-highlight-swatches',
  templateUrl: './highlight-swatches.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightSwatches {
  readonly exclude = input<HighlightColor | null>(null);
  readonly mode = input<SwatchMode>('mark');
  readonly pick = output<HighlightColor>();

  readonly colors = computed(() => HIGHLIGHT_COLORS.filter((color) => color !== this.exclude()));

  label(color: HighlightColor): string {
    return `${ACTION_LABEL[this.mode()]} ${HIGHLIGHT_COLOR_NAMES[color]}`;
  }

  fillClass(color: HighlightColor): string {
    return highlightFill(color);
  }

  keepSelection(event: Event): void {
    event.preventDefault();
  }
}
