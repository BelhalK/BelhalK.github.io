import type { ReactNode } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { X } from 'lucide-react';
import { useProject } from '@/store/project';
import { clsx } from 'clsx';
import { PARTS } from './defaults';

export type PortSpec = { id: string; side: 'left' | 'right' | 'top' | 'bottom'; label: string; top: number };

/** The frame every node shares: drag bar, labelled ports. */
export function Part({
  type, width, status, ports = [], children, tight, onHover,
}: {
  type: string;
  width: number;
  status?: ReactNode;
  ports?: PortSpec[];
  children: ReactNode;
  tight?: boolean;
  onHover?: (inside: boolean) => void;
}) {
  const name = PARTS.find((p) => p.type === type)?.name;
  const id = useNodeId();
  const removePart = useProject((s) => s.removePart);
  return (
    <section className="part rounded-part border border-ink bg-paper" style={{ width }} aria-label={name} onPointerEnter={() => onHover?.(true)} onPointerLeave={() => onHover?.(false)}>
      <header className="part-drag flex h-9 items-center gap-2 border-b border-ink px-3">
        <h3 className="text-[13px] font-semibold">{name}</h3>
        <span className="ml-auto truncate pl-3 text-xs text-muted">{status}</span>
        <button type="button" aria-label={`Remove ${name}`} title={`Remove ${name}`} className="nodrag -mr-1 grid size-5 shrink-0 cursor-pointer place-items-center rounded-[2px] hover:bg-wash" onClick={() => id && removePart(id)}>
          <X className="size-3.5" />
        </button>
      </header>
      {ports.map((p) => (
        <span key={p.id}>
          <Handle
            id={p.id}
            type={p.id.endsWith('out') ? 'source' : 'target'}
            position={{ left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom }[p.side]}
            className={p.id.startsWith('midi') ? 'kind-midi' : 'kind-audio'}
            // On top and bottom ports, `top` gives the distance from the left edge.
            style={p.side === 'top' || p.side === 'bottom' ? { left: p.top } : { top: p.top }}
            aria-label={p.label}
          />
          {(p.side === 'left' || p.side === 'right') && (
            <span
              className={clsx('pointer-events-none absolute bg-paper px-1 text-[10px] whitespace-nowrap text-muted', p.side === 'left' ? 'right-full mr-2' : 'left-full ml-2')}
              style={{ top: p.top - 8 }}
            >
              {p.label}
            </span>
          )}
        </span>
      ))}
      <div className={clsx('nodrag nopan cursor-default', !tight && 'p-3')}>{children}</div>
    </section>
  );
}
