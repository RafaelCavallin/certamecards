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
  readonly confirmed = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialogRef().nativeElement.showModal();
  }

  cancel(): void {
    this.dialogRef().nativeElement.close();
  }

  confirm(): void {
    this.dialogRef().nativeElement.close();
    this.confirmed.emit();
  }
}
