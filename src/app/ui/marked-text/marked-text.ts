import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { blank, marksOf, splitByMarks, type Range, type Segment } from '../../domain/text-marks';

/** Texto do cartão na revisão: lacunas viram traços enquanto `hideCloze`, destaques ficam sempre em negrito. */
@Component({
  selector: 'app-marked-text',
  templateUrl: './marked-text.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkedText {
  readonly text = input.required<string>();
  readonly cloze = input<Range[]>([]);
  readonly emphasis = input<Range[]>([]);
  readonly hideCloze = input(false);

  readonly segments = computed<Segment[]>(() =>
    splitByMarks(this.text(), marksOf(this.cloze(), this.emphasis())),
  );

  display(segment: Segment): string {
    return segment.kind === 'cloze' && this.hideCloze() ? blank(segment.text) : segment.text;
  }
}
