import { Service, computed, effect, inject, signal } from '@angular/core';
import { createDeck, deleteDeck, ensureDefaultDeck, renameDeck } from '../domain/decks';
import { db, type Deck } from '../domain/db';
import { totalQueueCount } from '../domain/queue';
import { DueTick } from './due-tick';
import { liveQuerySignal } from './live-query';

const ACTIVE_DECK_KEY = 'certamecards.activeDeck';

function readStoredActiveDeckId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_DECK_KEY);
  } catch {
    return null;
  }
}

function storeActiveDeckId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_DECK_KEY, id);
  } catch {
    /* armazenamento indisponível (modo privado, quota) — segue só na sessão */
  }
}

function resolveActiveDeck(decks: Deck[] | undefined, activeId: string | null): Deck | null | undefined {
  if (!decks) return undefined;
  return decks.find((deck) => deck.id === activeId) ?? decks[0] ?? null;
}

/** Lista de baralhos e o baralho ativo, com escrita delegada a `domain/decks.ts`. */
@Service()
export class DeckStore {
  private readonly dueTick = inject(DueTick);
  private readonly seeded: Promise<Deck | null> = ensureDefaultDeck();

  readonly decks = liveQuerySignal(() => db.decks.filter((deck) => deck.deletedAt === 0).sortBy('createdAt'));

  private readonly activeDeckIdSignal = signal<string | null>(readStoredActiveDeckId());
  readonly deck = computed(() => resolveActiveDeck(this.decks(), this.activeDeckIdSignal()));

  private readonly totalDueSignal = signal<number | undefined>(undefined);
  readonly totalDue = this.totalDueSignal.asReadonly();

  constructor() {
    effect(() => {
      const decks = this.decks();
      this.dueTick.tick();
      if (!decks) return;
      void totalQueueCount(decks).then((count) => this.totalDueSignal.set(count));
    });
  }

  switchDeck(id: string): void {
    this.activeDeckIdSignal.set(id);
    storeActiveDeckId(id);
  }

  /** Cria e já ativa o baralho — a importação (Fase 2) precisa do id para gravar nele. */
  async createDeck(name: string): Promise<Deck> {
    const deck = await createDeck(name);
    this.switchDeck(deck.id);
    return deck;
  }

  async renameDeck(id: string, name: string): Promise<void> {
    await renameDeck(id, name);
  }

  /** Se o baralho excluído era o ativo, escolhe outro entre os que sobraram. */
  async removeDeck(id: string): Promise<void> {
    const remaining = (this.decks() ?? []).filter((deck) => deck.id !== id);
    await deleteDeck(id);
    if (this.activeDeckIdSignal() === id) {
      const next = remaining[0]?.id ?? null;
      if (next) this.switchDeck(next);
    }
  }

  /** Baralhos vivos, garantidos após o baralho padrão ter sido semeado — para os guards de rota. */
  async ready(): Promise<Deck[]> {
    await this.seeded;
    return db.decks.filter((deck) => deck.deletedAt === 0).sortBy('createdAt');
  }
}
