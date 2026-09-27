import Dexie, { type EntityTable } from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { trackDirty } from './dirty-tracking';

interface Row {
  id: string;
  label?: string;
  dirty?: 0 | 1;
  deletedAt?: number;
}

const testDb = new Dexie('dirty-tracking-test') as Dexie & {
  withDeletedAt: EntityTable<Row, 'id'>;
  withoutDeletedAt: EntityTable<Row, 'id'>;
};
testDb.version(1).stores({ withDeletedAt: 'id', withoutDeletedAt: 'id' });
trackDirty(testDb.withDeletedAt, true);
trackDirty(testDb.withoutDeletedAt, false);

afterEach(async () => {
  await testDb.withDeletedAt.clear();
  await testDb.withoutDeletedAt.clear();
});

describe('trackDirty', () => {
  it('marca dirty e deletedAt ao criar sem os campos', async () => {
    await testDb.withDeletedAt.add({ id: 'a' } as Row);

    const row = (await testDb.withDeletedAt.get('a'))!;
    expect(row.dirty).toBe(1);
    expect(row.deletedAt).toBe(0);
  });

  it('não define deletedAt quando a tabela não tem essa coluna', async () => {
    await testDb.withoutDeletedAt.add({ id: 'a' } as Row);

    const row = (await testDb.withoutDeletedAt.get('a'))!;
    expect(row.deletedAt).toBeUndefined();
  });

  it('respeita o dirty informado pelo caller', async () => {
    await testDb.withDeletedAt.add({ id: 'a', dirty: 0, deletedAt: 0 });

    expect((await testDb.withDeletedAt.get('a'))!.dirty).toBe(0);
  });

  it('suja qualquer update que não nomeie dirty', async () => {
    await testDb.withDeletedAt.add({ id: 'a', dirty: 0, deletedAt: 0 });

    await testDb.withDeletedAt.update('a', { label: 'mudou' });

    expect((await testDb.withDeletedAt.get('a'))!.dirty).toBe(1);
  });

  it('não re-suja quando o update nomeia dirty explicitamente', async () => {
    await testDb.withDeletedAt.add({ id: 'a', dirty: 1, deletedAt: 0 });

    await testDb.withDeletedAt.update('a', { dirty: 0 });

    expect((await testDb.withDeletedAt.get('a'))!.dirty).toBe(0);
  });
});
