import { TAP_MAX_MOVE, isDoubleTap, swipeDirection } from '../../domain/viewer-input';

export interface GestureTarget {
  scale(): number;
  swipe(direction: 'prev' | 'next'): void;
  toggleZoom(): void;
}

export class ViewerGestures {
  private start: { x: number; y: number } | null = null;
  private lastTapAt: number | null = null;

  constructor(private readonly target: GestureTarget) {}

  down(event: PointerEvent): void {
    this.start = event.isPrimary ? { x: event.clientX, y: event.clientY } : null;
  }

  up(event: PointerEvent): void {
    const start = this.start;
    this.start = null;
    if (!start || !event.isPrimary) return;
    const move = { dx: event.clientX - start.x, dy: event.clientY - start.y };
    const direction = swipeDirection({ ...move, scale: this.target.scale() });
    if (direction) this.target.swipe(direction);
    else if (Math.hypot(move.dx, move.dy) <= TAP_MAX_MOVE) this.tap(event.timeStamp);
  }

  private tap(now: number): void {
    const doubled = isDoubleTap(this.lastTapAt, now);
    this.lastTapAt = doubled ? null : now;
    if (doubled) this.target.toggleZoom();
  }
}
