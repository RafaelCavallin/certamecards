import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DeckStore } from '../../state/deck-store';

@Component({
  selector: 'app-no-deck',
  imports: [RouterLink],
  templateUrl: './no-deck.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoDeck {
  private readonly deckStore = inject(DeckStore);
  private readonly router = inject(Router);

  readonly name = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async create(): Promise<void> {
    const trimmed = this.name().trim();
    if (!trimmed || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.deckStore.createDeck(trimmed);
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set('Não foi possível criar o baralho. Tente de novo.');
    } finally {
      this.busy.set(false);
    }
  }
}
