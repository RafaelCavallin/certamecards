import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkedText } from '../../ui/marked-text/marked-text';
import type { Card } from '../../domain/db';
import type { ReinforceSummary as Summary } from '../../domain/reinforce';
import type { MissedItem } from '../../state/reinforce-session';

@Component({
  selector: 'app-reinforce-summary',
  imports: [RouterLink, MarkedText],
  templateUrl: './reinforce-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReinforceSummary {
  readonly summary = input.required<Summary>();
  readonly missed = input.required<MissedItem[]>();
  readonly backParams = input.required<Record<string, string | null>>();
  readonly edit = output<Card>();
  readonly home = output<void>();
}
