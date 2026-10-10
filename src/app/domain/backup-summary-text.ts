import { countLabel } from './anki-import-text';
import { countsLabels } from './backup-labels';
import type { RestorePlan, RestoreReport } from './backup-format';

export interface PlanText {
  label: string;
  hint: string;
}

const PLAN_TEXTS: Record<RestorePlan, PlanText> = {
  merge: {
    label: 'Mesclar com o que já está aqui',
    hint: 'Mantém o que for mais recente dos dois lados. Nada é apagado.',
  },
  replace: {
    label: 'Substituir tudo pelo backup',
    hint: 'Exclui os baralhos e cartões deste aparelho que não estão no arquivo, também nos outros aparelhos. O histórico de revisões é preservado.',
  },
};

const ITEM_KEPT = {
  one: 'item do aparelho foi mantido por ser mais recente',
  many: 'itens do aparelho foram mantidos por serem mais recentes',
};
const ITEM_REMOVED = {
  one: 'baralho ou cartão do aparelho foi excluído',
  many: 'baralhos e cartões do aparelho foram excluídos',
};
const ITEM_DISCARDED = {
  one: 'item do arquivo foi descartado por estar inválido',
  many: 'itens do arquivo foram descartados por estarem inválidos',
};

export function planText(plan: RestorePlan): PlanText {
  return PLAN_TEXTS[plan];
}

export function formatBackupDate(at: number): string {
  const date = new Date(at);
  const day = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} às ${time}`;
}

export function summaryLines(report: RestoreReport): string[] {
  const { keptLocal, removed, discarded } = report;
  const lines = [`Restaurado: ${countsLabels(report.applied).join(', ')}.`];
  if (keptLocal > 0) lines.push(`${countLabel(keptLocal, ITEM_KEPT.one, ITEM_KEPT.many)}.`);
  if (removed > 0) lines.push(`${countLabel(removed, ITEM_REMOVED.one, ITEM_REMOVED.many)}.`);
  if (discarded > 0) lines.push(`${countLabel(discarded, ITEM_DISCARDED.one, ITEM_DISCARDED.many)}.`);
  return lines;
}
