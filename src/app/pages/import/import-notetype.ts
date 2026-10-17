import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ImportPreview } from './import-preview';
import { AnkiImportSession } from '../../state/anki-import-session';
import { notesLabel } from '../../domain/anki-import-text';
import { UNSUPPORTED_REASON, classifyNotetype, type FieldMapping } from '../../domain/anki-mapping';
import type { AnkiNotetype } from '../../domain/anki-types';

type MappedSide = 'front' | 'back' | 'notes';

const NO_FIELD = '';

@Component({
  selector: 'app-import-notetype',
  imports: [ImportPreview],
  templateUrl: './import-notetype.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportNotetype {
  private readonly session = inject(AnkiImportSession);

  readonly notetype = input.required<AnkiNotetype>();
  readonly unsupportedReason = UNSUPPORTED_REASON;
  readonly noField = NO_FIELD;

  readonly kind = computed(() => classifyNotetype(this.notetype()));
  readonly mapping = computed<FieldMapping>(
    () => this.session.mappings()[this.notetype().id] ?? { include: false, front: 0, back: null, notes: null },
  );
  readonly noteCount = computed(() =>
    notesLabel(this.session.selected().filter((note) => note.notetypeId === this.notetype().id).length),
  );
  readonly sameField = computed(() => {
    const { front, back, notes } = this.mapping();
    const used = [front, back, notes].filter((index) => index !== null);
    return new Set(used).size < used.length;
  });

  setInclude(include: boolean): void {
    this.update({ ...this.mapping(), include });
  }

  setField(side: MappedSide, value: string): void {
    const index = value === NO_FIELD ? null : Number(value);
    if (side === 'front') this.update({ ...this.mapping(), front: index ?? 0 });
    else this.update({ ...this.mapping(), [side]: index });
  }

  private update(mapping: FieldMapping): void {
    this.session.setMapping(this.notetype().id, mapping);
  }
}
