import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Excluir');
  readonly cancelLabel = input('Cancelar');
  readonly tone = input<'danger' | 'neutral'>('danger');
  readonly confirmed = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private resolver: ((answer: boolean) => void) | null = null;

  open(): void {
    this.dialogRef().nativeElement.showModal();
  }

  ask(): Promise<boolean> {
    this.settle(false);
    this.open();
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  cancel(): void {
    this.dialogRef().nativeElement.close();
  }

  confirm(): void {
    this.settle(true);
    this.dialogRef().nativeElement.close();
    this.confirmed.emit();
  }

  settle(answer: boolean): void {
    this.resolver?.(answer);
    this.resolver = null;
  }
}
