import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { fileOf } from '../../test/backup-restore-helpers';
import { makeCard, makeContent, zipOfContent } from '../../test/backup-fixtures';
import { FUTURE_MARKS, HIGHLIGHT_MARKS, LEGACY_MARKS } from '../../test/marks-fixtures';
import { createBackup } from './backup-export';
import { readBackup, restoreBackup } from './backup-restore';
import { db } from './db';

afterEach(resetDb);

async function restoredMarks(marks: unknown): Promise<unknown> {
  const content = makeContent({ cards: [makeCard({ marks: marks as never })], images: [] });
  await restoreBackup({ preview: await readBackup(fileOf(zipOfContent(content))), plan: 'replace' });
  return (await db.cards.get('card-1'))?.marks;
}

describe('backup com marca-texto', () => {
  it('preserva o marca-texto das três cores depois de exportar, limpar e restaurar', async () => {
    await db.decks.add({ id: 'deck-1', name: 'D', newCardsPerDay: 20, youngLimit: 50, requestRetention: 0.9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0 });
    await db.cards.add(makeCard({ marks: HIGHLIGHT_MARKS }));
    const { blob } = await createBackup();
    await resetDb();

    await restoreBackup({ preview: await readBackup(blob), plan: 'replace' });

    expect((await db.cards.get('card-1'))?.marks).toEqual(HIGHLIGHT_MARKS);
  });

  it('restaura um backup anterior ao marca-texto sem marcar nada', async () => {
    const marks = await restoredMarks(LEGACY_MARKS);

    expect(marks).toEqual({
      front: { cloze: [{ start: 15, end: 21 }], emphasis: [{ start: 2, end: 9 }], highlight: [] },
      back: { cloze: [], emphasis: [], highlight: [] },
      notes: { cloze: [], emphasis: [], highlight: [] },
    });
  });

  it('preserva tipos e cores desconhecidos de um backup de versão futura', async () => {
    const marks = await restoredMarks(FUTURE_MARKS);

    expect(marks).toMatchObject({ version: 7, front: { highlight: [{ color: 'blue' }], strike: [{ start: 8, end: 12 }] } });
  });
});
