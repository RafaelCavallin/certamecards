import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { DeckStore } from './deck-store';

/** Redireciona para `/sem-baralho` quando o usuário excluiu todos os baralhos. */
export const requireDeck: CanActivateFn = async () => {
  const deckStore = inject(DeckStore);
  const router = inject(Router);
  const decks = await deckStore.ready();
  return decks.length > 0 ? true : router.parseUrl('/sem-baralho');
};

/** Some da tela "Crie seu primeiro baralho" assim que existe pelo menos um. */
export const requireNoDeck: CanActivateFn = async () => {
  const deckStore = inject(DeckStore);
  const router = inject(Router);
  const decks = await deckStore.ready();
  return decks.length === 0 ? true : router.parseUrl('/');
};
