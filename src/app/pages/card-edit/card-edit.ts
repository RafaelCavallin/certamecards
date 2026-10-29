import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardForm } from '../../ui/card-form/card-form';
import { CardInfo } from '../../ui/card-info/card-info';
import { DeckSelect } from '../../ui/deck-select/deck-select';
import { ImagePrefetch } from '../../state/image-prefetch';
import { loadCardDraftState, type CardDraft, type DraftLoadState } from '../../domain/card-draft';
import { saveCardEdit } from '../../domain/card-save';
import { getCard } from '../../domain/cards';
import type { Card } from '../../domain/db';

@Component({
  selector: 'app-card-edit',
  imports: [CardForm, CardInfo, DeckSelect],
  templateUrl: './card-edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEdit {
  private readonly location = inject(Location);
  private readonly prefetch = inject(ImagePrefetch);
  private readonly cardId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  private readonly form = viewChild(CardForm);
  private saved = false;

  readonly loadState = signal<DraftLoadState | undefined>(undefined);
  readonly card = signal<Card | undefined>(undefined);
  readonly deckId = signal('');
  readonly deckChanged = computed(() => {
    const card = this.card();
    return card !== undefined && card.deckId !== this.deckId();
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    await this.prefetch.request([this.cardId]);
    const state = await loadCardDraftState(this.cardId);
    this.loadState.set(state);
    if (state.status !== 'ready') return;
    const card = await getCard(this.cardId);
    this.card.set(card);
    this.deckId.set(card?.deckId ?? '');
  }

  canLeave(): boolean | Promise<boolean> {
    return this.saved || (this.form()?.confirmDiscard() ?? true);
  }

  back(): void {
    this.location.back();
  }

  readonly save = async (draft: CardDraft): Promise<void> => {
    await saveCardEdit({ cardId: this.cardId, draft, deckId: this.deckId() || undefined });
    this.saved = true;
    this.location.back();
  };
}
