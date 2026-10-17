import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MarkedText } from '../../ui/marked-text/marked-text';
import { TagChips } from '../../ui/tag-chips/tag-chips';
import { AnkiImportSession } from '../../state/anki-import-session';
import { previewDrafts } from '../../domain/anki-convert-batch';
import type { AnkiNotetype } from '../../domain/anki-types';

@Component({
  selector: 'app-import-preview',
  imports: [MarkedText, TagChips],
  templateUrl: './import-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportPreview {
  private readonly session = inject(AnkiImportSession);

  readonly notetype = input.required<AnkiNotetype>();
  readonly drafts = computed(() => {
    const notes = this.session.selected().filter((note) => note.notetypeId === this.notetype().id);
    return previewDrafts(notes, this.session.setup());
  });
}
