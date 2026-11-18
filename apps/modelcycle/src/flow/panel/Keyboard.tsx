import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownLeft, Delete } from 'lucide-react';
import { clsx } from 'clsx';

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
];

// Holding Delete repeats after this long, this often.
const REPEAT_AFTER_MS = 400;
const REPEAT_EVERY_MS = 60;
const MAX_WIDTH = 1100;

const KEY_SHAPE = 'grid min-w-0 flex-1 cursor-pointer place-items-center rounded-part border border-ink text-[22px] select-none';
const KEY = `${KEY_SHAPE} bg-paper active:bg-ink active:text-paper`;

/**
 * A keyboard on screen, for a touch display with no keyboard of its own. It opens under
 * the field it types into and reaches across the cards to its right, so the keys are finger
 * sized. Enter, or a tap anywhere else, closes it.
 */
export function Keyboard({ anchor, field, onKey, onBackspace, onClose }: {
  anchor: RefObject<HTMLElement | null>;
  field: RefObject<HTMLElement | null>;
  onKey: (text: string) => void;
  onBackspace: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ top: number; left: number; width: number } | null>(null);
  const repeat = useRef<{ wait: number; tick: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const a = anchor.current?.getBoundingClientRect();
      const f = field.current?.getBoundingClientRect();
      if (!a || !f) return;
      setPlace({ top: f.bottom + 8, left: a.left, width: Math.min(MAX_WIDTH, window.innerWidth - a.left - 8) });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [anchor, field]);

  // A press outside both the keyboard and its field closes it.
  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || field.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('pointerdown', down, true);
    return () => document.removeEventListener('pointerdown', down, true);
  }, [field, onClose]);

  const stopRepeat = () => {
    if (!repeat.current) return;
    clearTimeout(repeat.current.wait);
    clearInterval(repeat.current.tick);
    repeat.current = null;
  };
  useEffect(() => stopRepeat, []);

  // Keys act on press, and never take focus from the field.
  const press = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    fn();
  };

  if (!place) return null;
  return createPortal(
    <div
      ref={panel}
      role="group"
      aria-label="Keyboard"
      className="fixed z-50 flex flex-col gap-2 rounded-part border border-ink bg-grid p-2 shadow-[0_8px_28px_rgb(14_17_22/0.25)]"
      style={{ top: place.top, left: place.left, width: place.width, height: Math.min(440, window.innerHeight - place.top - 8) }}
    >
      {ROWS.map((row, r) => (
        <div key={r} className="flex min-h-0 flex-1 gap-2">
          {row.map((k) => (
            <button key={k} type="button" tabIndex={-1} onPointerDown={press(() => onKey(k))} className={clsx(KEY, /\d/.test(k) && 'mono text-[20px]')}>
              {k}
            </button>
          ))}
          {r === 0 && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Delete"
              onPointerDown={press(() => {
                onBackspace();
                stopRepeat();
                const wait = window.setTimeout(() => {
                  if (repeat.current) repeat.current.tick = window.setInterval(onBackspace, REPEAT_EVERY_MS);
                }, REPEAT_AFTER_MS);
                repeat.current = { wait, tick: 0 };
              })}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
              className={clsx(KEY, 'flex-[1.6]')}
            >
              <Delete className="size-6" />
            </button>
          )}
          {r === 1 && <span className="flex-[1.6]" />}
          {r === 2 && (
            <button type="button" tabIndex={-1} aria-label="Done" onPointerDown={press(onClose)} className={clsx(KEY_SHAPE, 'flex-[1.6] bg-ink text-paper active:bg-[#2a2f37]')}>
              <CornerDownLeft className="size-6" />
            </button>
          )}
          {r === 3 && <span className="flex-[1.6]" />}
        </div>
      ))}
      <div className="flex min-h-0 flex-1 gap-2">
        <span className="flex-[2]" />
        <button type="button" tabIndex={-1} aria-label="Space" onPointerDown={press(() => onKey(' '))} className={clsx(KEY, 'flex-[6]')} />
        <span className="flex-[2]" />
      </div>
    </div>,
    document.body,
  );
}
