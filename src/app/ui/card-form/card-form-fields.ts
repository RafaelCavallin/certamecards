import { signal } from '@angular/core';
import type { CardContent } from '../../domain/cards';
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

  load(content: CardContent): void {
    this.front.set(content.front);
    this.back.set(content.back);
    this.notes.set(content.notes);
    this.tags.set(content.tags);
    this.frontMarks.set(content.marks.front);
    this.backMarks.set(content.marks.back);
    this.notesMarks.set(content.marks.notes);
  }

  build(): CardContent {
    return {
      front: this.front(),
      back: this.back(),
      notes: this.notes(),
      marks: { front: this.frontMarks(), back: this.backMarks(), notes: this.notesMarks() },
      tags: this.tags(),
    };
  }

  resetTexts(): void {
    this.front.set('');
    this.back.set('');
    this.notes.set('');
    this.frontMarks.set(EMPTY_MARKS);
    this.backMarks.set(EMPTY_MARKS);
    this.notesMarks.set(EMPTY_MARKS);
  }
}
