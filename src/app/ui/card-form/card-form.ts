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
import { TagInput } from '../tag-input/tag-input';
import { CardFormFields } from './card-form-fields';
import { charCounterLabel } from '../../domain/char-counter';
import { BACK_MAX, FRONT_MAX, NOTES_MAX, validateCardContent } from '../../domain/card-limits';
import type { CardContent } from '../../domain/cards';

/** Formulário compartilhado por criar e editar um cartão — quem chama decide o que fazer com o conteúdo salvo. */
@Component({
  selector: 'app-card-form',
  imports: [MarkableField, TagInput],
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
  readonly fields = new CardFormFields();
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  private readonly frontField = viewChild<MarkableField>('frontField');
  readonly ready = computed(
    () => this.fields.front().trim().length > 0 && this.fields.back().trim().length > 0,
  );
  readonly frontCounter = computed(() => charCounterLabel(this.fields.front().length, this.frontMax));
  readonly backCounter = computed(() => charCounterLabel(this.fields.back().length, this.backMax));
  readonly notesCounter = computed(() => charCounterLabel(this.fields.notes().length, this.notesMax));

  constructor() {
    effect(() => {
      const content = this.initial();
      if (content) this.fields.load(content);
    });
  }

  async submit(): Promise<void> {
    const content = this.fields.build();
    const validation = validateCardContent(content);
    if (!validation.valid) {
      this.error.set(validation.errors[0]);
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    try {
      await this.onSubmit()(content);
      if (!this.initial()) this.resetAfterCreate();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Não foi possível salvar o cartão.');
    } finally {
      this.saving.set(false);
    }
  }

  private resetAfterCreate(): void {
    this.fields.resetTexts();
    this.frontField()?.focus();
  }
}
