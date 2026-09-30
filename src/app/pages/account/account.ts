import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth-store';
import type { SignInPlan } from '../../domain/auth';

@Component({ selector: 'app-account', imports: [RouterLink], templateUrl: './account.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class Account {
  readonly auth = inject(AuthStore);
  readonly email = signal('');
  readonly password = signal('');
  readonly mode = signal<'signin' | 'signup'>('signin');
  readonly error = signal<string | null>(null);
  readonly confirmation = signal(false);

  async submit(): Promise<void> {
    const result = this.mode() === 'signin' ? await this.auth.signIn(this.email(), this.password()) : await this.auth.signUp(this.email(), this.password());
    this.error.set(result.error);
    this.confirmation.set(result.needsConfirmation === true);
  }

  async resolve(plan: SignInPlan): Promise<void> {
    await this.auth.resolveDecision(plan);
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
