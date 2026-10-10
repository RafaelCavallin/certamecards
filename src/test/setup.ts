import 'fake-indexeddb/auto';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { vi } from 'vitest';

/**
 * O Blob do jsdom não sobrevive ao structuredClone do fake-indexeddb: voltaria do
 * banco como objeto simples, sem type, size nem conteúdo. O do Node sobrevive.
 */
Object.defineProperty(globalThis, 'Blob', { configurable: true, writable: true, value: NodeBlob });
Object.defineProperty(globalThis, 'File', { configurable: true, writable: true, value: NodeFile });

type LockCallback = (lock: object | null) => unknown;

/**
 * jsdom não implementa a Web Locks API. Por padrão o fake concede o lock
 * sempre (roda o callback com um lock "obtido"); testes sobre o mutex de
 * sincronização substituem `request` para simular concorrência.
 */
Object.defineProperty(navigator, 'locks', {
  configurable: true,
  writable: true,
  value: {
    request: vi.fn((_name: string, optsOrCallback: unknown, maybeCallback?: LockCallback) => {
      const callback = (
        typeof optsOrCallback === 'function' ? optsOrCallback : maybeCallback
      ) as LockCallback;
      return Promise.resolve(callback({}));
    }),
  },
});
