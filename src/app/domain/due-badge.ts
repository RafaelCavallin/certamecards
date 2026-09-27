export type DueBadgeView = { kind: 'hidden' } | { kind: 'placeholder' } | { kind: 'count'; text: string };

const OVERFLOW_AT = 99;

/**
 * `undefined` (ainda carregando) e `0` (nada a revisar) não podem parecer
 * iguais: um é espera, o outro é resultado. Usado tanto no badge por
 * baralho quanto no indicador total do cabeçalho (RF20).
 */
export function dueBadgeView(count: number | undefined): DueBadgeView {
  if (count === undefined) return { kind: 'placeholder' };
  if (count <= 0) return { kind: 'hidden' };
  return { kind: 'count', text: count > OVERFLOW_AT ? '99+' : String(count) };
}
