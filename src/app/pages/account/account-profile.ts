import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { AuthStore } from '../../state/auth-store';
import { DISPLAY_NAME_MAX_LENGTH, isValidDisplayName, normalizeDisplayName } from '../../domain/display-name';

@Component({
  selector: 'app-account-profile',
  templateUrl: './account-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfile {
  readonly auth = inject(AuthStore);
  private readonly injector = inject(Injector);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly editButton = viewChild<ElementRef<HTMLButtonElement>>('editButton');
  readonly nameMaxLength = DISPLAY_NAME_MAX_LENGTH;
  readonly email = computed(() => this.auth.session()?.user.email ?? '');
  readonly editing = signal(false);
  readonly draft = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly canSave = computed(
    () =>
      !this.saving() &&
      isValidDisplayName(this.draft()) &&
      normalizeDisplayName(this.draft()) !== this.auth.displayName(),
  );

  startEditing(): void {
    this.draft.set(this.auth.displayName() ?? '');
    this.error.set(null);
    this.editing.set(true);
    this.focusAfterRender(() => this.nameInput()?.nativeElement);
  }

  cancel(): void {
    this.error.set(null);
    this.closeEditor();
  }

  updateDraft(value: string): void {
    this.draft.set(value);
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    const result = await this.auth.updateDisplayName(this.draft());
    this.saving.set(false);
    this.error.set(result.error);
    if (!result.error) this.closeEditor();
  }

  private closeEditor(): void {
    this.editing.set(false);
    this.focusAfterRender(() => this.editButton()?.nativeElement);
  }

  private focusAfterRender(target: () => HTMLElement | undefined): void {
    afterNextRender(() => target()?.focus(), { injector: this.injector });
  }
}
