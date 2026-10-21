import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardForm } from '../../ui/card-form/card-form';
import { CardInfo } from '../../ui/card-info/card-info';
import { ImagePrefetch } from '../../state/image-prefetch';
import { loadCardDraftState, type CardDraft, type DraftLoadState } from '../../domain/card-draft';
import { saveCardEdit } from '../../domain/card-save';
import { getCard } from '../../domain/cards';
import type { Card } from '../../domain/db';

@Component({
  selector: 'app-card-edit',
  imports: [CardForm, CardInfo],
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

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    await this.prefetch.request([this.cardId]);
    const state = await loadCardDraftState(this.cardId);
    this.loadState.set(state);
    if (state.status === 'ready') this.card.set(await getCard(this.cardId));
  }

  canLeave(): boolean | Promise<boolean> {
    return this.saved || (this.form()?.confirmDiscard() ?? true);
  }

  back(): void {
    this.location.back();
  }

  readonly save = async (draft: CardDraft): Promise<void> => {
    await saveCardEdit({ cardId: this.cardId, draft });
    this.saved = true;
    this.location.back();
  };
}
