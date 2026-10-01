import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS } from './nav-items';

/** Gatilho ☰ e painel: cada tela ganha isso de graça pelo cabeçalho da casca. Some a partir de `md`. */
@Component({
  selector: 'app-mobile-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './mobile-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNav {
  readonly items = NAV_ITEMS;

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  openMenu(): void {
    this.dialogRef().nativeElement.showModal();
  }

  closeMenu(): void {
    this.dialogRef().nativeElement.close();
  }
}
