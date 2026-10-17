export interface ClipboardSnapshot {
  types: readonly string[];
  files: readonly File[];
}

const TEXT_TYPE = 'text/plain';
const IMAGE_TYPE_PREFIX = 'image/';

export function pastedImages(clipboard: ClipboardSnapshot): File[] {
  if (clipboard.types.includes(TEXT_TYPE)) return [];
  return clipboard.files.filter((file) => file.type.startsWith(IMAGE_TYPE_PREFIX));
}

export function filesFromList(list: FileList | null | undefined): File[] {
  return list ? Array.from(list) : [];
}
