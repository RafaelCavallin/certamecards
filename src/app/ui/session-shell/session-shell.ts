import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-session-shell',
  templateUrl: './session-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionShell {
  readonly position = input.required<string>();
  readonly progress = input.required<number>();
  readonly exit = output<void>();
}
