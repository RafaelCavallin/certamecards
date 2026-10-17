export const TAG_ROW_BUDGET = 36;
const CHIP_PADDING_CHARS = 2;

export interface VisibleTagChips {
  shown: string[];
  hiddenCount: number;
}

export function visibleTagChips(tags: readonly string[], budget: number): VisibleTagChips {
  const shown: string[] = [];
  let used = 0;
  for (const tag of tags) {
    used += tag.length + CHIP_PADDING_CHARS;
    if (shown.length > 0 && used > budget) break;
    shown.push(tag);
  }
  return { shown, hiddenCount: tags.length - shown.length };
}
