import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { pageTitle } from '../domain/page-title';

/**
 * O DefaultTitleStrategy do Angular só troca o título quando a rota declara `title`;
 * sem isso, a aba ficava com o título da última rota que tinha um (ex.: "Difíceis").
 * Aqui o título é sempre definido: o da rota, ou o do app.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.title.setTitle(pageTitle(this.buildTitle(snapshot)));
  }
}
