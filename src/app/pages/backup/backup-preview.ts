import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BackupRestoreSession } from '../../state/backup-restore-session';
import type { RestorePlan } from '../../domain/backup-format';
import { countsLabels } from '../../domain/backup-labels';
import { formatBackupDate, planText } from '../../domain/backup-summary-text';
import { formatMegabytes } from '../../domain/image-labels';

const PLANS: readonly RestorePlan[] = ['merge', 'replace'];

@Component({
  selector: 'app-backup-preview',
  templateUrl: './backup-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupPreviewStep {
  readonly session = inject(BackupRestoreSession);
  readonly plans = PLANS;

  readonly title = computed(() => {
    const preview = this.session.preview();
    return preview ? `Backup de ${formatBackupDate(preview.exportedAt)}` : '';
  });
  readonly counts = computed(() => {
    const preview = this.session.preview();
    return preview ? countsLabels(preview.counts) : [];
  });
  readonly imageSize = computed(() => {
    const preview = this.session.preview();
    return preview && preview.counts.images > 0 ? formatMegabytes(preview.imageBytes) : null;
  });
  readonly discarded = computed(() => this.session.preview()?.discarded ?? 0);

  text(plan: RestorePlan) {
    return planText(plan);
  }
}
