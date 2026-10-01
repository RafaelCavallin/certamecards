import { db } from './db';
import { listTagCatalog } from './tag-catalog';
import { normalizeTag, normalizeTags, tagKey, type TagSummary } from './tags';
import { TAG_MAX_LENGTH } from './card-limits';

export interface TagRenameInput {
  fromKey: string;
  newName: string;
}

export type TagRenamePlan =
  | { kind: 'rename'; fromKey: string; name: string }
  | { kind: 'merge'; fromKey: string; target: TagSummary; affected: number }
  | { kind: 'invalid'; reason: 'empty' | 'too-long' };

export interface TagBulkResult {
  updated: number;
}

export const TAG_INVALID_MESSAGES = {
  empty: 'Digite um nome para a etiqueta.',
  'too-long': `Etiquetas têm até ${TAG_MAX_LENGTH} caracteres.`,
};

export function planTagRename(catalog: readonly TagSummary[], input: TagRenameInput): TagRenamePlan {
  const name = normalizeTag(input.newName);
  if (name.length === 0) return { kind: 'invalid', reason: 'empty' };
  if (name.length > TAG_MAX_LENGTH) return { kind: 'invalid', reason: 'too-long' };
  const newKey = tagKey(name);
  const target = catalog.find((entry) => entry.key === newKey);
  const source = catalog.find((entry) => entry.key === input.fromKey);
  if (!target || newKey === input.fromKey) return { kind: 'rename', fromKey: input.fromKey, name };
  return { kind: 'merge', fromKey: input.fromKey, target, affected: source?.count ?? 0 };
}

export async function renameTag(input: TagRenameInput): Promise<TagBulkResult> {
  const plan = planTagRename(await listTagCatalog(), input);
  if (plan.kind === 'invalid') throw new Error(TAG_INVALID_MESSAGES[plan.reason]);
  const finalName = plan.kind === 'merge' ? plan.target.name : plan.name;
  return rewriteTags(input.fromKey, (tags) =>
    tags.map((tag) => (tagKey(tag) === input.fromKey ? finalName : tag)),
  );
}

export async function deleteTag(key: string): Promise<TagBulkResult> {
  return rewriteTags(key, (tags) => tags.filter((tag) => tagKey(tag) !== key));
}

async function rewriteTags(
  key: string,
  transform: (tags: string[]) => string[],
): Promise<TagBulkResult> {
  let updated = 0;
  await db.transaction('rw', db.cards, async () => {
    const now = Date.now();
    await db.cards
      .where('deletedAt')
      .equals(0)
      .filter((card) => card.tags.some((tag) => tagKey(tag) === key))
      .modify((card) => {
        card.tags = normalizeTags(transform(card.tags));
        card.updatedAt = now;
        updated += 1;
      });
  });
  return { updated };
}
