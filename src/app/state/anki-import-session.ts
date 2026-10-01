import { Injectable, computed, inject, signal } from '@angular/core';
import { DeckStore } from './deck-store';
import { AnkiImportRun } from './anki-import-run';
import { convertNotes, type ConversionSetup } from '../domain/anki-convert-batch';
import { ankiErrorMessage, isAnkiError } from '../domain/anki-errors';
import type { ImportTarget } from '../domain/anki-import';
import { suggestMapping, type FieldMapping } from '../domain/anki-mapping';
import { readAnkiFile, type AnkiReader } from '../domain/anki-reader';
import {
  countPlannedCards,
  notetypesInSelection,
  selectedNotes,
  suggestDeckName,
  summarizeSourceDecks,
  toggleMember,
} from '../domain/anki-selection';
import { previousStep, stepAfterReading, type ImportStep } from '../domain/anki-steps';
import { catalogByKey } from '../domain/anki-tags';
import type { AnkiCollection } from '../domain/anki-types';
import { listTagCatalog } from '../domain/tag-catalog';
const READ_FAILURE = 'Não foi possível ler o arquivo.';
const EMPTY_COLLECTION: AnkiCollection = { fileName: '', notetypes: [], notes: [] };

@Injectable()
export class AnkiImportSession {
  readonly run = inject(AnkiImportRun);
  private readonly deckStore = inject(DeckStore);
  private readonly stepSignal = signal<ImportStep>('file');
  private readonly catalog = signal<ReadonlyMap<string, string>>(new Map());

  readonly step = computed(() => this.run.step() ?? this.stepSignal());
  readonly error = signal<string | null>(null);
  readonly collection = signal<AnkiCollection | null>(null);
  readonly decks = signal<ReadonlySet<string>>(new Set());
  readonly mappings = signal<Readonly<Record<string, FieldMapping>>>({});

  private readonly current = computed(() => this.collection() ?? EMPTY_COLLECTION);
  readonly selected = computed(() => selectedNotes(this.current(), this.decks()));
  readonly sourceDecks = computed(() => summarizeSourceDecks(this.current()));
  readonly notetypes = computed(() => notetypesInSelection(this.current(), this.decks()));
  readonly plannedCards = computed(() =>
    countPlannedCards({ collection: this.current(), decks: this.decks(), mappings: this.mappings() }),
  );
  readonly suggestedDeckName = computed(() => suggestDeckName({ fileName: this.current().fileName, decks: [...this.decks()] }));
  readonly setup = computed<ConversionSetup>(() => ({
    notetypes: this.collection()?.notetypes ?? [],
    mappings: this.mappings(),
    catalog: this.catalog(),
  }));

  async readFile(file: File, reader: AnkiReader): Promise<void> {
    this.error.set(null);
    this.stepSignal.set('reading');
    try {
      const collection = await readAnkiFile(file, reader);
      this.collection.set(collection);
      this.decks.set(new Set(collection.notes.map((note) => note.deck)));
      this.mappings.set(Object.fromEntries(collection.notetypes.map((type) => [type.id, suggestMapping(type)])));
      this.catalog.set(catalogByKey(await listTagCatalog()));
      this.stepSignal.set(stepAfterReading(this.sourceDecks().length));
    } catch (error: unknown) {
      this.error.set(isAnkiError(error) ? ankiErrorMessage(error.code) : READ_FAILURE);
      this.stepSignal.set('file');
    }
  }

  toggleDeck(name: string): void {
    this.decks.update((decks) => toggleMember(decks, name));
  }

  setAllDecks(checked: boolean): void {
    this.decks.set(new Set(checked ? this.sourceDecks().map((deck) => deck.name) : []));
  }

  setMapping(notetypeId: string, mapping: FieldMapping): void {
    this.mappings.update((mappings) => ({ ...mappings, [notetypeId]: mapping }));
  }

  async goToTarget(): Promise<void> {
    this.stepSignal.set('preparing');
    const conversion = await convertNotes({ notes: this.selected(), setup: this.setup() });
    await this.run.prepare(conversion, this.defaultTarget());
    this.stepSignal.set('target');
  }

  show(step: ImportStep): void {
    this.stepSignal.set(step);
  }

  back(): void {
    this.error.set(null);
    this.stepSignal.set(previousStep(this.step(), this.sourceDecks().length));
  }

  private defaultTarget(): ImportTarget {
    const deckId = this.deckStore.deck()?.id;
    return deckId ? { kind: 'existing', deckId } : { kind: 'new', name: this.suggestedDeckName() };
  }
}
