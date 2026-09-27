import { describe, expect, it } from 'vitest';
import { remapMarks, remapRanges } from './text-marks-remap';

const SENTENCE = 'O mandato e de quatro anos';
const MANDATO = { start: 2, end: 9 };
const QUATRO = { start: 15, end: 21 };

describe('remapRanges', () => {
  it('mantém as marcas ao digitar no fim da frase', () => {
    const after = `${SENTENCE} de mandato`;

    expect(remapRanges(SENTENCE, after, [MANDATO, QUATRO])).toEqual([MANDATO, QUATRO]);
  });

  it('empurra as marcas que vêm depois do trecho digitado', () => {
    const after = 'Antigamente, o mandato e de quatro anos';

    expect(remapRanges(SENTENCE, after, [MANDATO, QUATRO])).toEqual([
      { start: 15, end: 22 },
      { start: 28, end: 34 },
    ]);
  });

  it('descarta só a marca que o trecho apagado atravessa', () => {
    const after = 'O mand e de quatro anos';

    expect(remapRanges(SENTENCE, after, [MANDATO, QUATRO])).toEqual([{ start: 12, end: 18 }]);
  });

  it('preserva a marca colada no ponto da edição', () => {
    const after = 'O mandato! e de quatro anos';

    expect(remapRanges(SENTENCE, after, [MANDATO])).toEqual([MANDATO]);
  });

  it('descarta tudo quando o texto é trocado por completo', () => {
    expect(remapRanges(SENTENCE, 'Prazo diferente', [MANDATO, QUATRO])).toEqual([]);
  });

  it('devolve a mesma lista quando o texto não mudou', () => {
    expect(remapRanges(SENTENCE, SENTENCE, [QUATRO])).toEqual([QUATRO]);
    expect(remapRanges(SENTENCE, 'O mandato', [])).toEqual([]);
  });
});

describe('remapMarks', () => {
  it('remapeia lacunas e destaques na mesma passada', () => {
    const marks = { cloze: [QUATRO], emphasis: [MANDATO] };
    const after = 'Antigamente, o mandato e de quatro anos';

    expect(remapMarks(SENTENCE, after, marks)).toEqual({
      cloze: [{ start: 28, end: 34 }],
      emphasis: [{ start: 15, end: 22 }],
    });
  });
});
