import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CloseButton } from '../../ui/close-button/close-button';
import { DeckRhythm } from '../../ui/deck-rhythm/deck-rhythm';
import { loadDeckOverview } from '../../domain/deck-overview';
import type { Deck } from '../../domain/db';
import { liveQueryFor } from '../../state/live-query';
import { DeckStats } from './deck-stats';

@Component({
  selector: 'app-deck-panel',
  imports: [RouterLink, CloseButton, DeckRhythm, DeckStats],
  templateUrl: './deck-panel.html',
  host: { class: 'block rounded-2xl border border-line bg-surface p-5' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckPanel {
  readonly deck = input.required<Deck>();
  readonly active = input(false);
  readonly openCards = output<void>();
  readonly study = output<void>();
  readonly renamed = output<string>();
  readonly removed = output<void>();

  readonly overview = liveQueryFor(this.deck, (deck) => loadDeckOverview(deck));
  readonly editing = signal(false);
  readonly editName = signal('');
  readonly rhythmOpen = signal(false);
  private readonly rhythmDialog = viewChild.required<ElementRef<HTMLDialogElement>>('rhythmDialog');

  startRename(): void {
    this.editName.set(this.deck().name);
    this.editing.set(true);
  }

  confirmRename(): void {
    if (!this.editing()) return;
    this.editing.set(false);
    if (this.editName().trim()) this.renamed.emit(this.editName());
  }

  openRhythm(): void {
    this.rhythmOpen.set(true);
    this.rhythmDialog().nativeElement.showModal();
  }

  closeRhythm(): void {
    this.rhythmDialog().nativeElement.close();
  }
}
