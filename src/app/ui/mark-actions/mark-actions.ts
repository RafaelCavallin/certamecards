import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { displayHighlightColor, type HighlightColor } from '../../domain/highlight-colors';
import type { MarkRequest } from '../../domain/mark-editing';
import { markHint, summarizeMarks } from '../../domain/mark-summary';
import type { Mark, MarkKind, Marks } from '../../domain/text-marks';
import { HighlightSwatches } from '../highlight-swatches/highlight-swatches';

const PILL =
  'rounded-full border border-edge px-3 py-1.5 font-mono text-label uppercase tracking-wider text-muted transition hover:border-signal hover:text-signal';

const REMOVE_LABEL: Record<MarkKind, string> = {
  cloze: 'Mostrar de novo',
  emphasis: 'Tirar destaque',
  highlight: 'Tirar marca-texto',
};

/** A barra só mostra o que há para fazer — seleção nova ou cursor numa marca — para não virar um paredão de botões. */
@Component({
  selector: 'app-mark-actions',
  imports: [HighlightSwatches],
  templateUrl: './mark-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkActions {
  readonly marks = input.required<Marks>();
  readonly allowCloze = input(true);
  readonly hasSelection = input(false);
  readonly markedMark = input<Mark | null>(null);
  readonly add = output<MarkRequest>();
  readonly recolor = output<HighlightColor>();
  readonly remove = output<void>();

  readonly pillClass = PILL;

  readonly markedColor = computed<HighlightColor | null>(() => {
    const mark = this.markedMark();
    return mark?.kind === 'highlight' ? displayHighlightColor(mark.color) : null;
  });

  readonly removeLabel = computed(() => REMOVE_LABEL[this.markedMark()?.kind ?? 'emphasis']);

  keepSelection(event: Event): void {
    event.preventDefault();
  }

  hintLabel(): string {
    const summary = summarizeMarks(this.marks());
    return summary ? `${summary} · toque na marca para desfazer` : markHint(this.allowCloze());
  }
}
