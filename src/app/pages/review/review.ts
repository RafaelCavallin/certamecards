import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AnswerBar } from '../../ui/answer-bar/answer-bar';
import { CardEditDialog } from '../../ui/card-edit-dialog/card-edit-dialog';
import { CardFace } from '../../ui/card-face/card-face';
import { SessionShell } from '../../ui/session-shell/session-shell';
import { ReviewSession } from '../../state/review-session';
import { reviewKeyAction } from '../../domain/review-keys';
import type { Card } from '../../domain/db';

@Component({
  selector: 'app-review',
  imports: [AnswerBar, CardEditDialog, CardFace, SessionShell],
  templateUrl: './review.html',
  providers: [ReviewSession],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Review {
  private readonly router = inject(Router);
  readonly session = inject(ReviewSession);

  private readonly editDialog = viewChild.required(CardEditDialog);

  readonly progress = computed(() => {
    const total = this.session.queue()?.length ?? 0;
    return total ? (this.session.index() / total) * 100 : 0;
  });

  readonly position = computed(() => `${this.session.index() + 1} / ${this.session.queue()?.length}`);

  readonly resultLabel = computed(() => {
    const done = this.session.done();
    if (done === 0) return 'Nada vencido agora';
    return `${done} ${done === 1 ? 'cartão revisado' : 'cartões revisados'}`;
  });

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.editDialog().isOpen()) return;
    if (event.code === 'Space') event.preventDefault();
    const action = reviewKeyAction(event, this.session.revealed());
    if (action === 'reveal') this.session.reveal();
    if (action === 'again' || action === 'good') void this.session.answer(action);
  }

  goHome(): void {
    void this.router.navigateByUrl('/');
  }

  openEdit(card: Card): void {
    this.editDialog().open(card);
  }

  replaceCurrent(card: Card): void {
    this.session.replaceCurrent(card);
  }
}
