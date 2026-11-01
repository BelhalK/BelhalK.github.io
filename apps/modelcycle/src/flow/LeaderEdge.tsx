import { useEffect, useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getSmoothStepPath, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';
import { onPulse } from '@/store/live';
import { baseType } from './defaults';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

// Each source runs its own vertical line in the gap before its targets, so
// cables from one source stay together and never hide behind a node.
const AUDIO_BUS_OFFSET: Record<string, number> = { cycles: 64, fm1: 76, chopper: 88, recorder: 100 };
const NOTES_BUS_OFFSET = 60;

/** A right-angle drafting line. MIDI is dashed, audio solid; each hit runs along it in vermilion. */
export function LeaderEdge({ id, source, target, data, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const kind = data?.kind as 'midi' | 'audio';
  const hit = useRef<SVGPathElement>(null);
  const { deleteElements, screenToFlowPosition } = useReactFlow();
  // Where the pointer met the line: cables are long, so the delete button appears there rather than at a far-off midpoint.
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideSoon = () => { hideTimer.current = setTimeout(() => setHover(null), 150); };
  useEffect(() => () => clearTimeout(hideTimer.current), []);
  const base = baseType(source);
  const offset = kind === 'midi' ? NOTES_BUS_OFFSET : (AUDIO_BUS_OFFSET[base] ?? 64);
  const forward = sourcePosition === 'right' && targetPosition === 'left' && targetX - offset > sourceX + 10;
  const target_ = baseType(target);
  // Analysers sit in the column past Monitor and Reference, so their cables run along the top.
  const overTop = forward && kind === 'audio' && (target_ === 'spectrogram' || target_ === 'spectrum') && targetX - sourceX > 700;
  const lane = Object.keys(AUDIO_BUS_OFFSET).indexOf(base);
  const path = overTop
    ? `M${sourceX} ${sourceY} H${targetX - 640 - offset} V${-18 - lane * 6} H${targetX - 70 - lane * 12} V${targetY} H${targetX}`
    : getSmoothStepPath({
        sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 0, offset: 18,
        centerX: forward ? targetX - offset : undefined,
      })[0];

  useEffect(
    () =>
      onPulse((key) => {
        const [s, t] = key.split('>');
        const from = baseType(source);
        const to = baseType(target);
        const carries = kind === 'midi' ? (s === from && t === to) || (s === to && t === from) : s === from || t === from;
        const el = hit.current;
        if (!carries || !el || REDUCED.matches) return;
        const len = el.getTotalLength();
        const dash = Math.min(90, len);
        el.style.strokeDasharray = `${dash} ${len + dash}`;
        el.animate(
          [{ strokeDashoffset: dash, opacity: 1 }, { strokeDashoffset: -len, opacity: 0.6 }],
          { duration: Math.min(520, 300 + len * 0.12), easing: 'cubic-bezier(.16,1,.3,1)' },
        );
      }),
    [kind, source, target],
  );

  return (
    <>
      <g
        onPointerEnter={(e) => {
          clearTimeout(hideTimer.current);
          setHover(screenToFlowPosition({ x: e.clientX, y: e.clientY }));
        }}
        onPointerLeave={hideSoon}
      >
        <BaseEdge id={id} path={path} className="leader-line" style={{ stroke: 'var(--color-ink)', strokeWidth: 1, strokeDasharray: kind === 'midi' ? '5 3' : undefined }} interactionWidth={14} />
      </g>
      <path ref={hit} d={path} fill="none" stroke="var(--color-live)" strokeWidth={2.5} style={{ opacity: 0, pointerEvents: 'none' }} />
      {hover && (
        <EdgeLabelRenderer>
          <button
            type="button"
            aria-label="Delete this connection"
            title="Delete this connection"
            className="nodrag nopan absolute grid size-5 cursor-pointer place-items-center rounded-full border border-ink bg-paper text-ink hover:bg-ink hover:text-paper"
            style={{ transform: `translate(-50%, -50%) translate(${hover.x}px, ${hover.y}px)`, pointerEvents: 'all' }}
            onPointerEnter={() => clearTimeout(hideTimer.current)}
            onPointerLeave={hideSoon}
            onClick={() => void deleteElements({ edges: [{ id }] })}
          >
            <X className="size-3" />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
