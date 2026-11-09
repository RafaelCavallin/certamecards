import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

const BASE_CLASSES = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition';
const TONE_CLASSES = {
  surface: 'text-muted hover:text-signal',
  viewer: 'border border-on-viewer/30 text-on-viewer',
} as const;

export type CloseButtonTone = keyof typeof TONE_CLASSES;

@Component({
  selector: 'app-close-button',
  templateUrl: './close-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloseButton {
  readonly label = input('Fechar');
  readonly tone = input<CloseButtonTone>('surface');
  readonly pressed = output<void>();

  readonly classes = computed(() => `${BASE_CLASSES} ${TONE_CLASSES[this.tone()]}`);
}
