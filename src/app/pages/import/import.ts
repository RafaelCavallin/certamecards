import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImportDecks } from './import-decks';
import { ImportFields } from './import-fields';
import { ImportFile } from './import-file';
import { ImportProgress } from './import-progress';
import { ImportSummary } from './import-summary';
import { ImportTarget } from './import-target';
import { AnkiImportRun } from '../../state/anki-import-run';
import { AnkiImportSession } from '../../state/anki-import-session';
import { AnkiReaderStatus } from '../../state/anki-reader-status';
import { DeckStore } from '../../state/deck-store';
import { TOTAL_VISIBLE_STEPS, canGoBack, visibleStepNumber } from '../../domain/anki-steps';

@Component({
  selector: 'app-import',
  imports: [RouterLink, ImportDecks, ImportFields, ImportFile, ImportProgress, ImportSummary, ImportTarget],
  templateUrl: './import.html',
  providers: [AnkiReaderStatus, AnkiImportSession, AnkiImportRun],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Import {
  readonly session = inject(AnkiImportSession);
  private readonly deckStore = inject(DeckStore);

  readonly hasDecks = computed(() => (this.deckStore.decks()?.length ?? 0) > 0);
  readonly exitLink = computed(() => (this.hasDecks() ? '/ajustes' : '/sem-baralho'));
  readonly exitLabel = computed(() => (this.hasDecks() ? '← Ajustes' : '← Voltar'));
  readonly stepLabel = computed(() => {
    const number = visibleStepNumber(this.session.step());
    return number === null ? null : `Passo ${number} de ${TOTAL_VISIBLE_STEPS}`;
  });
  readonly canGoBack = computed(() => canGoBack(this.session.step()));
  readonly error = computed(() => this.session.error() ?? this.session.run.error());
}
