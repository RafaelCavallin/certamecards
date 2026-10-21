import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth-store';
import { StorageHealth } from '../../state/storage-health';

function setOpen(dialog: HTMLDialogElement, open: boolean): void {
  if (open && !dialog.open) dialog.showModal();
  if (!open && dialog.open) dialog.close();
}

@Component({
  selector: 'app-storage-alert',
  imports: [RouterLink],
  templateUrl: './storage-alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageAlert {
  private readonly health = inject(StorageHealth);
  private readonly auth = inject(AuthStore);
  private readonly blocking = viewChild.required<ElementRef<HTMLDialogElement>>('blocking');
  private readonly explanation = viewChild.required<ElementRef<HTMLDialogElement>>('explanation');

  readonly signedIn = computed(() => this.auth.session() !== null);
  private readonly showExplanation = computed(() => this.health.lostAt() !== null && !this.health.connectionLost());

  constructor() {
    effect(() => this.syncDialogs());
  }

  syncDialogs(): void {
    setOpen(this.blocking().nativeElement, this.health.connectionLost());
    setOpen(this.explanation().nativeElement, this.showExplanation());
  }

  keepOpen(event: Event): void {
    event.preventDefault();
  }

  reload(): void {
    this.health.reload();
  }

  dismiss(): void {
    this.health.dismissLoss();
  }
}
