import {
  ChangeDetectionStrategy,
  Component,
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
import { MarkEditor } from './mark-editor';
import type { HighlightColor } from '../../domain/highlight-colors';
import type { MarkRequest } from '../../domain/mark-editing';
import { remapMarks } from '../../domain/text-marks-remap';
import { marksOf, type Marks } from '../../domain/text-marks';
import { watchAutoGrow } from './textarea-autogrow';
import { watchSelectionChange } from './watch-selection';

export const MARKABLE_FIELD_BOX =
  'whitespace-pre-wrap break-words rounded-xl font-body border border-line bg-surface px-4 py-3 leading-relaxed';

/**
 * Campo onde o texto é escrito e marcado ao mesmo tempo: o `<textarea>` continua sendo o campo de
 * verdade (cursor, teclado, corretor) e a camada de trás só desenha lacunas/destaques por cima.
 */
@Component({
  selector: 'app-markable-field',
  imports: [MarkActions, MarkBackdrop],
  templateUrl: './markable-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(focusout)': 'onFocusOut($event)' },
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly element = (): HTMLTextAreaElement => this.field().nativeElement;

  readonly allMarks = computed(() => marksOf(this.marks()));
  private readonly selection = new FieldSelection(() => this.allMarks());
  readonly markedMark = this.selection.markedMark;
  readonly pendingSelection = this.selection.pendingSelection;
  private readonly editor = new MarkEditor({ marks: this.marks, selection: this.selection, field: this.element });

  constructor() {
    watchSelectionChange(this.element, () => this.readSelection());
    watchAutoGrow(this.element, () => this.value());
  }

  focus(): void {
    this.element().focus();
  }

  readSelection(): void {
    const el = this.element();
    this.selection.read(this.value(), el.selectionStart, el.selectionEnd);
  }

  onInput(text: string): void {
    const before = this.value();
    this.value.set(text);
    this.marks.set(remapMarks(before, text, this.marks()));
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    this.selection.clear();
  }

  addMark(request: MarkRequest): void {
    this.editor.add(request);
  }

  recolorMark(color: HighlightColor): void {
    this.editor.recolor(color);
  }

  removeMark(): void {
    this.editor.remove();
  }
}
