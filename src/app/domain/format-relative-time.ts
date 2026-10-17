const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeSync(lastSyncAt: number, now: number): string {
  const elapsed = now - lastSyncAt;
  if (elapsed < MINUTE_MS) return 'Sincronizado agora mesmo.';
  if (elapsed < HOUR_MS) return `Sincronizado há ${Math.floor(elapsed / MINUTE_MS)} min.`;
  if (elapsed < DAY_MS) return `Sincronizado há ${Math.floor(elapsed / HOUR_MS)} h.`;
  return `Sincronizado há ${Math.floor(elapsed / DAY_MS)} d.`;
}
