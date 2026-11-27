import type { Marks } from './text-marks';

function countLabel(count: number, singular: string, plural: string): string | null {
  if (count === 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}

function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

export function summarizeMarks(marks: Marks): string {
  const parts = [
    countLabel(marks.cloze.length, 'lacuna', 'lacunas'),
    countLabel(marks.emphasis.length, 'destaque', 'destaques'),
    countLabel((marks.highlight ?? []).length, 'marca-texto', 'marca-textos'),
  ];
  return joinParts(parts.filter((part): part is string => part !== null));
}

export function markHint(allowCloze: boolean): string {
  return allowCloze
    ? 'Selecione um trecho para ocultar, destacar ou marcar'
    : 'Selecione um trecho para destacar ou marcar';
}
