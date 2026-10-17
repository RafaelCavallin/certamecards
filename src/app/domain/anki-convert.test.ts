import { describe, expect, it } from 'vitest';
import { convertNote, type ConvertContext } from './anki-convert';
import type { AnkiNote, AnkiNotetype } from './anki-types';

const BASIC: AnkiNotetype = { id: 'b', name: 'Básico', fields: ['Frente', 'Verso', 'Extra'], kind: 'normal' };
const CLOZE: AnkiNotetype = { id: 'c', name: 'Lacuna', fields: ['Texto', 'Extra'], kind: 'cloze' };
const OCCLUSION: AnkiNotetype = { id: 'o', name: 'Oclusão', fields: ['Occlusion'], kind: 'image-occlusion' };
const CATALOG = new Map<string, string>();

function basicContext(notes: number | null = 2): ConvertContext {
  return { notetype: BASIC, mapping: { include: true, front: 0, back: 1, notes }, catalog: CATALOG };
}

function note(fields: string[], notetypeId = 'b', tags = ''): AnkiNote {
  return { notetypeId, fields, tags, deck: '' };
}

describe('convertNote', () => {
  it('gera um rascunho da nota básica com as Notas do campo mapeado', () => {
    const outcome = convertNote(note(['<b>vedado</b>', 'a<div>b</div>', 'comentário'], 'b', 'cespe'), basicContext());

    expect(outcome).toEqual({
      kind: 'cards',
      droppedTags: 0,
      drafts: [
        {
          front: 'vedado',
          back: 'a\nb',
          notes: 'comentário',
          marks: {
            front: { cloze: [], emphasis: [{ start: 0, end: 6 }] },
            back: { cloze: [], emphasis: [] },
            notes: { cloze: [], emphasis: [] },
          },
          tags: ['cespe'],
          notetypeId: 'b',
        },
      ],
    });
  });

  it('deixa as Notas vazias com o mapeamento “Nenhum”', () => {
    const outcome = convertNote(note(['f', 'v', 'extra']), basicContext(null));

    expect(outcome.kind === 'cards' && outcome.drafts[0].notes).toBe('');
  });

  it('gera um rascunho por número numa nota de lacuna, com Extra nas Notas', () => {
    const context: ConvertContext = { notetype: CLOZE, mapping: { include: true, front: 0, back: null, notes: 1 }, catalog: CATALOG };

    const outcome = convertNote(note(['A {{c1::União}} legisla {{c2::privativamente}}', 'Art. 22, CF'], 'c'), context);

    expect(outcome.kind === 'cards' && outcome.drafts.map((draft) => [draft.front, draft.notes])).toEqual([
      ['A União legisla privativamente', 'Art. 22, CF'],
      ['A União legisla privativamente', 'Art. 22, CF'],
    ]);
  });

  it('pula Frente acima de 5.000 caracteres', () => {
    expect(convertNote(note(['x'.repeat(6000), 'v']), basicContext())).toEqual({ kind: 'skip', reason: 'too-long' });
  });

  it('pula Verso só com imagem', () => {
    expect(convertNote(note(['f', '<img src="a.png">']), basicContext())).toEqual({ kind: 'skip', reason: 'empty-side' });
  });

  it('pula lacuna sem lacuna válida', () => {
    const context: ConvertContext = { notetype: CLOZE, mapping: { include: true, front: 0, back: null, notes: 1 }, catalog: CATALOG };

    expect(convertNote(note(['sem lacuna', ''], 'c'), context)).toEqual({ kind: 'skip', reason: 'no-cloze' });
  });

  it('pula tipo não suportado', () => {
    const context: ConvertContext = { notetype: OCCLUSION, mapping: { include: false, front: 0, back: null, notes: null }, catalog: CATALOG };

    expect(convertNote(note(['{{c1::image-occlusion:rect}}'], 'o'), context)).toEqual({ kind: 'skip', reason: 'unsupported-type' });
  });

  it('marca como excluída a nota de um tipo que o usuário desmarcou', () => {
    const context: ConvertContext = { ...basicContext(), mapping: { include: false, front: 0, back: 1, notes: null } };

    expect(convertNote(note(['f', 'v']), context)).toEqual({ kind: 'excluded' });
  });

  it('trata campo inexistente como vazio', () => {
    expect(convertNote(note(['só frente']), basicContext())).toEqual({ kind: 'skip', reason: 'empty-side' });
  });
});
