import { vi } from 'vitest';

type ChangeListener = (event: { matches: boolean }) => void;

export interface FakeMatchMedia {
  dispatch: (matches: boolean) => void;
  listenerCount: () => number;
}

export function installFakeMatchMedia(initialMatches: boolean): FakeMatchMedia {
  const listeners = new Set<ChangeListener>();
  const list = {
    matches: initialMatches,
    addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => list);
  return {
    dispatch: (matches) => {
      list.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
    listenerCount: () => listeners.size,
  };
}
