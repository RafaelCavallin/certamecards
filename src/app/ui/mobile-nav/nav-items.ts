export interface NavItem {
  path: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Início' },
  { path: '/cartoes/novo', label: '+ Cartão' },
  { path: '/cartoes', label: 'Cartões' },
  { path: '/dificeis', label: 'Difíceis' },
  { path: '/progresso', label: 'Progresso' },
  { path: '/ajustes', label: 'Ajustes' },
];
