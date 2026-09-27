import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { splitByMarks, type Mark, type MarkKind, type Segment } from '../../domain/text-marks';

const SEGMENT_CLASS: Record<MarkKind, string> = {
  cloze: 'rounded bg-signal/10 ring-1 ring-inset ring-signal/60',
  emphasis: 'underline decoration-signal decoration-2 underline-offset-4',
};

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
    return segment.kind ? SEGMENT_CLASS[segment.kind] : undefined;
  }
}
