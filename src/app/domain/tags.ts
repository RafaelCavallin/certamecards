import { TAGS_MAX, TAG_MAX_LENGTH } from './card-limits';

export const DIACRITICS_PATTERN = /[̀-ͯ]/g;

const TAG_SEPARATOR_PATTERN = /[,\n\r]+/;
const WHITESPACE_PATTERN = /\s+/g;

export interface TagSummary {
  key: string;
  name: string;
  count: number;
}

export type TagRejectReason = 'too-long' | 'limit';

export interface RejectedTag {
  tag: string;
  reason: TagRejectReason;
}

export interface TagInputRequest {
  raw: string;
  current: readonly string[];
  catalog: readonly TagSummary[];
}

export interface TagInputResult {
  kind: 'added' | 'unchanged';
  tags: string[];
  rejected: RejectedTag[];
}

const REJECTION_MESSAGES: Record<TagRejectReason, string> = {
  'too-long': `Etiquetas têm até ${TAG_MAX_LENGTH} caracteres.`,
  limit: `Limite de ${TAGS_MAX} etiquetas`,
};

export function tagRejectionMessage(reason: TagRejectReason): string {
  return REJECTION_MESSAGES[reason];
}

export function normalizeTag(raw: string): string {
  return raw.trim().replace(WHITESPACE_PATTERN, ' ');
}

export function tagKey(tag: string): string {
  const normalized = normalizeTag(tag);
  return normalized.normalize('NFD').replace(DIACRITICS_PATTERN, '').toLowerCase();
}

export function splitTagInput(raw: string): string[] {
  return raw
    .split(TAG_SEPARATOR_PATTERN)
    .map(normalizeTag)
    .filter((tag) => tag.length > 0);
}

export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = normalizeTag(raw);
    const key = tagKey(tag);
    if (tag.length === 0 || tag.length > TAG_MAX_LENGTH || seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result.slice(0, TAGS_MAX);
}

export function addTagInput(request: TagInputRequest): TagInputResult {
  const tags = [...request.current];
  const keys = new Set(tags.map(tagKey));
  const rejected: RejectedTag[] = [];
  for (const part of splitTagInput(request.raw)) {
    const key = tagKey(part);
    if (keys.has(key)) continue;
    const reason = rejectionFor(part, tags.length);
    if (reason) {
      rejected.push({ tag: part, reason });
      continue;
    }
    keys.add(key);
    tags.push(request.catalog.find((entry) => entry.key === key)?.name ?? part);
  }
  const kind = tags.length > request.current.length ? 'added' : 'unchanged';
  return { kind, tags, rejected };
}

function rejectionFor(tag: string, currentCount: number): TagRejectReason | null {
  if (tag.length > TAG_MAX_LENGTH) return 'too-long';
  return currentCount >= TAGS_MAX ? 'limit' : null;
}
