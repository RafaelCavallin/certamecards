import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MarkableField } from '../markable-field/markable-field';
import { charCounterLabel } from '../../domain/char-counter';
import { BACK_MAX, FRONT_MAX, NOTES_MAX, validateCardContent } from '../../domain/card-limits';
import type { CardContent } from '../../domain/cards';
import type { Marks } from '../../domain/text-marks';

const EMPTY_MARKS: Marks = { cloze: [], emphasis: [] };

/** Formulário compartilhado por criar e editar um cartão — quem chama decide o que fazer com o conteúdo salvo. */
@Component({
  selector: 'app-card-form',
  imports: [MarkableField],
  templateUrl: './card-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardForm {
  readonly title = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly initial = input<CardContent | null>(null);
  readonly onSubmit = input.required<(content: CardContent) => Promise<void>>();
  readonly frontMax = FRONT_MAX;
  readonly backMax = BACK_MAX;
  readonly notesMax = NOTES_MAX;
  readonly front = signal('');
  readonly back = signal('');
  readonly notes = signal('');
  readonly frontMarks = signal<Marks>(EMPTY_MARKS);
  readonly backMarks = signal<Marks>(EMPTY_MARKS);
  readonly notesMarks = signal<Marks>(EMPTY_MARKS);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  private readonly frontField = viewChild<MarkableField>('frontField');
  readonly ready = computed(() => this.front().trim().length > 0 && this.back().trim().length > 0);
  readonly frontCounter = computed(() => charCounterLabel(this.front().length, this.frontMax));
  readonly backCounter = computed(() => charCounterLabel(this.back().length, this.backMax));
  readonly notesCounter = computed(() => charCounterLabel(this.notes().length, this.notesMax));

  constructor() {
    effect(() => this.loadInitial(this.initial()));
  }

  async submit(): Promise<void> {
    const content = this.buildContent();
    const validation = validateCardContent(content);
    if (!validation.valid) {
      this.error.set(validation.errors[0]);
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    try {
      await this.onSubmit()(content);
      if (!this.initial()) this.resetFields();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Não foi possível salvar o cartão.');
    } finally {
      this.saving.set(false);
    }
  }

  private loadInitial(content: CardContent | null): void {
    if (!content) return;
    this.front.set(content.front);
    this.back.set(content.back);
    this.notes.set(content.notes);
    this.frontMarks.set(content.marks.front);
    this.backMarks.set(content.marks.back);
    this.notesMarks.set(content.marks.notes);
  }

  private buildContent(): CardContent {
    return {
      front: this.front(),
      back: this.back(),
      notes: this.notes(),
      marks: { front: this.frontMarks(), back: this.backMarks(), notes: this.notesMarks() },
    };
  }

  private resetFields(): void {
    this.front.set('');
    this.back.set('');
    this.notes.set('');
    this.frontMarks.set(EMPTY_MARKS);
    this.backMarks.set(EMPTY_MARKS);
    this.notesMarks.set(EMPTY_MARKS);
    this.frontField()?.focus();
  }
}
