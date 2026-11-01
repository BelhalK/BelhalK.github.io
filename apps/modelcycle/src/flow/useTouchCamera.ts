import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.5;

type Point = { x: number; y: number };

const middle = (t: TouchList, origin: Point): Point =>
  t.length === 1
    ? { x: t[0].clientX - origin.x, y: t[0].clientY - origin.y }
    : { x: (t[0].clientX + t[1].clientX) / 2 - origin.x, y: (t[0].clientY + t[1].clientY) / 2 - origin.y };
const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

/**
 * React Flow will not pan or pinch from on top of a node, and on a phone a zoomed-in
 * part can fill the screen. So a finger on a part moves the camera here, unless it
 * is on a control that drags (nopan) or on the header, which drags the part.
 */
export function useTouchCamera() {
  const { getViewport, setViewport } = useReactFlow();

  useEffect(() => {
    let start: { mid: Point; spread: number; view: ReturnType<typeof getViewport>; origin: Point } | null = null;

    const onPart = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      const blocker = target.closest('.nopan');
      return !!blocker && (blocker.classList.contains('react-flow__node') || blocker.classList.contains('part-body'));
    };

    const begin = (e: TouchEvent) => {
      const pane = (e.target as Element).closest?.('.react-flow')?.getBoundingClientRect();
      const fingers = e.touches.length;
      const onHeader = (e.target as Element).closest?.('.part-drag');
      if (!pane || fingers > 2 || !onPart(e.target) || (onHeader && fingers === 1)) {
        start = null;
        return;
      }
      const origin = { x: pane.left, y: pane.top };
      start = { mid: middle(e.touches, origin), spread: fingers === 2 ? spread(e.touches) : 0, view: getViewport(), origin };
    };

    const move = (e: TouchEvent) => {
      if (!start || e.touches.length > 2) return;
      const mid = middle(e.touches, start.origin);
      const zoom = e.touches.length === 2 && start.spread
        ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, start.view.zoom * (spread(e.touches) / start.spread)))
        : start.view.zoom;
      // Keeps the point under the fingers under the fingers.
      const scale = zoom / start.view.zoom;
      void setViewport({ x: mid.x - (start.mid.x - start.view.x) * scale, y: mid.y - (start.mid.y - start.view.y) * scale, zoom });
    };

    // Lifting one of two fingers carries on as a pan from where the camera now is.
    const end = (e: TouchEvent) => {
      if (start && e.touches.length) begin(e);
      else start = null;
    };

    document.addEventListener('touchstart', begin, { passive: true });
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
    return () => {
      document.removeEventListener('touchstart', begin);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', end);
    };
  }, [getViewport, setViewport]);
}
