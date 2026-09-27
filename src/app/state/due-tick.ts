import { DestroyRef, Service, inject, signal } from '@angular/core';

/** Passo do relógio: abaixo do menor intervalo de aprendizado do FSRS. */
const TICK_MS = 30_000;

/**
 * As contagens de fila dependem de `Date.now()`, e o Dexie só avisa
 * escrita — nunca a passagem do tempo. Sem este relógio, um cartão que vence
 * com a tela já aberta só apareceria no recarregamento seguinte (RF23). Para
 * enquanto a aba está escondida e recalcula assim que ela volta.
 */
@Service()
export class DueTick {
  private readonly tickSignal = signal(0);
  readonly tick = this.tickSignal.asReadonly();

  private intervalId: ReturnType<typeof setInterval> | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const onVisibility = () => this.handleVisibilityChange();
    if (!document.hidden) this.start();
    document.addEventListener('visibilitychange', onVisibility);
    destroyRef.onDestroy(() => {
      this.stop();
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  private handleVisibilityChange(): void {
    this.stop();
    if (document.hidden) return;
    this.tickSignal.update((t) => t + 1);
    this.start();
  }

  private start(): void {
    this.intervalId ??= setInterval(() => this.tickSignal.update((t) => t + 1), TICK_MS);
  }

  private stop(): void {
    if (this.intervalId !== undefined) clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
}
