import { Service, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { completeSignIn, decideOnSignIn, type SignInDecision, type SignInPlan } from '../domain/auth';
import { getSupabase, isSyncConfigured } from '../domain/supabase';

export type AuthPhase = 'disabled' | 'restoring' | 'signed-out' | 'signed-in';
export interface AuthResult {
  error: string | null;
  needsConfirmation?: boolean;
}

@Service()
export class AuthStore {
  private readonly sessionSignal = signal<Session | null>(null);
  private readonly phaseSignal = signal<AuthPhase>(isSyncConfigured() ? 'restoring' : 'disabled');
  private readonly pendingSignal = signal<SignInDecision | null>(null);
  readonly session = this.sessionSignal.asReadonly();
  readonly phase = this.phaseSignal.asReadonly();
  readonly pendingDecision = this.pendingSignal.asReadonly();

  constructor() {
    void this.restore();
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = await getSupabase();
    if (!client) return { error: 'A sincronização não está disponível.' };
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.session) await this.handleSession(data.session);
    return { error: null };
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const client = await getSupabase();
    if (!client) return { error: 'A sincronização não está disponível.' };
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.session) await this.handleSession(data.session);
    return { error: null, needsConfirmation: !data.session };
  }

  async signOut(): Promise<void> {
    const client = await getSupabase();
    await client?.auth.signOut();
    this.sessionSignal.set(null);
    this.phaseSignal.set('signed-out');
    this.pendingSignal.set(null);
  }

  async resolveDecision(plan: SignInPlan): Promise<void> {
    const session = this.sessionSignal();
    if (!session) return;
    await completeSignIn(session.user.id, plan);
    this.pendingSignal.set(null);
    if (plan === 'cancel') {
      this.sessionSignal.set(null);
      this.phaseSignal.set('signed-out');
    }
  }

  private async restore(): Promise<void> {
    const client = await getSupabase();
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (data.session) await this.handleSession(data.session);
    else this.phaseSignal.set('signed-out');
  }

  private async handleSession(session: Session): Promise<void> {
    const decision = await decideOnSignIn(session.user.id);
    if (decision.kind === 'auto-adopt') await completeSignIn(session.user.id, 'merge');
    this.sessionSignal.set(session);
    if (decision.kind === 'prompt' || decision.kind === 'switch') this.pendingSignal.set(decision);
    this.phaseSignal.set('signed-in');
  }
}
