import { SKIP_REASON_LABELS, type SkipReason } from './anki-convert';

const NUMBER_LOCALE = 'pt-BR';
const MILESTONE_PERCENT = 25;
const FULL_PERCENT = 100;

export interface SkippedEntry {
  reason: SkipReason;
  label: string;
  count: number;
}

export function formatCount(value: number): string {
  return value.toLocaleString(NUMBER_LOCALE);
}

export function countLabel(count: number, singular: string, plural: string): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

export function cardsLabel(count: number): string {
  return countLabel(count, 'cartão', 'cartões');
}

export function notesLabel(count: number): string {
  return countLabel(count, 'nota', 'notas');
}

export function duplicatesLine(count: number, newDeck: boolean): string {
  const one = count === 1;
  if (newDeck) return `${cardsLabel(count)} se ${one ? 'repete' : 'repetem'} no arquivo e ${one ? 'entra' : 'entram'} uma vez só.`;
  return `${cardsLabel(count)} já ${one ? 'existe' : 'existem'} neste baralho e não ${one ? 'será criado' : 'serão criados'} de novo.`;
}

export function duplicatesSummary(count: number, newDeck: boolean): string {
  const one = count === 1;
  if (newDeck) return `${cardsLabel(count)} ${one ? 'repetido' : 'repetidos'} no arquivo ${one ? 'entrou' : 'entraram'} uma vez só.`;
  return `${cardsLabel(count)} ${one ? 'pulado porque já existia' : 'pulados porque já existiam'} no baralho.`;
}

export function skippedEntries(skipped: Readonly<Record<SkipReason, number>>): SkippedEntry[] {
  return (Object.keys(SKIP_REASON_LABELS) as SkipReason[])
    .filter((reason) => skipped[reason] > 0)
    .map((reason) => ({ reason, label: SKIP_REASON_LABELS[reason], count: skipped[reason] }));
}

export function progressMilestone(done: number, total: number): number {
  if (total <= 0) return 0;
  const percent = (done / total) * FULL_PERCENT;
  return Math.floor(percent / MILESTONE_PERCENT) * MILESTONE_PERCENT;
}
