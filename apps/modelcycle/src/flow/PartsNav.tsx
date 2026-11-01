import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  AudioLines, ChartSpline, Drum, GitCompareArrows, Grid3x3, KeyboardMusic, Library, Mic, RotateCcw, Scissors,
  Search, SlidersHorizontal, Sparkles, Volume2, Waves, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useProject } from '@/store/project';
import { Tip } from '@/components/ui';
import { baseType, PARTS, type PartType } from './defaults';

const ICONS: Record<PartType, ComponentType<{ className?: string }>> = {
  sequencer: Grid3x3,
  llm: Sparkles,
  groove: Waves,
  sounds: SlidersHorizontal,
  banks: Library,
  cycles: Drum,
  fm1: KeyboardMusic,
  recorder: Mic,
  chopper: Scissors,
  spectrogram: AudioLines,
  spectrum: ChartSpline,
  reference: GitCompareArrows,
  monitor: Volume2,
};

// Words people may search for that are not in a part's name.
const KEYWORDS: Record<PartType, string> = {
  cycles: 'device hardware usb elektron clock connect',
  sequencer: 'steps pattern tracks lanes shift grid',
  llm: 'ai gemini prompt generate midi pattern',
  groove: 'swing shuffle timing templates learn',
  sounds: 'machine presets color shape parameters cc',
  banks: 'patterns slots copy program change',
  recorder: 'microphone mic input take iphone',
  chopper: 'sample slice upload song file waveform',
  spectrogram: 'visualize frequency time audio',
  spectrum: 'frequency analyzer mix notes peak level',
  reference: 'track compare a/b tonal balance',
  monitor: 'output volume speakers meter hear',
  fm1: 'mvave m-vave synth fm-1 synthesizer',
};

export const FIT_PADDING = window.matchMedia('(max-width: 820px)').matches
  ? ({ top: '16px', left: '52px', right: '8px', bottom: '16px' } as const)
  : ({ top: '40px', left: '80px', right: '32px', bottom: '16px' } as const);

const ROUND = 'dock-button grid size-10 cursor-pointer place-items-center rounded-full border border-ink shadow-[0_2px_8px_rgb(14_17_22/0.18)] transition-colors duration-150';

/** Frames the parts the app opens on; from there the trackpad moves around. */
export function useShowHome() {
  const { fitView } = useReactFlow();
  return useCallback(() => {
    // Banks sits below this frame so the Sequencer opens at full reading size.
    const group = useProject.getState().nodes.filter((n) => PARTS.find((p) => p.type === n.type)?.group === 'produce' && n.type !== 'banks');
    void fitView({ nodes: group.map((n) => ({ id: n.id })), padding: FIT_PADDING, maxZoom: 1, duration: 250 });
  }, [fitView]);
}

export function PartsNav() {
  const nodes = useProject((s) => s.nodes);
  const addPart = useProject((s) => s.addPart);
  const resetLayout = useProject((s) => s.resetLayout);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const showHome = useShowHome();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (searching) input.current?.focus();
    else setQuery('');
  }, [searching]);

  const frame = (id: string) =>
    // A new part needs a moment to be measured before the camera can frame it.
    setTimeout(() => void fitView({ nodes: [{ id }], padding: FIT_PADDING, maxZoom: 1, duration: 250 }), 80);

  /** Always adds another. The first of a type returns to its place with its cables; copies land in view, unwired. */
  const add = (type: PartType) => {
    const isFirst = !useProject.getState().nodes.some((n) => baseType(n.id) === type);
    const pane = document.querySelector('.react-flow')?.getBoundingClientRect();
    const center = pane ? screenToFlowPosition({ x: pane.left + pane.width / 2, y: pane.top + pane.height / 3 }) : { x: 0, y: 0 };
    const id = addPart(type, center);
    if (isFirst) frame(id);
  };

  const goTo = (type: PartType) => {
    const existing = useProject.getState().nodes.find((n) => baseType(n.id) === type);
    if (existing) frame(existing.id);
    else add(type);
    setSearching(false);
  };

  const q = query.trim().toLowerCase();
  const matches = PARTS.filter((p) => !q || `${p.name} ${KEYWORDS[p.type]}`.toLowerCase().includes(q));

  return (
    <nav aria-label="Parts" className="dock absolute top-1/2 left-3 z-10 flex -translate-y-1/2 flex-col gap-1.5">
      <div className="relative">
        <Tip text="Search" side="right">
          <button
            type="button"
            aria-label="Search parts"
            aria-expanded={searching}
            onClick={() => setSearching(!searching)}
            className={clsx(ROUND, 'bg-paper text-ink hover:bg-wash')}
          >
            {searching ? <X className="size-4" /> : <Search className="size-4" />}
          </button>
        </Tip>
        {searching && (
          <div className="absolute top-0 left-12 w-60 rounded-part border border-ink bg-paper shadow-[0_6px_18px_rgb(14_17_22/0.16)]">
            <input
              ref={input}
              type="text"
              value={query}
              aria-label="Search parts by name"
              placeholder="Search parts"
              className="no-ring h-10 w-full border-b border-ink bg-transparent px-3 text-xs placeholder:text-muted"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches[0]) goTo(matches[0].type);
                if (e.key === 'Escape') setSearching(false);
              }}
            />
            <ul className="max-h-80 overflow-y-auto py-1">
              {matches.length === 0 && <li className="px-3 py-2 text-xs text-muted">No part matches "{query.trim()}".</li>}
              {matches.map((p) => {
                const Icon = ICONS[p.type];
                return (
                  <li key={p.type}>
                    <button type="button" onClick={() => goTo(p.type)} className="flex h-8 w-full cursor-pointer items-center gap-2 px-3 text-left text-xs hover:bg-wash">
                      <Icon className="size-3.5 shrink-0" />
                      {p.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <span className="dock-gap h-1" />

      {PARTS.map((p) => {
        const Icon = ICONS[p.type];
        const present = nodes.some((n) => baseType(n.id) === p.type);
        return (
          <Tip key={p.type} text={p.name} side="right">
            <button
              type="button"
              aria-label={`Add ${p.name}`}
              onClick={() => add(p.type)}
              className={clsx(ROUND, present ? 'bg-ink text-paper hover:bg-[#2a2f37]' : 'bg-paper text-ink hover:bg-wash')}
            >
              <Icon className="size-4" />
            </button>
          </Tip>
        );
      })}

      <span className="dock-gap h-1" />

      <Tip text="Reset layout" side="right">
        <button
          type="button"
          aria-label="Reset layout"
          onClick={() => {
            resetLayout();
            setTimeout(showHome, 80);
          }}
          className={clsx(ROUND, 'bg-paper text-ink hover:bg-wash')}
        >
          <RotateCcw className="size-4" />
        </button>
      </Tip>
    </nav>
  );
}
