export interface DirtyTable<T> {
  bulkGet(ids: string[]): Promise<(T | undefined)[]>;
  update(id: string, changes: object): Promise<number>;
}

const CHUNK_SIZE = 200;

export function chunk<T>(items: T[]): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += CHUNK_SIZE) chunks.push(items.slice(index, index + CHUNK_SIZE));
  return chunks;
}

export async function clearDirty<T extends { id: string; updatedAt: number }>(table: DirtyTable<T>, sent: T[]): Promise<void> {
  if (sent.length === 0) return;
  const current = await table.bulkGet(sent.map((row) => row.id));
  const unchanged = sent.filter((row, index) => current[index]?.updatedAt === row.updatedAt);
  await Promise.all(unchanged.map((row) => table.update(row.id, { dirty: 0 })));
}
