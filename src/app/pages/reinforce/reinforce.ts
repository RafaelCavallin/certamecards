import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, input, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AnswerBar } from '../../ui/answer-bar/answer-bar';
import { CardEditDialog } from '../../ui/card-edit-dialog/card-edit-dialog';
import { CardFace } from '../../ui/card-face/card-face';
import { SessionShell } from '../../ui/session-shell/session-shell';
import { ReinforceSummary } from './reinforce-summary';
import { DeckStore } from '../../state/deck-store';
import { ReinforceSession } from '../../state/reinforce-session';
import { reviewKeyAction } from '../../domain/review-keys';
import { TAG_PARAM, parseTagParam, serializeTagParam } from '../../domain/tag-param';
import type { Card } from '../../domain/db';

@Component({
  selector: 'app-reinforce',
  imports: [AnswerBar, CardEditDialog, CardFace, SessionShell, ReinforceSummary, RouterLink],
  templateUrl: './reinforce.html',
  providers: [ReinforceSession],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reinforce {
  private readonly router = inject(Router);
  private readonly deckStore = inject(DeckStore);
  readonly session = inject(ReinforceSession);
  private readonly editDialog = viewChild.required(CardEditDialog);

  readonly etiquetas = input<string>();
  readonly backParams = computed(() => ({ [TAG_PARAM]: serializeTagParam(parseTagParam(this.etiquetas())) }));
  readonly position = computed(() => `${this.session.progress().done} / ${this.session.progress().total}`);
  readonly percent = computed(() => {
    const { done, total } = this.session.progress();
    return total ? (done / total) * 100 : 0;
  });

  constructor() {
    let started = false;
    effect(() => {
      const deck = this.deckStore.deck();
      if (!deck || started) return;
      started = true;
      void this.session.start(deck.id, parseTagParam(this.etiquetas()));
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.editDialog().isOpen()) return;
    if (event.code === 'Space') event.preventDefault();
    const action = reviewKeyAction(event, this.session.revealed());
    if (action === 'reveal') this.session.reveal();
    if (action === 'again' || action === 'good') this.session.answer(action);
  }

  exit(): void {
    void this.router.navigate(['/dificeis'], { queryParams: this.backParams() });
  }

  goHome(): void {
    void this.router.navigateByUrl('/');
  }

  openEdit(card: Card): void {
    this.editDialog().open(card);
  }
}
