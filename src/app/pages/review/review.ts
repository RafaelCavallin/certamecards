import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AnswerBar } from '../../ui/answer-bar/answer-bar';
import { CardFace } from '../../ui/card-face/card-face';
import { CardForm } from '../../ui/card-form/card-form';
import { ReviewSession } from '../../state/review-session';
import { updateCardContent, type CardContent } from '../../domain/cards';

@Component({
  selector: 'app-review',
  imports: [AnswerBar, CardFace, CardForm],
  templateUrl: './review.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Review {
  private readonly router = inject(Router);
  readonly session = inject(ReviewSession);

  private readonly editDialog = viewChild<ElementRef<HTMLDialogElement>>('editDialog');

  readonly progress = computed(() => {
    const total = this.session.queue()?.length ?? 0;
    return total ? (this.session.index() / total) * 100 : 0;
  });

  readonly resultLabel = computed(() => {
    const done = this.session.done();
    if (done === 0) return 'Nada vencido agora';
    return `${done} ${done === 1 ? 'cartão revisado' : 'cartões revisados'}`;
  });

  readonly editInitial = computed<CardContent | null>(() => {
    const card = this.session.current();
    return card
      ? { front: card.front, back: card.back, notes: card.notes, marks: card.marks }
      : null;
  });

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.editDialog()?.nativeElement.open) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (this.session.revealed()) void this.session.answer('good');
      else this.session.reveal();
      return;
    }
    if (event.key === '1' && this.session.revealed()) void this.session.answer('again');
    if (event.key === '2' && this.session.revealed()) void this.session.answer('good');
  }

  goHome(): void {
    void this.router.navigateByUrl('/');
  }

  openEdit(): void {
    this.editDialog()?.nativeElement.showModal();
  }

  readonly saveEdit = async (content: CardContent): Promise<void> => {
    const card = this.session.current();
    if (!card) return;
    await updateCardContent(card.id, content);
    this.session.replaceCurrent({ ...card, ...content });
    this.editDialog()?.nativeElement.close();
  };
}
