import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { updateDeckRhythm } from '../../domain/decks';
import type { Deck } from '../../domain/db';

const NEW_PER_DAY_MIN = 5;
const NEW_PER_DAY_MAX = 60;
const NEW_PER_DAY_STEP = 5;
const YOUNG_LIMIT_MIN = 20;
const YOUNG_LIMIT_MAX = 200;
const YOUNG_LIMIT_STEP = 10;

/** Seção “Ritmo” do Progresso: novos por dia e teto de não firmados (RF35). */
@Component({
  selector: 'app-deck-rhythm',
  templateUrl: './deck-rhythm.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckRhythm {
  readonly deck = input.required<Deck>();

  readonly newPerDayMin = NEW_PER_DAY_MIN;
  readonly newPerDayMax = NEW_PER_DAY_MAX;
  readonly newPerDayStep = NEW_PER_DAY_STEP;
  readonly youngLimitMin = YOUNG_LIMIT_MIN;
  readonly youngLimitMax = YOUNG_LIMIT_MAX;
  readonly youngLimitStep = YOUNG_LIMIT_STEP;

  readonly newCardsPerDay = signal(0);
  readonly youngLimit = signal(0);

  constructor() {
    effect(() => {
      const deck = this.deck();
      this.newCardsPerDay.set(deck.newCardsPerDay);
      this.youngLimit.set(deck.youngLimit);
    });
  }

  async setNewCardsPerDay(value: number): Promise<void> {
    this.newCardsPerDay.set(value);
    await updateDeckRhythm(this.deck().id, { newCardsPerDay: value });
  }

  async setYoungLimit(value: number): Promise<void> {
    this.youngLimit.set(value);
    await updateDeckRhythm(this.deck().id, { youngLimit: value });
  }
}
