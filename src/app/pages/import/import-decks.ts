import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnkiImportSession } from '../../state/anki-import-session';
import { cardsLabel, countLabel, notesLabel } from '../../domain/anki-import-text';

const NO_DECK_NAME = 'Sem baralho';

@Component({
  selector: 'app-import-decks',
  templateUrl: './import-decks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDecks {
  readonly session = inject(AnkiImportSession);

  readonly fileSummary = computed(() => {
    const collection = this.session.collection();
    const notes = notesLabel(collection?.notes.length ?? 0);
    const decks = countLabel(this.session.sourceDecks().length, 'baralho', 'baralhos');
    return `${notes} · ${decks} · ${countLabel(collection?.notetypes.length ?? 0, 'tipo de nota', 'tipos de nota')}`;
  });
  readonly selectionSummary = computed(
    () => `${countLabel(this.session.selected().length, 'nota selecionada', 'notas selecionadas')} · ${cardsLabel(this.session.plannedCards())}`,
  );
  readonly canContinue = computed(() => this.session.selected().length > 0);

  deckLabel(name: string): string {
    return name || NO_DECK_NAME;
  }

  countLabel(count: number): string {
    return notesLabel(count);
  }
}
