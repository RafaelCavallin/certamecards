export interface HomeFilterInfo {
  names: string[];
  unfilteredSize: number;
}

export type HomeView =
  | { kind: 'loading' }
  | { kind: 'onboarding' }
  | { kind: 'filtered-empty'; filter: HomeFilterInfo }
  | { kind: 'today'; queueSize: number | null; minutes: number; filter: HomeFilterInfo | null };

export interface HomeViewInput {
  total: number | undefined;
  queueSize: number | null;
  minutes: number;
  filter?: HomeFilterInfo | null;
}

/**
 * Decide entre onboarding e o número do dia. `total === undefined` é a raiz
 * da piscada original: tratá-lo como zero fazia o onboarding "sem cartões"
 * aparecer para quem tem milhares — aqui ele vira o próprio estado de espera.
 */
export function homeView(input: HomeViewInput): HomeView {
  if (input.total === undefined) return { kind: 'loading' };
  if (input.total === 0) return { kind: 'onboarding' };
  const filter = input.filter ?? null;
  if (filter && input.queueSize === 0) return { kind: 'filtered-empty', filter };
  return { kind: 'today', queueSize: input.queueSize, minutes: input.minutes, filter };
}

/**
 * O rótulo do botão de estudar — nunca afirma "nada vencido" enquanto a
 * fila ainda está sendo contada.
 */
export function studyButtonLabel(queueSize: number | null): string {
  if (queueSize === null) return 'Contando o que vence hoje…';
  if (queueSize === 0) return 'Nada vencido agora';
  return 'Estudar';
}
