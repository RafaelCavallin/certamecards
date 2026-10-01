import { convertNote, type CardDraft, type SkipReason } from './anki-convert';
import { AnkiImportError } from './anki-errors';
import type { FieldMapping } from './anki-mapping';
import type { AnkiNote, AnkiNotetype } from './anki-types';

export const CONVERT_CHUNK_SIZE = 500;
export const PREVIEW_SIZE = 3;

export interface ConversionResult {
  drafts: CardDraft[];
  skipped: Record<SkipReason, number>;
  droppedTags: number;
}

export interface ConversionSetup {
  notetypes: readonly AnkiNotetype[];
  mappings: Readonly<Record<string, FieldMapping>>;
  catalog: ReadonlyMap<string, string>;
}

export interface ConvertInput {
  notes: readonly AnkiNote[];
  setup: ConversionSetup;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
}

export function emptyConversion(): ConversionResult {
  return { drafts: [], skipped: { 'empty-side': 0, 'too-long': 0, 'no-cloze': 0, 'unsupported-type': 0 }, droppedTags: 0 };
}

export async function convertNotes(input: ConvertInput): Promise<ConversionResult> {
  const result = emptyConversion();
  const convert = converterFor(input.setup);
  for (let start = 0; start < input.notes.length; start += CONVERT_CHUNK_SIZE) {
    if (input.signal?.aborted) throw new AnkiImportError('cancelled');
    input.notes.slice(start, start + CONVERT_CHUNK_SIZE).forEach((note) => collect(result, convert(note)));
    input.onProgress?.(Math.min(start + CONVERT_CHUNK_SIZE, input.notes.length), input.notes.length);
    await yieldToUi();
  }
  return result;
}

export function previewDrafts(notes: readonly AnkiNote[], setup: ConversionSetup): CardDraft[] {
  const convert = converterFor(setup);
  const drafts: CardDraft[] = [];
  for (const note of notes) {
    const outcome = convert(note);
    if (outcome.kind === 'cards') drafts.push(...outcome.drafts);
    if (drafts.length >= PREVIEW_SIZE) break;
  }
  return drafts.slice(0, PREVIEW_SIZE);
}

export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function converterFor(setup: ConversionSetup): (note: AnkiNote) => ReturnType<typeof convertNote> {
  const notetypes = new Map(setup.notetypes.map((notetype) => [notetype.id, notetype]));
  return (note) =>
    convertNote(note, {
      notetype: notetypes.get(note.notetypeId),
      mapping: setup.mappings[note.notetypeId],
      catalog: setup.catalog,
    });
}

function collect(result: ConversionResult, outcome: ReturnType<typeof convertNote>): void {
  if (outcome.kind === 'skip') result.skipped[outcome.reason] += 1;
  if (outcome.kind !== 'cards') return;
  result.drafts.push(...outcome.drafts);
  result.droppedTags += outcome.droppedTags;
}
