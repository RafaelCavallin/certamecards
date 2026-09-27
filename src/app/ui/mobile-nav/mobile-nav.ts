import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
}

const ITEMS: NavItem[] = [
  { path: '/', label: 'Início' },
  { path: '/cartoes/novo', label: '+ Cartão' },
  { path: '/cartoes', label: 'Cartões' },
  { path: '/progresso', label: 'Progresso' },
  { path: '/ajustes', label: 'Ajustes' },
];

/** Gatilho ☰ e painel: cada tela ganha isso de graça pelo cabeçalho da casca. Some a partir de `md`. */
@Component({
  selector: 'app-mobile-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './mobile-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNav {
  readonly items = ITEMS;

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  openMenu(): void {
    this.dialogRef().nativeElement.showModal();
  }

  closeMenu(): void {
    this.dialogRef().nativeElement.close();
  }
}
