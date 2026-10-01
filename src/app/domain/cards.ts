import { createEmptyCard } from 'ts-fsrs';
import { db, uid, type Card } from './db';
import { normalizeTags } from './tags';
import { normalizeCardMarks } from './text-marks-normalize';
import type { CardMarks } from './text-marks';

export interface CardContent {
  front: string;
  back: string;
  notes: string;
  marks: CardMarks;
  tags: string[];
}

export interface NewCardInput extends CardContent {
  deckId: string;
}

/** Cartões vivos de um baralho. Ponto único de leitura — nenhum outro lugar filtra `deletedAt`. */
export function liveCards(deckId: string) {
  return db.cards.where('[deckId+deletedAt]').equals([deckId, 0]);
}

export async function getCard(cardId: string): Promise<Card | undefined> {
  return db.cards.get(cardId);
}

export async function createCard(input: NewCardInput): Promise<Card> {
  const empty = createEmptyCard(new Date());
  const now = Date.now();
  const card: Card = {
    id: uid(),
    deckId: input.deckId,
    front: input.front.trim(),
    back: input.back.trim(),
    notes: input.notes.trim(),
    marks: normalizeCardMarks(input.marks),
    tags: normalizeTags(input.tags),
    due: empty.due.getTime(),
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsedDays: empty.elapsed_days,
    scheduledDays: empty.scheduled_days,
    learningSteps: 0,
    reps: empty.reps,
    lapses: empty.lapses,
    state: empty.state,
    createdAt: now,
    updatedAt: now,
    deletedAt: 0,
    dirty: 1,
  };
  await db.cards.add(card);
  return card;
}

/**
 * Edita só o conteúdo do cartão — os campos FSRS são território exclusivo do
 * scheduler: editar o texto não é uma resposta e não pode reagendar nem
 * gerar log de revisão.
 */
export async function updateCardContent(cardId: string, content: CardContent): Promise<CardContent> {
  const saved: CardContent = {
    front: content.front.trim(),
    back: content.back.trim(),
    notes: content.notes.trim(),
    marks: normalizeCardMarks(content.marks),
    tags: normalizeTags(content.tags),
  };
  await db.cards.update(cardId, { ...saved, updatedAt: Date.now() });
  return saved;
}

export async function deleteCards(cardIds: string[]): Promise<void> {
  const now = Date.now();
  await db.cards.where('id').anyOf(cardIds).modify({ deletedAt: now, updatedAt: now });
}
