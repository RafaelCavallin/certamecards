import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ImportNotetype } from './import-notetype';
import { AnkiImportSession } from '../../state/anki-import-session';
import { cardsLabel, fileSummary, notesLabel } from '../../domain/anki-import-text';

@Component({
  selector: 'app-import-fields',
  imports: [ImportNotetype],
  templateUrl: './import-fields.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFields {
  readonly session = inject(AnkiImportSession);

  readonly preparing = computed(() => this.session.step() === 'preparing');
  readonly fileLine = computed(() => {
    const collection = this.session.collection();
    return fileSummary({
      notes: collection?.notes.length ?? 0,
      decks: this.session.sourceDecks().length,
      notetypes: collection?.notetypes.length ?? 0,
    });
  });
  readonly summary = computed(
    () => `${notesLabel(this.session.selected().length)} · ${cardsLabel(this.session.plannedCards())} previstos`,
  );
  readonly canContinue = computed(() => this.session.plannedCards() > 0 && !this.preparing());

  continue(): void {
    void this.session.goToTarget();
  }
}
