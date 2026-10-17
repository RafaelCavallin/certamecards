import { IMAGES_PER_CARD_MAX } from './card-limits';

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;
const ACCOUNT_LIMIT_LABEL = 'de 1 GB';

function plural(count: number, singular: string, many: string): string {
  return count === 1 ? singular : many;
}

export function galleryCountLabel(count: number): string {
  return `${count} de ${IMAGES_PER_CARD_MAX} imagens`;
}

export function waitingImagesLabel(count: number): string {
  return `Aguardando ${count} ${plural(count, 'imagem', 'imagens')}`;
}

export function skippedFilesMessage(input: { accepted: number; skipped: number }): string {
  const { accepted, skipped } = input;
  if (accepted === 0) return `O limite é de ${IMAGES_PER_CARD_MAX} imagens por cartão.`;
  const fit = `${plural(accepted, 'Só cabia', 'Só cabiam')} mais ${accepted} ${plural(accepted, 'imagem', 'imagens')}`;
  return `${fit}; ${skipped} ${plural(skipped, 'ficou', 'ficaram')} de fora.`;
}

export function imageAlt(input: { caption: string; index: number; total: number }): string {
  return input.caption.trim() || `Imagem ${input.index + 1} de ${input.total} do cartão`;
}

export function formatMegabytes(bytes: number): string {
  if (bytes < BYTES_PER_MB) return `${Math.max(1, Math.round(bytes / BYTES_PER_KB))} KB`;
  const megabytes = (bytes / BYTES_PER_MB).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${megabytes} MB`;
}

export function imageUsageLabel(input: { count: number; bytes: number; withAccount: boolean }): string {
  if (input.count === 0) return 'Nenhuma imagem';
  const base = `${input.count} ${plural(input.count, 'imagem', 'imagens')} · ${formatMegabytes(input.bytes)}`;
  return input.withAccount ? `${base} ${ACCOUNT_LIMIT_LABEL}` : base;
}

export function pendingUploadsLabel(count: number): string {
  return `${count} ${plural(count, 'imagem aguardando', 'imagens aguardando')} envio`;
}
