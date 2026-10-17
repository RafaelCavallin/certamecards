import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AnkiImportRun } from '../../state/anki-import-run';
import { AnkiImportSession } from '../../state/anki-import-session';
import { DeckStore } from '../../state/deck-store';
import { cardsLabel, duplicatesLine, formatCount, notesLabel, skippedEntries } from '../../domain/anki-import-text';

@Component({
  selector: 'app-import-target',
  templateUrl: './import-target.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportTarget {
  readonly run = inject(AnkiImportRun);
  private readonly session = inject(AnkiImportSession);
  private readonly deckStore = inject(DeckStore);

  readonly hasDecks = input.required<boolean>();
  readonly decks = computed(() => this.deckStore.decks() ?? []);
  readonly newName = signal(this.session.suggestedDeckName());
  readonly existingId = signal(this.deckStore.deck()?.id ?? '');

  readonly isNew = computed(() => this.run.target()?.kind !== 'existing');
  readonly skipped = computed(() => skippedEntries(this.run.conversion().skipped));
  readonly droppedTags = computed(() => this.run.conversion().droppedTags);
  readonly duplicates = computed(() => this.run.duplicates());
  readonly targetName = computed(() => {
    const target = this.run.target();
    if (target?.kind === 'existing') return this.decks().find((deck) => deck.id === target.deckId)?.name ?? '';
    return this.newName().trim() || this.session.suggestedDeckName();
  });
  readonly duplicatesLine = computed(() => duplicatesLine(this.duplicates(), this.isNew()));
  readonly buttonLabel = computed(() => `Importar ${cardsLabel(this.run.toCreate())} em ${this.targetName()}`);

  chooseExisting(deckId: string): void {
    this.existingId.set(deckId);
    void this.run.chooseTarget({ kind: 'existing', deckId });
  }

  chooseNew(name: string): void {
    this.newName.set(name);
    void this.run.chooseTarget({ kind: 'new', name: name.trim() || this.session.suggestedDeckName() });
  }

  skippedLine(count: number, label: string): string {
    return `${notesLabel(count)} não ${count === 1 ? 'será importada' : 'serão importadas'}: ${label}`;
  }

  count(value: number): string {
    return formatCount(value);
  }

  start(): void {
    void this.run.start();
  }
}
