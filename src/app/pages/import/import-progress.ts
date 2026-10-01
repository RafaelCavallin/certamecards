import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnkiImportRun } from '../../state/anki-import-run';
import { formatCount, progressMilestone } from '../../domain/anki-import-text';

const FULL_PERCENT = 100;

@Component({
  selector: 'app-import-progress',
  templateUrl: './import-progress.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportProgress {
  readonly run = inject(AnkiImportRun);

  readonly label = computed(() => {
    const { done, total } = this.run.progress();
    return `Criando os cartões… ${formatCount(done)} de ${formatCount(total)}`;
  });
  readonly percent = computed(() => {
    const { done, total } = this.run.progress();
    return total > 0 ? Math.round((done / total) * FULL_PERCENT) : 0;
  });
  readonly milestone = computed(() => {
    const { done, total } = this.run.progress();
    return `${progressMilestone(done, total)}% concluído`;
  });
}
