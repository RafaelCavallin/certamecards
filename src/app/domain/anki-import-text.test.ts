import { describe, expect, it } from 'vitest';
import { cardsLabel, countLabel, duplicatesLine, duplicatesSummary, formatCount, notesLabel, progressMilestone, skippedEntries } from './anki-import-text';

describe('textos da importação', () => {
  it('formata números no padrão brasileiro', () => {
    expect(formatCount(1230)).toBe('1.230');
  });

  it('flexiona cartão e nota', () => {
    expect([cardsLabel(1), cardsLabel(1230), notesLabel(1), notesLabel(0)]).toEqual([
      '1 cartão',
      '1.230 cartões',
      '1 nota',
      '0 notas',
    ]);
  });

  it('lista só os motivos de pulo com notas, na ordem fixa', () => {
    const entries = skippedEntries({ 'empty-side': 3, 'too-long': 0, 'no-cloze': 0, 'unsupported-type': 10 });

    expect(entries).toEqual([
      { reason: 'empty-side', label: 'Frente ou Verso vazio', count: 3 },
      { reason: 'unsupported-type', label: 'Tipo não suportado', count: 10 },
    ]);
  });

  it('flexiona qualquer substantivo pelo número', () => {
    expect([countLabel(1, 'tipo de nota', 'tipos de nota'), countLabel(13, 'baralho', 'baralhos')]).toEqual([
      '1 tipo de nota',
      '13 baralhos',
    ]);
  });

  it('explica duplicatas conforme o destino seja novo ou existente', () => {
    expect(duplicatesLine(6, true)).toBe('6 cartões se repetem no arquivo e entram uma vez só.');
    expect(duplicatesLine(1, false)).toBe('1 cartão já existe neste baralho e não será criado de novo.');
  });

  it('resume duplicatas no fim conforme o destino', () => {
    expect(duplicatesSummary(6, true)).toBe('6 cartões repetidos no arquivo entraram uma vez só.');
    expect(duplicatesSummary(1, false)).toBe('1 cartão pulado porque já existia no baralho.');
  });

  it('arredonda o progresso para marcos de 25%', () => {
    expect([progressMilestone(0, 5000), progressMilestone(1300, 5000), progressMilestone(3200, 5000), progressMilestone(5000, 5000)]).toEqual([0, 25, 50, 100]);
  });

  it('não divide por zero', () => {
    expect(progressMilestone(0, 0)).toBe(0);
  });
});
