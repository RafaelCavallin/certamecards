import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeCard, makeDeck } from '../../test/backup-fixtures';
import {
  ACCOUNT_NUDGE_DISMISSED_KEY,
  accountNudgeFacts,
  nudgeLevel,
  readDismissedLevel,
  shouldNudgeAccount,
  writeDismissedLevel,
} from './account-nudge';
import { db } from './db';
import type { KeyValueStorage } from './local-storage';

afterEach(resetDb);

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
}

function throwingStorage(): KeyValueStorage {
  return {
    getItem: () => {
      throw new DOMException('blocked', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('quota', 'QuotaExceededError');
    },
  };
}

describe('nudgeLevel', () => {
  it('sobe um nível em cada patamar de cartões', () => {
    expect(nudgeLevel({ cards: 24, decks: 1 })).toBe(0);
    expect(nudgeLevel({ cards: 25, decks: 1 })).toBe(1);
    expect(nudgeLevel({ cards: 49, decks: 1 })).toBe(1);
    expect(nudgeLevel({ cards: 50, decks: 1 })).toBe(2);
    expect(nudgeLevel({ cards: 69, decks: 1 })).toBe(2);
    expect(nudgeLevel({ cards: 70, decks: 1 })).toBe(3);
    expect(nudgeLevel({ cards: 500, decks: 1 })).toBe(3);
  });

  it('dois baralhos garantem o primeiro nível sem rebaixar os cartões', () => {
    expect(nudgeLevel({ cards: 0, decks: 2 })).toBe(1);
    expect(nudgeLevel({ cards: 50, decks: 3 })).toBe(2);
  });
});

describe('shouldNudgeAccount', () => {
  it('mostra quando o nível passou do dispensado', () => {
    expect(shouldNudgeAccount({ signedOut: true, level: 1, dismissedLevel: 0 })).toBe(true);
    expect(shouldNudgeAccount({ signedOut: true, level: 2, dismissedLevel: 1 })).toBe(true);
  });

  it('não mostra no nível já dispensado, sem nível ou fora de signed-out', () => {
    expect(shouldNudgeAccount({ signedOut: true, level: 1, dismissedLevel: 1 })).toBe(false);
    expect(shouldNudgeAccount({ signedOut: true, level: 0, dismissedLevel: 0 })).toBe(false);
    expect(shouldNudgeAccount({ signedOut: false, level: 3, dismissedLevel: 0 })).toBe(false);
  });
});

describe('accountNudgeFacts', () => {
  it('conta só cartões e baralhos vivos de todos os baralhos', async () => {
    await db.decks.bulkAdd([makeDeck(), makeDeck({ id: 'deck-2' }), makeDeck({ id: 'deck-3', deletedAt: 1 })]);
    await db.cards.bulkAdd([
      makeCard(),
      makeCard({ id: 'card-2', deckId: 'deck-2' }),
      makeCard({ id: 'card-3', deletedAt: 1 }),
    ]);

    const facts = await accountNudgeFacts();

    expect(facts).toEqual({ cards: 2, decks: 2 });
  });
});

describe('nível dispensado', () => {
  it('grava e lê o nível', () => {
    const storage = memoryStorage();

    writeDismissedLevel(storage, 2);

    expect(storage.data.get(ACCOUNT_NUDGE_DISMISSED_KEY)).toBe('2');
    expect(readDismissedLevel(storage)).toBe(2);
  });

  it('vale zero sem storage, sem valor, com valor inválido ou se o storage lança', () => {
    expect(readDismissedLevel(null)).toBe(0);
    expect(readDismissedLevel(memoryStorage())).toBe(0);
    expect(readDismissedLevel(memoryStorage({ [ACCOUNT_NUDGE_DISMISSED_KEY]: 'abc' }))).toBe(0);
    expect(readDismissedLevel(memoryStorage({ [ACCOUNT_NUDGE_DISMISSED_KEY]: '-1' }))).toBe(0);
    expect(readDismissedLevel(throwingStorage())).toBe(0);
  });

  it('não quebra se o storage lança ao gravar', () => {
    expect(() => writeDismissedLevel(throwingStorage(), 1)).not.toThrow();
  });
});
