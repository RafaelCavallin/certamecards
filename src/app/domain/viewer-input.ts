export type ViewerAction = 'prev' | 'next' | 'zoom-in' | 'zoom-out' | 'close';

export interface SwipeInput {
  dx: number;
  dy: number;
  scale: number;
}

const KEY_ACTIONS: Readonly<Record<string, ViewerAction>> = {
  ArrowLeft: 'prev',
  ArrowRight: 'next',
  '+': 'zoom-in',
  '=': 'zoom-in',
  '-': 'zoom-out',
  Escape: 'close',
};

export const SWIPE_MIN_DISTANCE = 60;
export const DOUBLE_TAP_WINDOW_MS = 300;
export const TAP_MAX_MOVE = 10;
const UNZOOMED_SCALE = 1.01;

export function viewerKeyAction(key: string): ViewerAction | null {
  return KEY_ACTIONS[key] ?? null;
}

export function isZoomed(scale: number): boolean {
  return scale > UNZOOMED_SCALE;
}

export function swipeDirection({ dx, dy, scale }: SwipeInput): 'prev' | 'next' | null {
  if (isZoomed(scale)) return null;
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return null;
  return dx < 0 ? 'next' : 'prev';
}

export function isDoubleTap(previousAt: number | null, now: number): boolean {
  return previousAt !== null && now - previousAt <= DOUBLE_TAP_WINDOW_MS;
}

export function clampIndex(index: number, total: number): number {
  return Math.max(0, Math.min(index, total - 1));
}
