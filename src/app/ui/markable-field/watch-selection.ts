import { DestroyRef, inject } from '@angular/core';

/** Acompanha a seleção do documento enquanto o `<textarea>` tem o foco; chamar só em contexto de injeção. */
export function watchSelectionChange(field: () => HTMLTextAreaElement, onChange: () => void): void {
  const handler = (): void => {
    if (document.activeElement === field()) onChange();
  };
  document.addEventListener('selectionchange', handler);
  inject(DestroyRef).onDestroy(() => document.removeEventListener('selectionchange', handler));
}
