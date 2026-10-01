import { BACK_MAX, FRONT_MAX, NOTES_MAX } from './card-limits';
import { expandCloze, markClozes } from './anki-cloze';
import { htmlToMarkedText } from './anki-html';
import { classifyNotetype, type FieldMapping } from './anki-mapping';
import { importTags } from './anki-tags';
import type { AnkiNote, AnkiNotetype } from './anki-types';
import { asSide, emptyField, toDraft, type CardDraft, type Side } from './anki-draft';

export type { CardDraft } from './anki-draft';

export type SkipReason = 'empty-side' | 'too-long' | 'no-cloze' | 'unsupported-type';

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  'empty-side': 'Frente ou Verso vazio',
  'too-long': 'Texto acima do limite',
  'no-cloze': 'Lacuna sem lacuna válida',
  'unsupported-type': 'Tipo não suportado',
};

export interface ConvertContext {
  notetype: AnkiNotetype | undefined;
  mapping: FieldMapping | undefined;
  catalog: ReadonlyMap<string, string>;
}

export type NoteOutcome =
  | { kind: 'cards'; drafts: CardDraft[]; droppedTags: number }
  | { kind: 'skip'; reason: SkipReason }
  | { kind: 'excluded' };

export function convertNote(note: AnkiNote, context: ConvertContext): NoteOutcome {
  const { notetype, mapping } = context;
  if (!notetype || !mapping || classifyNotetype(notetype) === 'unsupported') return skip('unsupported-type');
  if (!mapping.include) return { kind: 'excluded' };
  const pairs = classifyNotetype(notetype) === 'cloze' ? clozePairs(note, mapping) : [basicPair(note, mapping)];
  if (pairs.length === 0) return skip('no-cloze');
  const notes = mapping.notes === null ? emptyField() : htmlToMarkedText(note.fields[mapping.notes] ?? '');
  const tags = importTags(note.tags, context.catalog);
  const drafts = pairs.map(([front, back]) => toDraft({ front, back, notes, tags: tags.tags, notetypeId: notetype.id }));
  const problem = drafts.map(problemOf).find((reason) => reason !== null);
  return problem ? skip(problem) : { kind: 'cards', drafts, droppedTags: tags.dropped };
}

function clozePairs(note: AnkiNote, mapping: FieldMapping): [Side, Side][] {
  const parsed = htmlToMarkedText(markClozes(note.fields[mapping.front] ?? ''));
  return expandCloze(parsed).map((side) => [side.front, side.back]);
}

function basicPair(note: AnkiNote, mapping: FieldMapping): [Side, Side] {
  const front = htmlToMarkedText(note.fields[mapping.front] ?? '');
  const back = htmlToMarkedText(note.fields[mapping.back ?? mapping.front] ?? '');
  return [asSide(front), asSide(back)];
}

function problemOf(draft: CardDraft): SkipReason | null {
  if (draft.front.length === 0 || draft.back.length === 0) return 'empty-side';
  const tooLong = draft.front.length > FRONT_MAX || draft.back.length > BACK_MAX || draft.notes.length > NOTES_MAX;
  return tooLong ? 'too-long' : null;
}

function skip(reason: SkipReason): NoteOutcome {
  return { kind: 'skip', reason };
}
