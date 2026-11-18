import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 1.5;

// A second press this soon and this close to the first counts as a double tap.
const DOUBLE_MS = 320;
const DOUBLE_PX = 36;
// Sliding this far doubles or halves the zoom.
const PX_PER_DOUBLING = 140;

const onEmptyCanvas = (target: EventTarget | null) =>
  target instanceof Element && !!target.closest('.react-flow__pane') && !target.closest('.react-flow__node, .react-flow__edge, .react-flow__handle');

/**
 * Double tap (or double click) on empty canvas and keep the finger down: sliding up
 * zooms in, sliding down zooms out, around the point first touched. One finger is
 * enough, which matters on touch screens a computer reads as a mouse.
 */
export function useDragZoom() {
  const { getViewport, setViewport } = useReactFlow();

  useEffect(() => {
    let last = { t: 0, x: 0, y: 0 };
    let drag: { y: number; anchor: { x: number; y: number }; view: ReturnType<typeof getViewport> } | null = null;

    const press = (e: Event, x: number, y: number) => {
      if (!onEmptyCanvas(e.target)) {
        last.t = 0;
        return;
      }
      const now = performance.now();
      if (now - last.t < DOUBLE_MS && Math.hypot(x - last.x, y - last.y) < DOUBLE_PX) {
        const pane = (e.target as Element).closest('.react-flow')!.getBoundingClientRect();
        drag = { y, anchor: { x: x - pane.left, y: y - pane.top }, view: getViewport() };
        last.t = 0;
        // React Flow would start a pan from this press otherwise.
        e.stopPropagation();
        e.preventDefault();
      } else {
        last = { t: now, x, y };
      }
    };

    const slide = (e: Event, y: number) => {
      if (!drag) return;
      e.preventDefault();
      const { view, anchor } = drag;
      const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom * 2 ** ((drag.y - y) / PX_PER_DOUBLING)));
      // Keeps the canvas point under the first touch where it is.
      const k = zoom / view.zoom;
      void setViewport({ x: anchor.x - (anchor.x - view.x) * k, y: anchor.y - (anchor.y - view.y) * k, zoom });
    };

    const release = () => { drag = null; };

    const touchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        drag = null;
        last.t = 0;
        return;
      }
      press(e, e.touches[0].clientX, e.touches[0].clientY);
    };
    const touchMove = (e: TouchEvent) => { if (e.touches.length === 1) slide(e, e.touches[0].clientY); };
    const mouseDown = (e: MouseEvent) => { if (e.button === 0) press(e, e.clientX, e.clientY); };
    const mouseMove = (e: MouseEvent) => slide(e, e.clientY);

    // Capture runs before React Flow's own listeners, so the second press never reaches them.
    document.addEventListener('touchstart', touchStart, { capture: true, passive: false });
    document.addEventListener('touchmove', touchMove, { capture: true, passive: false });
    document.addEventListener('touchend', release, true);
    document.addEventListener('touchcancel', release, true);
    document.addEventListener('mousedown', mouseDown, true);
    window.addEventListener('mousemove', mouseMove, true);
    window.addEventListener('mouseup', release, true);
    return () => {
      document.removeEventListener('touchstart', touchStart, true);
      document.removeEventListener('touchmove', touchMove, true);
      document.removeEventListener('touchend', release, true);
      document.removeEventListener('touchcancel', release, true);
      document.removeEventListener('mousedown', mouseDown, true);
      window.removeEventListener('mousemove', mouseMove, true);
      window.removeEventListener('mouseup', release, true);
    };
  }, [getViewport, setViewport]);
}
