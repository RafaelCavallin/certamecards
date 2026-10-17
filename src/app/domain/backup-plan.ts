import type { CardImage } from './db';
import { wins, type Versioned } from './lww';

export function selectWinners<T extends Versioned>(input: { incoming: T[]; local: (T | undefined)[] }): T[] {
  return input.incoming.filter((row, index) => wins(row, input.local[index]));
}

export function selectOrphans(input: { localIds: string[]; incomingIds: string[] }): string[] {
  const incoming = new Set(input.incomingIds);
  return input.localIds.filter((id) => !incoming.has(id));
}

export interface BlobFillInput {
  incoming: CardImage[];
  local: (CardImage | undefined)[];
  storedBlobIds: ReadonlySet<string>;
}

export function selectBlobFills(input: BlobFillInput): string[] {
  return input.incoming
    .filter((image, index) => {
      const local = input.local[index];
      return local !== undefined && local.deletedAt === 0 && !input.storedBlobIds.has(image.id) && !wins(image, local);
    })
    .map((image) => image.id);
}
