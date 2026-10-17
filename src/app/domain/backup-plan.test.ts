import { describe, expect, it } from 'vitest';
import { selectBlobFills, selectOrphans, selectWinners } from './backup-plan';
import { makeImage } from '../../test/backup-fixtures';

interface Row {
  id: string;
  updatedAt: number;
}

describe('selectWinners', () => {
  it('mantém o mais novo e deixa o local mais novo de fora', () => {
    const incoming: Row[] = [{ id: 'a', updatedAt: 10 }, { id: 'b', updatedAt: 5 }];
    const local: (Row | undefined)[] = [{ id: 'a', updatedAt: 5 }, { id: 'b', updatedAt: 10 }];

    expect(selectWinners({ incoming, local })).toEqual([{ id: 'a', updatedAt: 10 }]);
  });

  it('desempata pelo id quando o updatedAt é igual', () => {
    const incoming: Row[] = [{ id: 'b', updatedAt: 7 }];

    expect(selectWinners({ incoming, local: [{ id: 'a', updatedAt: 7 }] })).toEqual(incoming);
    expect(selectWinners({ incoming: [{ id: 'a', updatedAt: 7 }], local: [{ id: 'b', updatedAt: 7 }] })).toEqual([]);
  });

  it('o que não existe no aparelho sempre vence', () => {
    const incoming: Row[] = [{ id: 'novo', updatedAt: 1 }];

    expect(selectWinners({ incoming, local: [undefined] })).toEqual(incoming);
  });
});

describe('selectOrphans', () => {
  it('lista só os ids locais que o arquivo não conhece', () => {
    expect(selectOrphans({ localIds: ['a', 'b', 'c'], incomingIds: ['b'] })).toEqual(['a', 'c']);
  });

  it('com o arquivo vazio, todos os locais são órfãos', () => {
    expect(selectOrphans({ localIds: ['a', 'b'], incomingIds: [] })).toEqual(['a', 'b']);
  });

  it('sem locais, não há órfãos', () => {
    expect(selectOrphans({ localIds: [], incomingIds: ['a'] })).toEqual([]);
  });
});

describe('selectBlobFills', () => {
  const incoming = makeImage({ id: 'i1', updatedAt: 5 });
  const newerLocal = makeImage({ id: 'i1', updatedAt: 9, blobState: 'remote' });

  it('preenche a imagem local mais nova que ficou sem arquivo', () => {
    const ids = selectBlobFills({ incoming: [incoming], local: [newerLocal], storedBlobIds: new Set() });

    expect(ids).toEqual(['i1']);
  });

  it('ignora a que já tem arquivo, a inexistente, a excluída e a que o arquivo vence', () => {
    expect(selectBlobFills({ incoming: [incoming], local: [newerLocal], storedBlobIds: new Set(['i1']) })).toEqual([]);
    expect(selectBlobFills({ incoming: [incoming], local: [undefined], storedBlobIds: new Set() })).toEqual([]);
    expect(selectBlobFills({ incoming: [incoming], local: [{ ...newerLocal, deletedAt: 9 }], storedBlobIds: new Set() })).toEqual([]);
    expect(selectBlobFills({ incoming: [{ ...incoming, updatedAt: 20 }], local: [newerLocal], storedBlobIds: new Set() })).toEqual([]);
  });
});
