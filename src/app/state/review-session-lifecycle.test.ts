import '@angular/compiler';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { describe, expect, it } from 'vitest';
import { routes } from '../app.routes';
import { Review } from '../pages/review/review';
import { DeckStore } from './deck-store';

class ExitPage {}
Component({ template: '' })(ExitPage);

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

const reviewRoute = routes.find((route) => route.path === 'revisar');
if (!reviewRoute) throw new Error('Rota de revisão não encontrada.');

describe('sessão de revisão', () => {
  it('começa uma sessão nova ao sair e voltar à revisão', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DeckStore, useValue: { deck: signal(null) } },
        provideRouter([
          { path: '', component: ExitPage },
          { ...reviewRoute, canActivate: [] },
        ]),
      ],
    });
    TestBed.overrideComponent(Review, { set: { template: '', imports: [] } });
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/revisar', Review);
    first.session.reveal();

    await harness.navigateByUrl('/', ExitPage);
    const second = await harness.navigateByUrl('/revisar', Review);

    expect(second.session).not.toBe(first.session);
    expect(second.session.revealed()).toBe(false);
  });
});
