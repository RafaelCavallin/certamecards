import type { ModelSignal } from '@angular/core';
import type { HighlightColor } from '../../domain/highlight-colors';
import { addMark, recolorHighlight, removeMark, type MarkRequest } from '../../domain/mark-editing';
import type { Marks } from '../../domain/text-marks';
import type { FieldSelection } from './field-selection';

export interface MarkEditorDeps {
  marks: ModelSignal<Marks>;
  selection: FieldSelection;
  field: () => HTMLTextAreaElement;
}

export class MarkEditor {
  constructor(private readonly deps: MarkEditorDeps) {}

  add(request: MarkRequest): void {
    const pending = this.deps.selection.pendingSelection();
    if (!pending) return;
    this.deps.marks.set(addMark(this.deps.marks(), request, pending));
    this.deps.selection.clear();
    this.refocus(pending.end);
  }

  recolor(color: HighlightColor): void {
    const marked = this.deps.selection.markedMark();
    if (marked?.kind !== 'highlight') return;
    this.deps.marks.set(recolorHighlight(this.deps.marks(), marked, color));
    this.refocus(null);
  }

  remove(): void {
    const marked = this.deps.selection.markedMark();
    if (!marked) return;
    this.deps.marks.set(removeMark(this.deps.marks(), marked));
    this.deps.selection.clear();
    this.refocus(null);
  }

  private refocus(caret: number | null): void {
    const element = this.deps.field();
    element.focus();
    if (caret !== null) element.setSelectionRange(caret, caret);
  }
}
