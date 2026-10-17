import type { EntityTable } from 'dexie';

interface Trackable {
  dirty?: 0 | 1;
  deletedAt?: number;
}

/**
 * `dirty` é marcado aqui, não em cada ponto de escrita — depender de todo
 * call site lembrar é como essa marca apodrece. O apply do pull do sync
 * grava linhas remotas com `dirty: 0` explícito; o hook abaixo respeita isso
 * (não sobrescreve quando o caller já nomeou `dirty`). Campos só locais
 * (`localOnlyKeys`, como o `blobState` das imagens) não tornam a linha suja.
 */
export function trackDirty<T extends Trackable, K extends keyof T>(
  table: EntityTable<T, K>,
  hasDeletedAt: boolean,
  localOnlyKeys: readonly string[] = [],
): void {
  table.hook('creating', (_pk, obj) => {
    if (obj.dirty === undefined) obj.dirty = 1;
    if (hasDeletedAt && obj.deletedAt === undefined) obj.deletedAt = 0;
  });
  table.hook('updating', (mods) => {
    const changed = Object.keys(mods as object);
    if (changed.includes('dirty')) return undefined;
    if (changed.length > 0 && changed.every((key) => localOnlyKeys.includes(key))) return undefined;
    return { dirty: 1 };
  });
}
