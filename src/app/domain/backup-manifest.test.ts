import { describe, expect, it } from 'vitest';
import { BackupError } from './backup-errors';
import { BACKUP_VERSION } from './backup-format';
import { parseManifest } from './backup-manifest-read';
import { toManifest } from './backup-manifest-write';
import { BACKUP_NOW, makeCard, makeContent, makeDeck, makeImage, makeLog, makeSettings, manifestOf } from '../../test/backup-fixtures';
import { EMPTY_CARD_MARKS } from './text-marks';

const PATHS = new Set(['images/image-1.webp']);

function failureCode(action: () => unknown): string | null {
  try {
    action();
    return null;
  } catch (error: unknown) {
    return error instanceof BackupError ? error.code : 'other';
  }
}

describe('parseManifest — envelope', () => {
  it('aceita um manifesto válido e conta os registros', () => {
    const parsed = parseManifest(manifestOf(makeContent()), PATHS);

    expect(parsed).toMatchObject({ exportedAt: BACKUP_NOW, accountId: null, discarded: 0 });
    expect([parsed.decks.length, parsed.cards.length, parsed.reviewLogs.length, parsed.images.length]).toEqual([1, 1, 1, 1]);
  });

  it('recusa formato alheio como não sendo backup', () => {
    const code = failureCode(() => parseManifest({ ...manifestOf(makeContent()), format: 'lingo-backup' }, PATHS));

    expect(code).toBe('not-backup');
  });

  it('recusa versão de formato mais nova que a do app', () => {
    const code = failureCode(() => parseManifest({ ...manifestOf(makeContent()), version: BACKUP_VERSION + 1 }, PATHS));

    expect(code).toBe('newer-version');
  });

  it('recusa JSON que não é objeto e envelope incompleto', () => {
    expect(failureCode(() => parseManifest(null, PATHS))).toBe('not-backup');
    expect(failureCode(() => parseManifest({ format: 'certamecards-backup', version: 1 }, PATHS))).toBe('not-backup');
  });
});

describe('parseManifest — registros soltos', () => {
  it('descarta o cartão acima do limite e segue com os outros', () => {
    const big = makeCard({ id: 'big', front: 'x'.repeat(6000) });
    const content = makeContent({ cards: [makeCard(), big], reviewLogs: [], images: [] });

    const parsed = parseManifest(manifestOf(content), PATHS);

    expect(parsed.cards.map((card) => card.id)).toEqual(['card-1']);
    expect(parsed.discarded).toBe(1);
  });

  it('descarta registro malformado sem derrubar o arquivo', () => {
    const manifest = { ...manifestOf(makeContent()), cards: [{ id: 42 }, ...manifestOf(makeContent()).cards] };

    const parsed = parseManifest(manifest, PATHS);

    expect(parsed.cards).toHaveLength(1);
    expect(parsed.discarded).toBe(1);
  });

  it('conta como descartada a configuração inválida', () => {
    const manifest = { ...manifestOf(makeContent()), settings: { daily_goal: 'muito' } };

    const parsed = parseManifest(manifest, PATHS);

    expect(parsed.settings).toBeNull();
    expect(parsed.discarded).toBe(1);
  });

  it('remove lacuna do Verso e das Notas e mantém o resto do cartão', () => {
    const marks = { ...EMPTY_CARD_MARKS, back: { cloze: [{ start: 0, end: 3 }], emphasis: [{ start: 4, end: 6 }] } };
    const content = makeContent({ cards: [makeCard({ marks })], reviewLogs: [], images: [] });

    const parsed = parseManifest(manifestOf(content), PATHS);

    expect(parsed.cards[0].marks.back).toEqual({ cloze: [], emphasis: [{ start: 4, end: 6 }] });
    expect(parsed.cards[0].back).toBe('Art. 82, CF');
  });
});

describe('parseManifest — integridade dentro do arquivo', () => {
  it('descarta cartão sem baralho, revisão sem cartão e imagem de cartão excluído', () => {
    const content = makeContent({
      cards: [makeCard(), makeCard({ id: 'orphan', deckId: 'missing' }), makeCard({ id: 'gone', deletedAt: BACKUP_NOW })],
      reviewLogs: [makeLog(), makeLog({ id: 'log-2', cardId: 'orphan' }), makeLog({ id: 'log-3', deckId: 'missing' })],
      images: [makeImage({ id: 'image-1', cardId: 'gone' })],
    });

    const parsed = parseManifest(manifestOf(content), PATHS);

    expect(parsed.cards.map((card) => card.id)).toEqual(['card-1', 'gone']);
    expect(parsed.reviewLogs.map((log) => log.id)).toEqual(['log-1']);
    expect(parsed.images).toEqual([]);
    expect(parsed.discarded).toBe(4);
  });

  it('mantém revisão de cartão e baralho excluídos', () => {
    const content = makeContent({
      decks: [makeDeck({ deletedAt: BACKUP_NOW })],
      cards: [makeCard({ deletedAt: BACKUP_NOW })],
      images: [],
    });

    const parsed = parseManifest(manifestOf(content), PATHS);

    expect(parsed.reviewLogs).toHaveLength(1);
    expect(parsed.discarded).toBe(0);
  });
});

describe('parseManifest — imagens', () => {
  function discardedFor(image: Partial<ReturnType<typeof makeImage>>, paths = PATHS): number {
    const content = makeContent({ images: [makeImage(image)] });
    return parseManifest(manifestOf(content), paths).discarded;
  }

  it('aceita a imagem dentro das regras', () => {
    expect(discardedFor({})).toBe(0);
  });

  it('descarta imagem acima de 1,5 MB, legenda acima de 200 e entrada ausente no zip', () => {
    expect(discardedFor({ byteSize: 1_572_865 })).toBe(1);
    expect(discardedFor({ caption: 'x'.repeat(201) })).toBe(1);
    expect(discardedFor({}, new Set())).toBe(1);
  });

  it('descarta MIME fora da lista', () => {
    const manifest = manifestOf(makeContent());
    const images = manifest.images.map((image) => ({ ...image, mime_type: 'image/gif' }));

    expect(parseManifest({ ...manifest, images }, PATHS).discarded).toBe(1);
  });

  it('mantém só as 6 primeiras imagens do cartão por posição', () => {
    const images = Array.from({ length: 7 }, (_, index) => makeImage({ id: `img-${index}`, position: index }));
    const paths = new Set(images.map((image) => `images/${image.id}.webp`));

    const parsed = parseManifest(manifestOf(makeContent({ images })), paths);

    expect(parsed.images.map((image) => image.id)).toEqual(images.slice(0, 6).map((image) => image.id));
    expect(parsed.discarded).toBe(1);
  });
});

describe('toManifest → parseManifest', () => {
  it('é uma ida e volta exata, com dirty zerado', () => {
    const content = makeContent({ settings: makeSettings({ dailyGoal: null }) });

    const parsed = parseManifest(toManifest(content, { exportedAt: BACKUP_NOW, accountId: 'user-1' }), PATHS);

    expect(parsed.accountId).toBe('user-1');
    expect(parsed.decks).toEqual(content.decks);
    expect(parsed.cards).toEqual(content.cards);
    expect(parsed.reviewLogs).toEqual(content.reviewLogs);
    expect(parsed.settings).toEqual(content.settings);
    expect(parsed.images).toEqual([{ ...content.images[0], blobState: 'remote' }]);
    expect(parsed.imagePaths).toEqual({ 'image-1': 'images/image-1.webp' });
  });

  it('não leva estado de sincronização nem blobState nas linhas', () => {
    const manifest = manifestOf(makeContent({ cards: [makeCard({ dirty: 1 })] }));

    expect(JSON.stringify(manifest)).not.toMatch(/dirty|blobState|synced_at/);
  });
});
