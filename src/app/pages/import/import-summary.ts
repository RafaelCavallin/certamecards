import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnkiImportRun } from '../../state/anki-import-run';
import { cardsLabel, duplicatesSummary, formatCount, notesLabel, skippedEntries } from '../../domain/anki-import-text';

@Component({
  selector: 'app-import-summary',
  imports: [RouterLink],
  templateUrl: './import-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportSummary {
  readonly run = inject(AnkiImportRun);

  readonly headline = computed(() => {
    const outcome = this.run.outcome();
    if (!outcome) return '';
    const verb = outcome.created === 1 ? 'importado' : 'importados';
    return `${cardsLabel(outcome.created)} ${verb} em ${outcome.deckName}`;
  });
  readonly duplicates = computed(() => this.run.outcome()?.duplicates ?? 0);
  readonly duplicatesLine = computed(() => duplicatesSummary(this.duplicates(), this.run.target()?.kind === 'new'));
  readonly skipped = computed(() => skippedEntries(this.run.conversion().skipped));
  readonly droppedTags = computed(() => this.run.conversion().droppedTags);

  skippedLine(count: number, label: string): string {
    return `${notesLabel(count)} ${count === 1 ? 'não importada' : 'não importadas'}: ${label}`;
  }

  count(value: number): string {
    return formatCount(value);
  }
}
