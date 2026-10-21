import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppUpdate } from './state/app-update';
import { DeckStore } from './state/deck-store';
import { StorageHealth } from './state/storage-health';
import { StoragePersistence } from './state/storage-persistence-store';
import { SyncStore } from './state/sync-store';
import { ThemeStore } from './state/theme-store';
import { DeckSwitcher } from './ui/deck-switcher/deck-switcher';
import { DueBadge } from './ui/due-badge/due-badge';
import { MobileNav } from './ui/mobile-nav/mobile-nav';
import { StorageAlert } from './ui/storage-alert/storage-alert';
import { NAV_ITEMS } from './ui/mobile-nav/nav-items';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MobileNav, DeckSwitcher, DueBadge, StorageAlert],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly deckStore = inject(DeckStore);

  readonly navItems = NAV_ITEMS;
  readonly deck = this.deckStore.deck;
  readonly totalDue = this.deckStore.totalDue;
  readonly appUpdate = inject(AppUpdate);

  private readonly deckSwitcher = viewChild.required(DeckSwitcher);

  constructor() {
    inject(StorageHealth);
    inject(SyncStore);
    inject(ThemeStore);
    void inject(StoragePersistence).request();
  }

  openSwitcher(): void {
    this.deckSwitcher().open();
  }
}
