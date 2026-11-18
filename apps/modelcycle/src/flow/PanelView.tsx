import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProject } from '@/store/project';
import { baseType, type PartType } from './defaults';
import { Card, ChopperTile, LlmTile, PadTile, PresetTile, RecorderTile, SequencerTile, SpectrogramTile, SpectrumTile } from './panel/Tiles';

/**
 * Four flat cards side by side, sized for a 1920 x 720 touch strip. Each card does one
 * job with large targets. The canvas is not mounted meanwhile; its parts and cables stay
 * in the project, so notes and audio route exactly as they do there.
 */
const PAGES: { name: string; parts: PartType[] }[] = [
  { name: 'Create', parts: ['sounds', 'llm', 'sequencer', 'spectrogram'] },
  { name: 'Sample', parts: ['recorder', 'chopper', 'preset', 'spectrum'] },
];

export function PanelView() {
  const [page, setPage] = useState(0);
  const nodes = useProject((s) => s.nodes);
  const addPart = useProject((s) => s.addPart);
  const { parts } = PAGES[page];
  const next = PAGES[(page + 1) % PAGES.length];

  // The tiles need their parts on the canvas, with the usual cables, for sound to reach them.
  useEffect(() => {
    const have = useProject.getState().nodes;
    for (const type of parts) if (!have.some((n) => baseType(n.id) === type)) addPart(type, { x: 0, y: 0 });
  }, [parts, addPart]);

  const idOf = (type: PartType) => nodes.find((n) => n.id === type)?.id ?? nodes.find((n) => baseType(n.id) === type)?.id;
  const spectrogram = idOf('spectrogram');
  const spectrum = idOf('spectrum');

  return (
    <div className="flex h-full gap-2 bg-grid p-2">
      {page === 0 ? (
        <>
          <Card grow={1}><PadTile /></Card>
          <Card grow={1}><LlmTile /></Card>
          <Card grow={2.4}><SequencerTile /></Card>
          <Card grow={1.1}>{spectrogram && <SpectrogramTile id={spectrogram} />}</Card>
        </>
      ) : (
        <>
          <Card grow={1}><RecorderTile /></Card>
          <Card grow={2.2}><ChopperTile /></Card>
          <Card grow={1}><PresetTile /></Card>
          <Card grow={1.3}>{spectrum && <SpectrumTile id={spectrum} />}</Card>
        </>
      )}
      <button
        type="button"
        onClick={() => setPage((page + 1) % PAGES.length)}
        aria-label={`Show ${next.name}`}
        className="grid w-9 shrink-0 cursor-pointer place-items-center rounded-part bg-ink text-paper active:bg-[#2a2f37]"
      >
        {page === PAGES.length - 1 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
      </button>
    </div>
  );
}
