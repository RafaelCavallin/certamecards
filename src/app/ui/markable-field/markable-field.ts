import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { MarkActions } from '../mark-actions/mark-actions';
import { MarkBackdrop } from '../mark-backdrop/mark-backdrop';
import { FieldSelection } from './field-selection';
import { addMarkRange, removeMarkRange } from '../../domain/mark-editing';
import { remapMarks } from '../../domain/text-marks-remap';
import { marksOf, type MarkKind, type Marks } from '../../domain/text-marks';
import { watchAutoGrow } from './textarea-autogrow';

export const MARKABLE_FIELD_BOX =
  'whitespace-pre-wrap break-words rounded-xl border border-line bg-surface px-4 py-3 leading-relaxed';

/**
 * Campo onde o texto é escrito e marcado ao mesmo tempo: o `<textarea>` continua sendo o campo de
 * verdade (cursor, teclado, corretor) e a camada de trás só desenha lacunas/destaques por cima.
 */
@Component({
  selector: 'app-markable-field',
  imports: [MarkActions, MarkBackdrop],
  templateUrl: './markable-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkableField {
  readonly value = model.required<string>();
  readonly marks = model.required<Marks>();
  readonly allowCloze = input(true);
  readonly placeholder = input('');
  readonly minRows = input(2);
  readonly maxLength = input<number | undefined>(undefined);
  readonly textClass = input.required<string>();
  readonly boxClass = MARKABLE_FIELD_BOX;

  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

  readonly allMarks = computed(() => marksOf(this.marks().cloze, this.marks().emphasis));
  private readonly selection = new FieldSelection(() => this.allMarks());
  readonly markedMark = this.selection.markedMark;
  readonly pendingSelection = this.selection.pendingSelection;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const onSelectionChange = (): void => this.handleDocumentSelectionChange();
    document.addEventListener('selectionchange', onSelectionChange);
    destroyRef.onDestroy(() => document.removeEventListener('selectionchange', onSelectionChange));
    watchAutoGrow(
      () => this.field().nativeElement,
      () => this.value(),
    );
  }

  focus(): void {
    this.field().nativeElement.focus();
  }

  readSelection(): void {
    const el = this.field().nativeElement;
    this.selection.read(this.value(), el.selectionStart, el.selectionEnd);
  }

  onInput(text: string): void {
    const before = this.value();
    this.value.set(text);
    this.marks.set(remapMarks(before, text, this.marks()));
  }

  onBlur(): void {
    this.selection.clear();
  }

  addMark(kind: MarkKind): void {
    const pending = this.pendingSelection();
    if (!pending) return;
    this.marks.set(addMarkRange(this.marks(), kind, pending));
    this.field().nativeElement.setSelectionRange(pending.end, pending.end);
    this.selection.clear();
  }

  removeMark(): void {
    const marked = this.markedMark();
    if (!marked) return;
    this.marks.set(removeMarkRange(this.marks(), marked));
    this.selection.clear();
  }

  private handleDocumentSelectionChange(): void {
    if (document.activeElement !== this.field().nativeElement) return;
    this.readSelection();
  }
}
