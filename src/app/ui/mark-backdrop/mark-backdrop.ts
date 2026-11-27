import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { splitByMarks, type Mark, type Segment } from '../../domain/text-marks';
import { CLOZE_FRAME, EMPHASIS_UNDERLINE, highlightClass } from '../mark-styles/mark-styles';

/** Camada que pinta as marcas atrás do texto do campo — só moldura, fundo e sublinhado, nunca métrica. */
@Component({
  selector: 'app-mark-backdrop',
  templateUrl: './mark-backdrop.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkBackdrop {
  readonly text = input.required<string>();
  readonly marks = input.required<Mark[]>();
  readonly textClass = input.required<string>();

  readonly segments = computed<Segment[]>(() => splitByMarks(this.text(), this.marks()));

  segmentClass(segment: Segment): string | undefined {
    if (segment.kind === 'cloze') return CLOZE_FRAME;
    if (segment.kind === 'emphasis') return EMPHASIS_UNDERLINE;
    return segment.color ? highlightClass(segment.color) : undefined;
  }
}
