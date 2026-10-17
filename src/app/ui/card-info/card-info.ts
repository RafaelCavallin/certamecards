import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cardInfoRows } from '../../domain/card-history';
import type { Card } from '../../domain/db';

@Component({
  selector: 'app-card-info',
  templateUrl: './card-info.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardInfo {
  readonly card = input.required<Card>();

  readonly rows = computed(() => cardInfoRows(this.card(), Date.now()));
}
