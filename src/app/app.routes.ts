import { Routes } from '@angular/router';
import { requireDeck, requireNoDeck } from './state/guards';
import { ReviewSession } from './state/review-session';

export const routes: Routes = [
  {
    path: '',
    canActivate: [requireDeck],
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'revisar',
    canActivate: [requireDeck],
    providers: [ReviewSession],
    loadComponent: () => import('./pages/review/review').then((m) => m.Review),
  },
  {
    path: 'cartoes',
    canActivate: [requireDeck],
    loadComponent: () => import('./pages/cards/cards').then((m) => m.Cards),
  },
  {
    path: 'cartoes/novo',
    canActivate: [requireDeck],
    loadComponent: () => import('./pages/card-new/card-new').then((m) => m.CardNew),
  },
  {
    path: 'cartoes/:id',
    canActivate: [requireDeck],
    loadComponent: () => import('./pages/card-edit/card-edit').then((m) => m.CardEdit),
  },
  {
    path: 'progresso',
    canActivate: [requireDeck],
    loadComponent: () => import('./pages/progress/progress').then((m) => m.Progress),
  },
  {
    path: 'ajustes',
    canActivate: [requireDeck],
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'sem-baralho',
    canActivate: [requireNoDeck],
    loadComponent: () => import('./pages/no-deck/no-deck').then((m) => m.NoDeck),
  },
];
