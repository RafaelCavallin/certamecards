import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { blank, marksOf, splitByMarks, type HighlightRange, type Range, type Segment } from '../../domain/text-marks';
import { CLOZE_FRAME, highlightClass } from '../mark-styles/mark-styles';

/** Texto do cartão na revisão: lacunas viram traços enquanto `hideCloze`, destaques ficam em negrito e o marca-texto ganha fundo. */
@Component({
  selector: 'app-marked-text',
  templateUrl: './marked-text.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkedText {
  readonly text = input.required<string>();
  readonly cloze = input<Range[]>([]);
  readonly emphasis = input<Range[]>([]);
  readonly highlight = input<HighlightRange[] | undefined>([]);
  readonly hideCloze = input(false);

  readonly clozeFrame = CLOZE_FRAME;

  readonly segments = computed<Segment[]>(() =>
    splitByMarks(
      this.text(),
      marksOf({ cloze: this.cloze(), emphasis: this.emphasis(), highlight: this.highlight() }),
    ),
  );

  display(segment: Segment): string {
    return segment.kind === 'cloze' && this.hideCloze() ? blank(segment.text) : segment.text;
  }

  highlightClass(segment: Segment): string {
    return segment.color ? `${highlightClass(segment.color)} text-text` : '';
  }
}
