import 'fake-indexeddb/auto';
import { vi } from 'vitest';

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
