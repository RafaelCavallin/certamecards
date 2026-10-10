import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackupConfirm } from './backup-confirm';
import { BackupExport } from './backup-export';
import { BackupPick } from './backup-pick';
import { BackupPreviewStep } from './backup-preview';
import { BackupProgress } from './backup-progress';
import { BackupSummary } from './backup-summary';
import { BackupExportSession } from '../../state/backup-export-session';
import { BackupRestoreSession } from '../../state/backup-restore-session';
import type { RestoreStep } from '../../domain/backup-steps';

@Component({
  selector: 'app-backup',
  imports: [RouterLink, BackupConfirm, BackupExport, BackupPick, BackupPreviewStep, BackupProgress, BackupSummary],
  templateUrl: './backup.html',
  providers: [BackupExportSession, BackupRestoreSession],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Backup {
  readonly restore = inject(BackupRestoreSession);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private shownStep: RestoreStep | null = null;

  readonly picking = computed(() => this.restore.step() === 'pick' || this.restore.step() === 'reading');

  constructor() {
    afterRenderEffect(() => {
      const step = this.restore.step();
      if (this.shownStep !== null && step !== this.shownStep) {
        this.host.nativeElement.querySelector<HTMLElement>('[data-step-focus]')?.focus();
      }
      this.shownStep = step;
    });
  }
}
