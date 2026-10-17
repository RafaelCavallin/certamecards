export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function browserStorage(): KeyValueStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
