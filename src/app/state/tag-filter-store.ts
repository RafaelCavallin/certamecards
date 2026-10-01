import { Service, inject, signal } from '@angular/core';
import { DeckStore } from './deck-store';
import {
  parseStudyTags,
  reconcileStudyTags,
  removeStudyTag,
  renameStudyTag,
  type StudyTagsByDeck,
} from '../domain/study-tags';

const STUDY_TAGS_KEY = 'certamecards.studyTags';

function readStored(): string | null {
  try {
    return localStorage.getItem(STUDY_TAGS_KEY);
  } catch {
    return null;
  }
}

function writeStored(map: StudyTagsByDeck): void {
  try {
    localStorage.setItem(STUDY_TAGS_KEY, JSON.stringify(map));
  } catch {
    /* armazenamento indisponível — o filtro vale só até fechar a página */
  }
}

@Service()
export class TagFilterStore {
  private readonly deckStore = inject(DeckStore);
  private readonly map = signal<StudyTagsByDeck>(parseStudyTags(readStored()));

  keysFor(deckId: string): string[] {
    return this.map()[deckId] ?? [];
  }

  set(deckId: string, keys: string[]): void {
    this.update({ ...this.map(), [deckId]: keys });
  }

  clear(deckId: string): void {
    this.set(deckId, []);
  }

  reconcile(deckId: string, existing: ReadonlySet<string>): void {
    const current = this.keysFor(deckId);
    const kept = reconcileStudyTags(current, existing);
    if (kept.length !== current.length) this.set(deckId, kept);
  }

  applyRename(fromKey: string, toKey: string): void {
    this.update(renameStudyTag(this.map(), fromKey, toKey));
  }

  applyDelete(key: string): void {
    this.update(removeStudyTag(this.map(), key));
  }

  private update(next: StudyTagsByDeck): void {
    const liveIds = new Set((this.deckStore.decks() ?? []).map((deck) => deck.id));
    const pruned = liveIds.size === 0 ? next : this.keepLive(next, liveIds);
    this.map.set(pruned);
    writeStored(pruned);
  }

  private keepLive(map: StudyTagsByDeck, liveIds: ReadonlySet<string>): StudyTagsByDeck {
    return Object.fromEntries(Object.entries(map).filter(([deckId]) => liveIds.has(deckId)));
  }
}
