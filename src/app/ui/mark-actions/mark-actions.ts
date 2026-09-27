import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MarkKind, Marks } from '../../domain/text-marks';

const PILL =
  'rounded-full border border-line px-3 py-1.5 font-mono text-label uppercase tracking-wider text-muted transition hover:border-signal hover:text-signal';

function summarizeMarks(marks: Marks): string {
  const parts: string[] = [];
  if (marks.cloze.length)
    parts.push(`${marks.cloze.length} ${marks.cloze.length === 1 ? 'lacuna' : 'lacunas'}`);
  if (marks.emphasis.length) {
    parts.push(
      `${marks.emphasis.length} ${marks.emphasis.length === 1 ? 'destaque' : 'destaques'}`,
    );
  }
  return parts.join(' e ');
}

/** A barra só mostra o que há para fazer — seleção nova ou cursor numa marca — para não virar um paredão de botões. */
@Component({
  selector: 'app-mark-actions',
  templateUrl: './mark-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkActions {
  readonly marks = input.required<Marks>();
  readonly allowCloze = input(true);
  readonly hasSelection = input(false);
  readonly markedKind = input<MarkKind | null>(null);
  readonly add = output<MarkKind>();
  readonly remove = output<void>();

  readonly pillClass = PILL;

  keepSelection(event: Event): void {
    event.preventDefault();
  }

  hintLabel(): string {
    const summary = summarizeMarks(this.marks());
    if (summary) return `${summary} · toque na marca para desfazer`;
    return this.allowCloze()
      ? 'Selecione um trecho para ocultar ou destacar'
      : 'Selecione um trecho para destacar';
  }
}
