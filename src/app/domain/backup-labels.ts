import type { BackupCounts, RestorePlan } from './backup-format';
import { formatMegabytes } from './image-labels';

const DAY_MS = 86_400_000;

export interface RestoreConfirmation {
  warnings: string[];
  action: string;
}

const ACCOUNT_WARNING =
  'Este backup foi gerado em outra conta. Os dados vão se misturar com os da conta atual, neste aparelho e em todos os outros ligados a ela.';

const REPLACE_WARNING =
  'Os baralhos e cartões deste aparelho que não estão no arquivo serão excluídos, também nos seus outros aparelhos. Um backup do estado atual será baixado antes.';

function plural(count: number, singular: string, many: string): string {
  return count === 1 ? singular : many;
}

function count(value: number, singular: string, many: string): string {
  return `${value.toLocaleString('pt-BR')} ${plural(value, singular, many)}`;
}

export function lastBackupLabel(lastBackupAt: number | null, now: number): string {
  if (lastBackupAt === null) return 'Nenhum backup feito neste aparelho';
  const days = Math.floor((now - lastBackupAt) / DAY_MS);
  return days < 1 ? 'Último backup: hoje' : `Último backup: há ${count(days, 'dia', 'dias')}`;
}

export function estimateLabel(bytes: number): string {
  return `arquivo estimado: ${formatMegabytes(bytes)}`;
}

export function missingImagesLabel(missing: number): string {
  if (missing === 1) return '1 imagem não estava neste aparelho e ficou de fora do backup';
  return `${missing.toLocaleString('pt-BR')} imagens não estavam neste aparelho e ficaram de fora do backup`;
}

export function countsLabels(counts: BackupCounts): string[] {
  return [
    count(counts.decks, 'baralho', 'baralhos'),
    count(counts.cards, 'cartão', 'cartões'),
    count(counts.reviewLogs, 'revisão', 'revisões'),
    count(counts.images, 'imagem', 'imagens'),
  ];
}

export function confirmationFor(input: { plan: RestorePlan; accountMismatch: boolean }): RestoreConfirmation | null {
  const warnings = [input.accountMismatch && ACCOUNT_WARNING, input.plan === 'replace' && REPLACE_WARNING].filter(
    (warning): warning is string => Boolean(warning),
  );
  if (warnings.length === 0) return null;
  return { warnings, action: input.plan === 'replace' ? 'Sim, substituir tudo' : 'Sim, restaurar mesmo assim' };
}
