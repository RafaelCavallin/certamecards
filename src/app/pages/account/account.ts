import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth-store';
import type { SignInPlan } from '../../domain/auth';
import { DISPLAY_NAME_MAX_LENGTH, isValidDisplayName } from '../../domain/display-name';
import { AccountProfile } from './account-profile';

@Component({ selector: 'app-account', imports: [RouterLink, AccountProfile], templateUrl: './account.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class Account {
  readonly auth = inject(AuthStore);
  readonly nameMaxLength = DISPLAY_NAME_MAX_LENGTH;
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly modo = input<string>();
  readonly mode = linkedSignal<'signin' | 'signup'>(() => (this.modo() === 'criar' ? 'signup' : 'signin'));
  readonly error = signal<string | null>(null);
  readonly confirmation = signal(false);
  readonly canSubmit = computed(() => {
    const credentials = this.email() !== '' && this.password().length >= 6;
    return this.mode() === 'signin' ? credentials : credentials && isValidDisplayName(this.name());
  });

  async submit(): Promise<void> {
    const result = this.mode() === 'signin' ? await this.auth.signIn(this.email(), this.password()) : await this.auth.signUp(this.email(), this.password(), this.name());
    this.error.set(result.error);
    this.confirmation.set(result.needsConfirmation === true);
  }

  async resolve(plan: SignInPlan): Promise<void> {
    await this.auth.resolveDecision(plan);
  }

  updateName(value: string): void {
    this.name.set(value);
  }

  updateEmail(value: string): void {
    this.email.set(value);
  }

  updatePassword(value: string): void {
    this.password.set(value);
  }

  toggleMode(): void {
    this.mode.update((mode) => (mode === 'signin' ? 'signup' : 'signin'));
    this.error.set(null);
  }
}
