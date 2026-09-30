import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppUpdate } from './state/app-update';
import { DeckStore } from './state/deck-store';
import { SyncStore } from './state/sync-store';
import { DeckSwitcher } from './ui/deck-switcher/deck-switcher';
import { DueBadge } from './ui/due-badge/due-badge';
import { MobileNav } from './ui/mobile-nav/mobile-nav';

function persistStorage(): void {
  void navigator.storage?.persist?.();
}

interface NavItem {
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Início' },
  { path: '/cartoes/novo', label: '+ Cartão' },
  { path: '/cartoes', label: 'Cartões' },
  { path: '/progresso', label: 'Progresso' },
  { path: '/ajustes', label: 'Ajustes' },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MobileNav, DeckSwitcher, DueBadge],
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
    inject(SyncStore);
    persistStorage();
  }

  openSwitcher(): void {
    this.deckSwitcher().open();
  }
}
