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

describe('trackDirty com campos só locais', () => {
  const localDb = new Dexie('dirty-tracking-local-test') as Dexie & { rows: EntityTable<Row & { state?: string }, 'id'> };
  localDb.version(1).stores({ rows: 'id' });
  trackDirty(localDb.rows, true, ['state']);

  afterEach(async () => {
    await localDb.rows.clear();
  });

  it('não suja a linha quando só o campo local muda', async () => {
    await localDb.rows.add({ id: 'a', state: 'x', dirty: 0 });

    await localDb.rows.update('a', { state: 'y' });

    expect(await localDb.rows.get('a')).toMatchObject({ state: 'y', dirty: 0 });
  });

  it('suja a linha quando um campo sincronizável muda junto com o local', async () => {
    await localDb.rows.add({ id: 'a', state: 'x', label: 'um', dirty: 0 });

    await localDb.rows.update('a', { state: 'y', label: 'dois' });

    expect((await localDb.rows.get('a'))?.dirty).toBe(1);
  });

  it('continua sujando a linha quando só um campo comum muda', async () => {
    await localDb.rows.add({ id: 'a', label: 'um', dirty: 0 });

    await localDb.rows.update('a', { label: 'dois' });

    expect((await localDb.rows.get('a'))?.dirty).toBe(1);
  });
});
