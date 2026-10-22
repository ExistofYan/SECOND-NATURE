let frame = -1, x = NaN, y = NaN;
let target: Element | null = null;
/** Share one topmost DOM hit test between all controls in a camera frame. */
export function gestureTargetAt(nextX: number, nextY: number, nextFrame: number): Element | null {
  if (frame !== nextFrame || x !== nextX || y !== nextY || target && !target.isConnected) {
    frame = nextFrame; x = nextX; y = nextY;
    target = document.elementFromPoint?.(x, y)?.closest('[data-pinch-target]') ?? null;
  }
  return target;
}
export function resetGestureHitTest() { frame = -1; target = null; }
