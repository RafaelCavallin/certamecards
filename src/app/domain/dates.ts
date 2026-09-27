export const DAY = 86_400_000;

/** Data no formato `YYYY-MM-DD`, no fuso local — chave do heatmap e das estatísticas por dia. */
export function iso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Início do dia local, em epoch ms — corte usado para "introduzidos hoje". */
export function startOfToday(now: number = Date.now()): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
