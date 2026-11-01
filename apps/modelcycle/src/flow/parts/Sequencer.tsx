import { memo, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { transport } from '@/engine/transport';
import { CC, CHOPS_LANE, FM_LANE, LANE_COLORS, LANE_NAMES, LANES, MACHINES, patternName } from '@/lib/cycles';
import { audio } from '@/engine/audio';
import type { Pattern, Step } from '@/lib/pattern';
import { mirrorProblem, useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { Button, Fader, Segmented, Select, Slider, Tip } from '@/components/ui';
import { Part } from '../Part';

const CELL = 34;
const GAP = 2;
const LABEL = 176;

const noteName = (n: number) => `${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][n % 12]}${Math.floor(n / 12) - 2}`;

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

function Playhead({ page }: { page: number }) {
  const playing = useLive((s) => s.playing);
  const line = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const draw = () => {
      const position = transport.playheadPosition();
      const col = (REDUCED.matches ? Math.floor(position) : position) - page * 16;
      const el = line.current;
      if (el) {
        el.style.display = col >= 0 && col < 16 ? '' : 'none';
        el.style.transform = `translateX(${col * (CELL + GAP)}px)`;
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [playing, page]);
  if (!playing) return null;
  return <div ref={line} className="pointer-events-none absolute -top-1 -bottom-1 z-10 w-[2px] bg-live will-change-transform" style={{ left: LABEL - 1 }} />;
}

const StepCell = memo(function StepCell({
  lane, index, step, muted, selected, swing, onDevice, onDown, onClickStep, onEnter, onContext,
}: {
  lane: number; index: number; step: Step | null; muted: boolean; selected: boolean; swing: number; onDevice: boolean;
  onDown: (lane: number, index: number) => void;
  onClickStep: (lane: number, index: number) => void;
  onEnter: (lane: number, index: number) => void;
  onContext: (lane: number, index: number) => void;
}) {
  const color = LANE_COLORS[lane];
  const late = step ? (index % 2 ? (2 * swing) / 100 - 1 : 0) + step.micro / 24 : 0;
  return (
    <button
      type="button"
      aria-label={`${LANE_NAMES[lane]} step ${index + 1}${step ? ', on' : ', off'}${onDevice ? ', playing on the Cycles' : ''}`}
      aria-pressed={!!step}
      onPointerDown={(e) => {
        if (e.button === 0) {
          e.currentTarget.releasePointerCapture?.(e.pointerId);
          onDown(lane, index);
        }
      }}
      onClick={() => onClickStep(lane, index)}
      onPointerEnter={() => onEnter(lane, index)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext(lane, index);
      }}
      title={onDevice && !step ? 'Playing on the Cycles. Capture it to edit it here.' : undefined}
      className={clsx(
        'relative cursor-pointer overflow-hidden rounded-[2px] border',
        'border-[#8f949c]',
        !step && !onDevice && (Math.floor(index / 4) % 2 === 0 ? 'bg-wash hover:bg-line' : 'bg-paper hover:bg-wash'),
        selected && 'ring-2 ring-ink ring-offset-1',
      )}
      style={{
        width: CELL, height: 30,
        // Steps heard from the Cycles look the same as steps written here.
        ...(step ? { backgroundColor: color, borderColor: color, opacity: 0.4 + (step.vel / 127) * 0.6 } : onDevice ? { backgroundColor: color, borderColor: color } : {}),
      }}
    >
      {step && muted && <span className="step-muted absolute inset-0" />}
      {step && late !== 0 && step.slice === undefined && (
        // White tick: where the hit really lands inside the step.
        <span className="absolute inset-y-1 w-[2px] bg-paper" style={{ left: `${Math.max(0, Math.min(94, 50 + late * 50))}%` }} />
      )}
      {step && step.chance < 100 && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-paper" />}
      {step?.slice !== undefined && <span className="mono absolute inset-0 grid place-items-center text-[10px] text-paper">{step.slice + 1}</span>}
    </button>
  );
});

function LaneHead({ lane }: { lane: number }) {
  const muted = useProject((s) => s.pattern().muted[lane]);
  const toggleMute = useProject((s) => s.toggleMute);
  const shift = useProject((s) => s.shift);
  const clearLane = useProject((s) => s.clearLane);
  const machineValue = useLive((s) => s.deviceParams[lane]?.[CC.machine]);
  const flash = useLive((s) => s.laneFlash[lane]);
  const ref = useRef<HTMLSpanElement>(null);
  const selectedSlice = useLive((s) => s.selectedSlice);

  useEffect(() => {
    if (flash) ref.current?.animate([{ background: 'var(--color-live)' }, { background: LANE_COLORS[lane] }], { duration: 160 });
  }, [flash, lane]);

  const name = LANE_NAMES[lane];
  const machine = lane < 6 && machineValue !== undefined ? MACHINES[machineValue] : null;

  return (
    <div className="flex items-center gap-1" style={{ width: LABEL - 6 }}>
      <Tip text={lane === CHOPS_LANE ? 'Plays the selected slice, from the laptop' : lane === FM_LANE ? 'Plays a note on the FM-1' : 'Trigger this track on the Cycles'}>
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-xs font-medium hover:underline"
          onClick={() => (lane === CHOPS_LANE ? audio.playSlice(selectedSlice, performance.now()) : lane === FM_LANE ? transport.triggerFm() : transport.trigger(lane))}
        >
          <span ref={ref} className="size-2.5 shrink-0" style={{ background: LANE_COLORS[lane] }} />
          <span className="truncate">{machine ? `${name} ${machine}` : name}</span>
        </button>
      </Tip>
      <Button size="icon" variant="ghost" aria-label={`Shift ${name} left`} onClick={() => shift(lane, -1)}><ChevronLeft className="size-3.5" /></Button>
      <Button size="icon" variant="ghost" aria-label={`Shift ${name} right`} onClick={() => shift(lane, 1)}><ChevronRight className="size-3.5" /></Button>
      <Tip text="Clear this lane"><Button size="icon" variant="ghost" aria-label={`Clear ${name}`} onClick={() => clearLane(lane)}><Trash2 className="size-3" /></Button></Tip>
      <Button size="icon" pressed={muted} aria-label={`Mute ${name}`} className="text-[10px]" onClick={() => toggleMute(lane)}>M</Button>
    </div>
  );
}

/** T1 to T6 set Level on the Cycles over MIDI; Chops and FM-1 are audio levels in the app. */
function LaneVolume({ lane }: { lane: number }) {
  const known = useLive((s) => s.deviceParams[lane]?.[CC.level]);
  const chopLevel = useProject((s) => s.chopLevel);
  const fmLevel = useProject((s) => s.fmLevel);
  const sendParam = useProject((s) => s.sendParam);
  const setTop = useProject((s) => s.setTop);
  const label = `${LANE_NAMES[lane]} volume`;
  if (lane === CHOPS_LANE) return <Fader label={label} value={chopLevel} max={1} onChange={(v) => { setTop({ chopLevel: v }); audio.setChopLevel(v); }} />;
  if (lane === FM_LANE) return <Fader label={label} value={fmLevel} max={1} onChange={(v) => { setTop({ fmLevel: v }); audio.setFmLevel(v); }} />;
  return <Fader label={label} value={known} max={127} onChange={(v) => sendParam(lane, 'level', Math.round(v))} />;
}

function Inspector() {
  const selected = useLive((s) => s.selectedStep);
  const set = useLive((s) => s.set);
  const step = useProject((s) => (selected ? s.pattern().lanes[selected.lane][selected.step] : null));
  const updateStep = useProject((s) => s.updateStep);
  const toggleStep = useProject((s) => s.toggleStep);

  if (!selected || !step) {
    return <p className="flex h-[52px] items-center text-xs text-muted">Click to add a step, click it again to delete it, and drag it to move it. Right-click any step to edit velocity, note, timing and chance. Steps from the Cycles appear as they play; capture them to edit them here.</p>;
  }
  const up = (patch: Partial<Step>) => updateStep(selected.lane, selected.step, patch);
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-x-6 gap-y-1">
      <Slider label="Velocity" value={step.vel} min={1} max={127} onChange={(vel) => up({ vel })} />
      <Slider label="Timing" value={step.micro} min={-23} max={23} format={(v) => `${v > 0 ? '+' : ''}${v}/24`} onChange={(micro) => up({ micro })} />
      <div className="row-span-2 flex flex-col justify-between">
        <span className="mono text-xs">{LANE_NAMES[selected.lane]} step {selected.step + 1}</span>
        <Button size="sm" onClick={() => { toggleStep(selected.lane, selected.step); set({ selectedStep: null }); }}>Remove</Button>
      </div>
      <Slider label="Note" value={step.note} min={24} max={96} format={noteName} onChange={(note) => up({ note })} />
      <Slider label="Chance" value={step.chance} min={1} max={100} format={(v) => `${v}%`} onChange={(chance) => up({ chance })} />
    </div>
  );
}

export function SequencerPart() {
  const pattern = useProject((s) => s.pattern());
  const current = useProject((s) => s.current);
  const page = useProject((s) => s.page);
  const swing = useProject((s) => s.swing);
  const setTop = useProject((s) => s.setTop);
  const setLength = useProject((s) => s.setLength);
  const shift = useProject((s) => s.shift);
  const toggleStep = useProject((s) => s.toggleStep);
  const moveStep = useProject((s) => s.moveStep);
  const selected = useLive((s) => s.selectedStep);
  const compareStraight = useLive((s) => s.compareStraight);
  const incoming = useLive((s) => s.incoming);
  const following = useLive((s) => s.playing && s.clockSource === 'device');
  const problem = mirrorProblem(useLive((s) => s.heard));
  const setLive = useLive((s) => s.set);
  const drag = useRef<{ lane: number; step: number } | null>(null);
  const keepOnClick = useRef(false);
  const clearAll = useProject((s) => s.clearAll);
  const captureSteps = useProject((s) => s.captureSteps);
  const [erased, setErased] = useState<(Pattern | null)[] | null>(null);
  const [captured, setCaptured] = useState(0);

  useEffect(() => {
    const end = () => { drag.current = null; };
    window.addEventListener('pointerup', end, true);
    return () => window.removeEventListener('pointerup', end, true);
  }, []);

  const onDown = (lane: number, step: number) => {
    keepOnClick.current = false;
    if (useProject.getState().pattern().lanes[lane][step]) {
      drag.current = { lane, step };
    } else if (!useLive.getState().incoming.some((h) => h.lane === lane && h.step === step)) {
      toggleStep(lane, step, lane === CHOPS_LANE ? { slice: useLive.getState().selectedSlice } : undefined);
      setLive({ selectedStep: { lane, step } });
      keepOnClick.current = true;
    }
  };

  const onEnter = (lane: number, step: number) => {
    const from = drag.current;
    if (!from || from.lane !== lane || from.step === step) return;
    if (useProject.getState().pattern().lanes[lane][step]) return;
    moveStep(lane, from.step, step);
    keepOnClick.current = true;
    drag.current = { lane, step };
    setLive({ selectedStep: { lane, step } });
  };

  // A plain click on a filled step deletes it. The click that just added or dragged a step does not.
  const onClickStep = (lane: number, step: number) => {
    if (keepOnClick.current) {
      keepOnClick.current = false;
      return;
    }
    if (!useProject.getState().pattern().lanes[lane][step]) return;
    toggleStep(lane, step);
    const sel = useLive.getState().selectedStep;
    if (sel?.lane === lane && sel.step === step) setLive({ selectedStep: null });
  };

  const onContext = (lane: number, step: number) => {
    if (useProject.getState().pattern().lanes[lane][step]) setLive({ selectedStep: { lane, step } });
  };

  const pages = pattern.length / 16;
  const shownSwing = compareStraight ? 50 : swing;
  const hitSet = new Set(incoming.map((h) => `${h.lane}:${h.step}`));

  return (
    <Part
      type="sequencer"
      width={880}
      status={following && problem ? <span className="text-live-dark">{problem.short}</span> : `Pattern ${patternName(current)}`}
      ports={[
        { id: 'midi-in', side: 'left', label: 'Control', top: 58 },
        { id: 'midi-out', side: 'right', label: 'Notes', top: 58 },
      ]}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Select
          ariaLabel="Pattern length"
          className="w-[88px]"
          value={String(pattern.length)}
          onChange={(v) => setLength(Number(v))}
          options={[16, 32, 48, 64].map((n) => ({ value: String(n), label: `${n} steps` }))}
        />
        {pages > 1 && (
          <Segmented
            ariaLabel="Page"
            value={String(page)}
            onChange={(v) => setTop({ page: Number(v) })}
            options={Array.from({ length: pages }, (_, i) => ({ value: String(i), label: `${i * 16 + 1}-${(i + 1) * 16}` }))}
          />
        )}
        {erased ? (
          <Button size="sm" onClick={() => { setTop({ patterns: erased }); setErased(null); setCaptured(0); }}>Undo</Button>
        ) : (
          <Button size="sm" onClick={() => { const before = useProject.getState().patterns; clearAll(); setErased(before); setLive({ selectedStep: null }); }}><Trash2 className="size-3" /> Erase all</Button>
        )}
        <Button
          size="sm"
          disabled={incoming.length === 0}
          onClick={() => {
            setErased(useProject.getState().patterns);
            captureSteps(incoming);
            setCaptured(incoming.length);
            setLive({ incoming: [] });
          }}
        >
          Capture from Cycles
        </Button>
        <span className="ml-auto text-xs">Shift all</span>
        <Button size="icon" aria-label="Shift everything left" onClick={() => shift('all', -1)}><ChevronLeft className="size-3.5" /></Button>
        <Button size="icon" aria-label="Shift everything right" onClick={() => shift('all', 1)}><ChevronRight className="size-3.5" /></Button>
      </div>

      <div className="relative">
        <Playhead page={page} />
        <div className="mb-1 flex gap-[2px]" style={{ paddingLeft: LABEL }}>
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={clsx('mono text-center text-[10px]', i % 4 === 0 ? 'text-ink' : 'text-muted')} style={{ width: CELL }}>
              {page * 16 + i + 1}
            </span>
          ))}
          <span className="ml-3 w-14 text-[10px] text-muted">Volume</span>
        </div>
        {Array.from({ length: LANES }, (_, lane) => (
          <div key={lane} className={clsx('flex items-center', lane === CHOPS_LANE ? 'mt-2 mb-[2px] border-t border-line pt-2' : 'mb-[2px]')}>
            <div style={{ width: LABEL }}><LaneHead lane={lane} /></div>
            <div className="flex gap-[2px]">
              {Array.from({ length: 16 }, (_, i) => {
                const index = page * 16 + i;
                return (
                  <StepCell
                    key={i}
                    lane={lane}
                    index={index}
                    step={pattern.lanes[lane][index]}
                    muted={pattern.muted[lane]}
                    selected={selected?.lane === lane && selected.step === index}
                    swing={shownSwing}
                    onDevice={hitSet.has(`${lane}:${index}`)}
                    onDown={onDown}
                    onClickStep={onClickStep}
                    onEnter={onEnter}
                    onContext={onContext}
                  />
                );
              })}
            </div>
            <div className="ml-3"><LaneVolume lane={lane} /></div>
          </div>
        ))}
      </div>

      {captured > 0 && (
        <p className="mt-2 text-xs text-live-dark">
          Captured {captured} steps into the app. The Cycles still plays its own copy too, so they double. Clear those trigs on the Cycles, and this grid is what it plays.
        </p>
      )}
      <div className="mt-3 border-t border-ink pt-2.5"><Inspector /></div>
    </Part>
  );
}
