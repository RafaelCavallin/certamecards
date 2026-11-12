export const APP_TITLE = 'CertameCards';

/** Título da aba: o da rota quando existe, senão o do app (evita herdar o da página anterior). */
export function pageTitle(routeTitle: string | undefined): string {
  return routeTitle?.trim() ? routeTitle : APP_TITLE;
}
