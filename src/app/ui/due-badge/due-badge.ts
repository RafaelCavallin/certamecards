import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dueBadgeView } from '../../domain/due-badge';

@Component({
  selector: 'app-due-badge',
  templateUrl: './due-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DueBadge {
  readonly count = input<number | undefined>(undefined);
  readonly label = input<string>('');

  readonly view = computed(() => dueBadgeView(this.count()));
}
