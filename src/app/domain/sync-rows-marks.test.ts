import { describe, expect, it } from 'vitest';
import { FUTURE_MARKS, HIGHLIGHT_MARKS, LEGACY_MARKS } from '../../test/marks-fixtures';
import { makeTaggedCard } from '../../test/card-fixtures';
import { parseCardRow, toCardRow } from './sync-rows';

const SYNCED_AT = '2026-01-01T00:00:00Z';

function remoteRow(marks: unknown): unknown {
  return { ...toCardRow(makeTaggedCard('card-1', [])), marks, synced_at: SYNCED_AT };
}

describe('parseCardRow com marca-texto', () => {
  it('aceita highlight e preserva tipos e cores desconhecidos', () => {
    const result = parseCardRow(remoteRow(FUTURE_MARKS));

    expect(result?.row.marks).toMatchObject({
      version: 7,
      front: { highlight: [{ start: 0, end: 5, color: 'blue' }], strike: [{ start: 8, end: 12 }] },
    });
  });

  it('aceita o marca-texto das três cores nos três campos', () => {
    const result = parseCardRow(remoteRow(HIGHLIGHT_MARKS));

    expect(result?.row.marks).toEqual(HIGHLIGHT_MARKS);
  });

  it('aceita linha antiga sem highlight e completa a lista vazia', () => {
    const result = parseCardRow(remoteRow(LEGACY_MARKS));

    expect(result?.row.marks.front).toEqual({ cloze: [{ start: 15, end: 21 }], emphasis: [{ start: 2, end: 9 }], highlight: [] });
    expect(result?.row.marks.back.highlight).toEqual([]);
  });

  it('descarta só o highlight malformado, sem rejeitar o cartão', () => {
    const marks = { ...HIGHLIGHT_MARKS, front: { cloze: [], emphasis: [], highlight: [{ start: 0 }] } };

    const result = parseCardRow(remoteRow(marks));

    expect(result?.row.marks.front.highlight).toEqual([]);
    expect(result?.row.marks.back.highlight).toEqual([{ start: 0, end: 3, color: 'green' }]);
  });
});

describe('toCardRow com marca-texto', () => {
  it('envia highlight e chaves desconhecidas como estão', () => {
    const row = toCardRow(makeTaggedCard('card-1', [], { marks: FUTURE_MARKS })) as { marks: unknown };

    expect(row.marks).toEqual(FUTURE_MARKS);
  });

  it('envia o marca-texto das três cores', () => {
    const row = toCardRow(makeTaggedCard('card-1', [], { marks: HIGHLIGHT_MARKS })) as { marks: unknown };

    expect(row.marks).toEqual(HIGHLIGHT_MARKS);
  });
});
