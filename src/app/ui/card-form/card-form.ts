import { ChangeDetectionStrategy, Component, HostListener, computed, effect, input, signal, viewChild } from '@angular/core';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { ImageGalleryEditor } from '../image-gallery-editor/image-gallery-editor';
import { MarkableField } from '../markable-field/markable-field';
import { TagInput } from '../tag-input/tag-input';
import { CardFormFields } from './card-form-fields';
import { BACK_MAX, FRONT_MAX, NOTES_MAX, validateCardContent } from '../../domain/card-limits';
import { emptyDraft, hasDraftChanges, type CardDraft } from '../../domain/card-draft';
import { waitingImagesLabel } from '../../domain/image-labels';
import { pastedImages } from '../../domain/image-input';

@Component({
  selector: 'app-card-form',
  imports: [MarkableField, TagInput, ImageGalleryEditor, ConfirmDialog],
  templateUrl: './card-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardForm {
  readonly title = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly initial = input<CardDraft | null>(null);
  readonly onSubmit = input.required<(draft: CardDraft) => Promise<void>>();
  readonly frontMax = FRONT_MAX;
  readonly backMax = BACK_MAX;
  readonly notesMax = NOTES_MAX;
  readonly fields = new CardFormFields();
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  private readonly baseline = signal<CardDraft>(emptyDraft());
  private readonly frontField = viewChild<MarkableField>('frontField');
  private readonly gallery = viewChild.required(ImageGalleryEditor);
  private readonly discardDialog = viewChild.required(ConfirmDialog);
  readonly submitText = computed(() => {
    if (this.saving()) return 'Salvando…';
    const waiting = this.fields.pending();
    return waiting > 0 ? waitingImagesLabel(waiting) : this.submitLabel();
  });

  constructor() {
    effect(() => {
      const draft = this.initial();
      if (!draft) return;
      this.fields.load(draft);
      this.baseline.set(draft);
    });
  }

  hasChanges(): boolean {
    return hasDraftChanges(this.baseline(), this.fields.build());
  }

  async confirmDiscard(): Promise<boolean> {
    return !this.hasChanges() || this.discardDialog().ask();
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasChanges()) event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const data = event.clipboardData;
    const images = pastedImages({ types: [...(data?.types ?? [])], files: [...(data?.files ?? [])] });
    if (images.length === 0) return;
    event.preventDefault();
    void this.gallery().addFiles(images);
  }

  async submit(): Promise<void> {
    const draft = this.fields.build();
    const validation = validateCardContent(draft.content);
    if (!validation.valid) {
      this.error.set(validation.errors[0]);
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    try {
      await this.onSubmit()(draft);
      this.afterSave(draft);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Não foi possível salvar o cartão.');
    } finally {
      this.saving.set(false);
    }
  }

  private afterSave(draft: CardDraft): void {
    if (this.initial()) {
      this.baseline.set(draft);
      return;
    }
    this.fields.reset();
    this.baseline.set(emptyDraft());
    this.frontField()?.focus();
  }
}
