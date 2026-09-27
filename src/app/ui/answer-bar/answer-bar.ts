import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Rodapé da revisão: revelar, ou Errei/Acertei depois de revelado — reusado no reforço da Fase 2. */
@Component({
  selector: 'app-answer-bar',
  templateUrl: './answer-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerBar {
  readonly revealed = input(false);
  readonly answering = input(false);
  readonly reveal = output<void>();
  readonly again = output<void>();
  readonly good = output<void>();
}
