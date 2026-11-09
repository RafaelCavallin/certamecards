import { newCardRecord, type CardContent } from './cards';
import type { Card } from './db';

export const PREVIEW_CARD_ID = 'preview';

/** Cartão descartável para a prévia do formulário: id fixo, nunca gravado. */
export function previewCard(content: CardContent): Card {
  return { ...newCardRecord({ ...content, deckId: '' }, 0), id: PREVIEW_CARD_ID };
}
