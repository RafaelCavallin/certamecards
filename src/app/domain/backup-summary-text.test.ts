import { describe, expect, it } from 'vitest';
import { formatBackupDate, planText, summaryLines } from './backup-summary-text';

describe('formatBackupDate', () => {
  it('escreve data e hora locais em português', () => {
    expect(formatBackupDate(new Date(2026, 9, 1, 20, 15).getTime())).toBe('01/10/2026 às 20:15');
  });
});

describe('planText', () => {
  it('explica a consequência de cada plano', () => {
    expect(planText('merge').hint).toContain('Nada é apagado');
    expect(planText('replace').hint).toContain('Exclui os baralhos e cartões');
  });
});

describe('summaryLines', () => {
  const applied = { decks: 2, cards: 1230, reviewLogs: 300, images: 4 };

  it('mostra só o que foi aplicado quando não houve mais nada', () => {
    const lines = summaryLines({ applied, keptLocal: 0, removed: 0, discarded: 0 });

    expect(lines).toEqual(['Restaurado: 2 baralhos, 1.230 cartões, 300 revisões, 4 imagens.']);
  });

  it('acrescenta mantidos, excluídos e descartados, no singular e no plural', () => {
    const plural = summaryLines({ applied, keptLocal: 3, removed: 2, discarded: 5 });
    const singular = summaryLines({ applied, keptLocal: 1, removed: 1, discarded: 1 });

    expect(plural.slice(1)).toEqual([
      '3 itens do aparelho foram mantidos por serem mais recentes.',
      '2 baralhos e cartões do aparelho foram excluídos.',
      '5 itens do arquivo foram descartados por estarem inválidos.',
    ]);
    expect(singular.slice(1)).toEqual([
      '1 item do aparelho foi mantido por ser mais recente.',
      '1 baralho ou cartão do aparelho foi excluído.',
      '1 item do arquivo foi descartado por estar inválido.',
    ]);
  });
});
