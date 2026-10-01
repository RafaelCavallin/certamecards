import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import type { CardDraft } from './anki-draft';
import { importDrafts, type ImportInput } from './anki-import';
import { db } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

afterEach(async () => {
  vi.restoreAllMocks();
  await resetDb();
});

function drafts(count: number, prefix = 'f'): CardDraft[] {
  return Array.from({ length: count }, (_, index) => ({
    front: `${prefix}${index}`, back: 'v', notes: '', marks: EMPTY_CARD_MARKS, tags: [], notetypeId: 'b',
  }));
}

function input(overrides: Partial<ImportInput>): ImportInput {
  return { drafts: drafts(3), target: { kind: 'new', name: 'Novo' }, signal: new AbortController().signal, onProgress: () => undefined, ...overrides };
}

describe('importDrafts — tudo ou nada', () => {
  it('não deixa cartão nem baralho quando uma gravação falha no meio', async () => {
    const realBulkAdd = db.cards.bulkAdd.bind(db.cards);
    let calls = 0;
    vi.spyOn(db.cards, 'bulkAdd').mockImplementation((...args: Parameters<typeof realBulkAdd>) => {
      calls += 1;
      return calls === 2 ? Promise.reject(new Error('cota estourada')) : realBulkAdd(...args);
    });

    await expect(importDrafts(input({ drafts: drafts(11), chunkSize: 5 }))).rejects.toThrow('cota estourada');

    expect(await db.cards.count()).toBe(0);
    expect(await db.decks.count()).toBe(0);
  });

  it('desfaz tudo quando o usuário cancela entre lotes', async () => {
    const controller = new AbortController();
    const onProgress = (done: number): void => {
      if (done === 5) controller.abort();
    };

    await expect(importDrafts(input({ drafts: drafts(11), chunkSize: 5, signal: controller.signal, onProgress }))).rejects.toMatchObject({
      code: 'cancelled',
    });

    expect(await db.cards.count()).toBe(0);
    expect(await db.decks.count()).toBe(0);
  });

  it('repetir depois de cancelar grava tudo uma vez só', async () => {
    const controller = new AbortController();
    controller.abort();
    await importDrafts(input({ drafts: drafts(30), signal: controller.signal })).catch(() => undefined);

    const outcome = await importDrafts(input({ drafts: drafts(30) }));

    expect(outcome.created).toBe(30);
    expect(await db.cards.count()).toBe(30);
  });
});
