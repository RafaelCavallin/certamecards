import { ChangeDetectionStrategy, Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CardEditDialog } from '../../ui/card-edit-dialog/card-edit-dialog';
import { TagFilter } from '../../ui/tag-filter/tag-filter';
import { DifficultRow } from './difficult-row';
import { DeckStore } from '../../state/deck-store';
import { liveQueryFor } from '../../state/live-query';
import { REINFORCE_LIMIT } from '../../domain/reinforce';
import type { Card } from '../../domain/db';
import { listDifficult } from '../../domain/difficulty-data';
import { difficultTagOptions, filterDifficultByTags } from '../../domain/difficulty';
import { TAG_PARAM, parseTagParam, serializeTagParam } from '../../domain/tag-param';

@Component({
  selector: 'app-difficult',
  imports: [RouterLink, TagFilter, DifficultRow, CardEditDialog],
  templateUrl: './difficult.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Difficult {
  private readonly router = inject(Router);
  private readonly deckStore = inject(DeckStore);
  private readonly editDialog = viewChild.required(CardEditDialog);

  readonly etiquetas = input<string>();
  readonly deckId = computed(() => this.deckStore.deck()?.id);
  readonly list = liveQueryFor(this.deckId, (deckId) => listDifficult(deckId));
  readonly now = computed(() => (this.list(), Date.now()));
  readonly options = computed(() => difficultTagOptions(this.list() ?? []));
  readonly activeKeys = computed(() => parseTagParam(this.etiquetas()));
  readonly filtered = computed(() => filterDifficultByTags(this.list() ?? [], this.activeKeys()));
  readonly reinforceParams = computed(() => ({ [TAG_PARAM]: serializeTagParam(this.activeKeys()) }));
  readonly reinforceCount = computed(() => Math.min(this.filtered().length, REINFORCE_LIMIT));
  readonly countLabel = computed(() => {
    const total = this.filtered().length;
    return `${total} ${total === 1 ? 'cartão difícil' : 'cartões difíceis'}`;
  });

  constructor() {
    let lastDeckId: string | undefined;
    effect(() => {
      const deckId = this.deckId();
      if (lastDeckId !== undefined && deckId !== lastDeckId) this.setKeys([]);
      lastDeckId = deckId;
    });
  }

  setKeys(keys: string[]): void {
    void this.router.navigate([], {
      queryParams: { [TAG_PARAM]: serializeTagParam(keys) },
      replaceUrl: true,
    });
  }

  edit(card: Card): void {
    this.editDialog().open(card);
  }
}
