import { afterRenderEffect } from '@angular/core';

/** Cresce o textarea até caber o conteúdo, sem rolagem interna — nunca encolhe abaixo do CSS (`rows`). */
export function growToFit(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  if (el.scrollHeight > el.clientHeight) el.style.height = `${el.scrollHeight}px`;
}

/**
 * Recalcula a altura a cada render e outra vez quando as fontes carregam — sem isso, a métrica do
 * texto muda depois do primeiro cálculo e a caixa fica com a altura errada por um frame.
 */
export function watchAutoGrow(field: () => HTMLTextAreaElement, value: () => string): void {
  void document.fonts.ready.then(() => growToFit(field()));
  afterRenderEffect(() => {
    value();
    growToFit(field());
  });
}
