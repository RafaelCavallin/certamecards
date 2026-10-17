export const IMAGE_BUCKET = 'card-images';

export function imagePath(userId: string, imageId: string): string {
  return `${userId}/${imageId}`;
}

export function isDuplicateUpload(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { status, statusCode, message } = error as { status?: unknown; statusCode?: unknown; message?: unknown };
  const duplicateMessage = typeof message === 'string' && /duplicate|already exists/i.test(message);
  return status === 409 || statusCode === '409' || duplicateMessage;
}

export function errorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) return 'desconhecido';
  const { code, statusCode, status } = error as { code?: unknown; statusCode?: unknown; status?: unknown };
  return String(code ?? statusCode ?? status ?? 'sem código');
}

export function warnImage(info: { phase: string; ids: string[]; error: unknown }): void {
  console.warn(`image-sync: ${info.phase} falhou (${errorCode(info.error)})`, { ids: info.ids });
}
