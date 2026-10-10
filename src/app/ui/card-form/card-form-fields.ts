import { computed, signal } from '@angular/core';
import { BACK_MAX, FRONT_MAX, NOTES_MAX } from '../../domain/card-limits';
import type { CardDraft } from '../../domain/card-draft';
import { charCounterLabel } from '../../domain/char-counter';
import type { GalleryItem } from '../../domain/gallery-draft';
import type { Marks } from '../../domain/text-marks';

const EMPTY_MARKS: Marks = { cloze: [], emphasis: [] };

export class CardFormFields {
  readonly front = signal('');
  readonly back = signal('');
  readonly notes = signal('');
  readonly tags = signal<string[]>([]);
  readonly frontMarks = signal<Marks>(EMPTY_MARKS);
  readonly backMarks = signal<Marks>(EMPTY_MARKS);
  readonly notesMarks = signal<Marks>(EMPTY_MARKS);
  readonly gallery = signal<GalleryItem[]>([]);
  readonly pending = signal(0);

  readonly ready = computed(() => this.front().trim().length > 0 && this.back().trim().length > 0 && this.pending() === 0);
  readonly frontCounter = computed(() => charCounterLabel(this.front().length, FRONT_MAX));
  readonly backCounter = computed(() => charCounterLabel(this.back().length, BACK_MAX));
  readonly notesCounter = computed(() => charCounterLabel(this.notes().length, NOTES_MAX));

  load(draft: CardDraft): void {
    const { content } = draft;
    this.front.set(content.front);
    this.back.set(content.back);
    this.notes.set(content.notes);
    this.tags.set(content.tags);
    this.frontMarks.set(content.marks.front);
    this.backMarks.set(content.marks.back);
    this.notesMarks.set(content.marks.notes);
    this.gallery.set(draft.gallery);
  }

  build(): CardDraft {
    return {
      content: {
        front: this.front(),
        back: this.back(),
        notes: this.notes(),
        marks: { front: this.frontMarks(), back: this.backMarks(), notes: this.notesMarks() },
        tags: this.tags(),
      },
      gallery: this.gallery(),
    };
  }

  reset(): void {
    this.front.set('');
    this.back.set('');
    this.notes.set('');
    this.frontMarks.set(EMPTY_MARKS);
    this.backMarks.set(EMPTY_MARKS);
    this.notesMarks.set(EMPTY_MARKS);
    this.gallery.set([]);
  }
}
