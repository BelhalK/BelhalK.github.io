import { useCallback, useEffect, useState } from 'react';
import {
  addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type NodeChange,
  Background, BackgroundVariant, ReactFlow, ReactFlowProvider, type IsValidConnection,
} from '@xyflow/react';
import { Play, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { audio } from '@/engine/audio';
import { midi } from '@/engine/midi';
import { transport } from '@/engine/transport';
import { patternName } from '@/lib/cycles';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { TipProvider } from '@/components/ui';
import { baseType, KIND_OF_HANDLE } from '@/flow/defaults';
import { PartsNav, useShowHome } from '@/flow/PartsNav';
import { LeaderEdge } from '@/flow/LeaderEdge';
import { useTouchCamera } from '@/flow/useTouchCamera';
import { connectAll, CyclesPart } from '@/flow/parts/Cycles';
import { MonitorPart, ReferencePart, SpectrogramPart, SpectrumPart } from '@/flow/parts/Mix';
import { BanksPart, GroovePart, SoundsPart } from '@/flow/parts/Produce';
import { Fm1Part } from '@/flow/parts/Fm1';
import { ChopperPart, RecorderPart } from '@/flow/parts/Sample';
import { SampleToPresetPart } from '@/flow/parts/SampleToPreset';
import { SequencerPart } from '@/flow/parts/Sequencer';
import { LlmPart } from '@/flow/parts/Llm';
const nodeTypes = {
  cycles: CyclesPart, sequencer: SequencerPart, llm: LlmPart, groove: GroovePart, sounds: SoundsPart, banks: BanksPart,
  spectrogram: SpectrogramPart, spectrum: SpectrumPart, recorder: RecorderPart, chopper: ChopperPart, preset: SampleToPresetPart,
  reference: ReferencePart, monitor: MonitorPart, fm1: Fm1Part,
};
const edgeTypes = { leader: LeaderEdge };

function Position() {
  const bar = useLive((s) => s.bar);
  const beat = useLive((s) => s.beat);
  const step = useLive((s) => s.step);
  return <span className="mono w-14">{bar}.{beat}.{(step % 4) + 1}</span>;
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={clsx('size-2', ok ? 'bg-paper' : 'border border-paper')} />
      {label}: {ok ? 'on' : 'off'}
    </span>
  );
}

const inTempoRange = (v: number) => v >= 40 && v <= 300;

/** Half-typed numbers stay in the box; only a tempo in range reaches the project, and leaving the box drops the rest. */
function BpmInput() {
  const bpm = useProject((s) => s.bpm);
  const setTop = useProject((s) => s.setTop);
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="number"
      aria-label="Tempo in BPM"
      min={40}
      max={300}
      step={0.5}
      value={draft ?? bpm}
      onChange={(e) => {
        setDraft(e.target.value);
        const v = Number(e.target.value);
        if (e.target.value !== '' && inTempoRange(v)) setTop({ bpm: v });
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
      }}
      className="mono h-7 w-16 rounded-[2px] border border-paper/50 bg-transparent px-1.5 text-right [appearance:textfield] hover:border-paper [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

function TransportBar() {
  const playing = useLive((s) => s.playing);
  const midiStatus = useLive((s) => s.midi);
  const audioStatus = useLive((s) => s.audio);
  const followBpm = useLive((s) => s.followBpm);
  const swing = useProject((s) => s.swing);
  const current = useProject((s) => s.current);
  const clockSource = useLive((s) => s.clockSource);
  const connected = midiStatus === 'connected' && audioStatus === 'connected';
  const following = playing && clockSource === 'device';

  return (
    <header className="on-ink flex h-[52px] shrink-0 items-center gap-5 overflow-x-auto bg-ink px-4 text-paper max-[820px]:gap-2 max-[820px]:overflow-hidden max-[820px]:px-2">
      <strong className="text-[15px] font-semibold whitespace-nowrap max-[1100px]:hidden">Model:Cycles Studio</strong>
      <strong className="hidden min-w-0 truncate text-[13px] font-semibold max-[820px]:block">Model:Cycles</strong>
      <div className="hidden flex-1 max-[820px]:block" />

      <button
        type="button"
        onClick={() => transport.toggle()}
        aria-label={playing ? 'Stop' : 'Play'}
        className={clsx(
          'flex h-8 w-[84px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[2px] font-semibold max-[820px]:order-last max-[820px]:h-10 max-[820px]:w-11',
          playing ? 'bg-live-dark text-paper' : 'bg-paper text-ink hover:bg-grid',
        )}
      >
        {playing ? <Square className="size-3.5" fill="currentColor" /> : <Play className="size-3.5" fill="currentColor" />}
        <span className="max-[820px]:hidden">{playing ? 'Stop' : 'Play'}</span>
      </button>

      <label className="flex shrink-0 items-center gap-1.5">
        {following ? (
          <span className="mono">{followBpm?.toFixed(1) ?? '--'}</span>
        ) : (
          <BpmInput />
        )}
        <span className="text-xs">BPM</span>
      </label>
      <span className="text-xs whitespace-nowrap max-[1100px]:hidden">Swing <span className="mono">{swing}%</span></span>
      <span className="max-[820px]:hidden"><Position /></span>
      <span className="text-xs whitespace-nowrap max-[1100px]:hidden">Pattern <span className="mono">{patternName(current)}</span></span>

      <div className="flex-1 max-[820px]:hidden" />

      {connected ? (
        <div className="flex gap-4 max-[820px]:hidden">
          <Status ok label="MIDI" />
          <Status ok label="Audio" />
        </div>
      ) : (
        <button type="button" onClick={connectAll} className="h-8 shrink-0 cursor-pointer rounded-[2px] bg-paper px-3 font-semibold text-ink hover:bg-grid max-[820px]:h-10 max-[820px]:px-2 max-[820px]:text-xs">
          <span className="max-[820px]:hidden">Connect Model:Cycles</span>
          <span className="hidden max-[820px]:inline">Connect</span>
        </button>
      )}
    </header>
  );
}

function Canvas() {
  const nodes = useProject((s) => s.nodes);
  const edges = useProject((s) => s.edges);
  const setLayout = useProject((s) => s.setLayout);

  const showHome = useShowHome();
  useTouchCamera();

  useEffect(() => {
    const id = setTimeout(() => showHome(), 60);
    return () => clearTimeout(id);
  }, [showHome]);

  useEffect(() => audio.sync(nodes, edges), [nodes, edges]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const s = useProject.getState();
    setLayout(applyNodeChanges(changes, s.nodes), s.edges);
  }, [setLayout]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const s = useProject.getState();
    setLayout(s.nodes, applyEdgeChanges(changes, s.edges));
  }, [setLayout]);
  const onConnect = useCallback((c: Connection) => {
    const s = useProject.getState();
    const edge: Edge = { ...c, id: `${c.source}-${c.target}-${KIND_OF_HANDLE(c.sourceHandle)}`, type: 'leader', data: { kind: KIND_OF_HANDLE(c.sourceHandle) } };
    setLayout(s.nodes, addEdge(edge, s.edges));
  }, [setLayout]);

  const isValid: IsValidConnection = useCallback((c) => {
    if (c.source === c.target) return false;
    if (KIND_OF_HANDLE(c.sourceHandle) !== KIND_OF_HANDLE(c.targetHandle)) return false;
    // A microphone into the speakers would feed back.
    if (baseType(c.source) === 'recorder' && baseType(c.target) === 'monitor') return false;
    return true;
  }, []);

  const decorated = nodes.map((n) => ({ ...n, dragHandle: '.part-drag' }));

  return (
    <ReactFlow
      nodes={decorated}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgeClick={() => useLive.getState().set({ selectedStep: null })}
      isValidConnection={isValid}
      minZoom={0.2}
      maxZoom={1.5}
      panOnScroll
      zoomOnPinch
      deleteKeyCode={['Backspace', 'Delete']}
      onNodesDelete={undefined}
      nodesFocusable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.8} color="#d4d7dc" />
    </ReactFlow>
  );
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.matches('input, select, textarea')) return;
      // Over a Sounds node, Space plays that track, so the pad can be moved while listening.
      const audition = useLive.getState().auditionTrack;
      if (e.code === 'Space' && audition !== null && !el.closest('[role="listbox"]')) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) transport.trigger(audition);
        return;
      }
      if (el.getAttribute('role') === 'slider') return;
      if (e.code === 'Space') {
        e.preventDefault();
        transport.toggle();
        return;
      }
      const sel = useLive.getState().selectedStep;
      if (!sel) return;
      const project = useProject.getState();
      const step = project.pattern().lanes[sel.lane][sel.step];
      if (!step) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dir = e.key === 'ArrowLeft' ? -1 : 1;
        if (e.altKey) {
          project.updateStep(sel.lane, sel.step, { micro: Math.max(-23, Math.min(23, step.micro + dir)) });
        } else {
          const to = (sel.step + dir + project.pattern().length) % project.pattern().length;
          if (!project.pattern().lanes[sel.lane][to]) {
            project.moveStep(sel.lane, sel.step, to);
            useLive.getState().set({ selectedStep: { lane: sel.lane, step: to } });
          }
        }
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.stopPropagation();
        project.toggleStep(sel.lane, sel.step);
        useLive.getState().set({ selectedStep: null });
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}

export default function App() {
  useKeyboard();
  useEffect(() => { void midi.reconnect(); }, []);
  const kitId = useProject((s) => s.kitId);
  useEffect(() => { void audio.loadKit(kitId); }, [kitId]);
  return (
    <TipProvider>
      <ReactFlowProvider>
        <div className="flex h-full flex-col">
          <TransportBar />
          <main className="relative min-h-0 flex-1">
            <PartsNav />
            <Canvas />
          </main>
        </div>
      </ReactFlowProvider>
    </TipProvider>
  );
}
