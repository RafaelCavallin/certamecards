import { galleryImages } from './card-images';
import { getCard, type CardContent } from './cards';
import { normalizeCardContent, sameCardContent } from './card-content';
import { normalizeCaption, type GalleryItem } from './gallery-draft';
import { EMPTY_CARD_MARKS } from './text-marks';

export interface CardDraft {
  content: CardContent;
  gallery: GalleryItem[];
}

export type DraftLoadState = { status: 'ready'; draft: CardDraft } | { status: 'missing' } | { status: 'failed' };

export function emptyDraft(): CardDraft {
  return { content: { front: '', back: '', notes: '', marks: EMPTY_CARD_MARKS, tags: [] }, gallery: [] };
}

export async function loadCardDraft(cardId: string): Promise<CardDraft | null> {
  const card = await getCard(cardId);
  if (!card) return null;
  const images = await galleryImages(cardId);
  const gallery = images.map(({ image, blob }): GalleryItem => ({ id: image.id, origin: 'saved', blob, caption: image.caption }));
  return { content: { front: card.front, back: card.back, notes: card.notes, marks: card.marks, tags: card.tags }, gallery };
}

export async function loadCardDraftState(cardId: string): Promise<DraftLoadState> {
  try {
    const draft = await loadCardDraft(cardId);
    return draft ? { status: 'ready', draft } : { status: 'missing' };
  } catch (error: unknown) {
    console.error('Falha ao ler o cartão para edição.', error);
    return { status: 'failed' };
  }
}

function gallerySignature(gallery: GalleryItem[]): string {
  return gallery.map((item) => `${item.id}|${normalizeCaption(item.caption)}`).join('\n');
}

export function hasDraftChanges(initial: CardDraft, current: CardDraft): boolean {
  const unchangedText = sameCardContent(normalizeCardContent(initial.content), normalizeCardContent(current.content));
  return !unchangedText || gallerySignature(initial.gallery) !== gallerySignature(current.gallery);
}
