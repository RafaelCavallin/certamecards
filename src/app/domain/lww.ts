export interface Versioned {
  id: string;
  updatedAt: number;
}

export function wins(incoming: Versioned, local: Versioned | undefined): boolean {
  if (!local) return true;
  if (incoming.updatedAt !== local.updatedAt) return incoming.updatedAt > local.updatedAt;
  return incoming.id > local.id;
}
