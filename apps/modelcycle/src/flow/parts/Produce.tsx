import { useEffect, useRef, useState } from 'react';
import { CC, BANKS, MACHINES, type Machine, PATTERNS_PER_BANK, patternName, SOUND_CONTROLS, type SoundParam } from '@/lib/cycles';
import { GROOVES } from '@/lib/grooves';
import type { Pattern } from '@/lib/pattern';
import { STARTER_SOUNDS, type Sound } from '@/lib/sounds';
import { midi } from '@/engine/midi';
import { transport } from '@/engine/transport';
import { useLive } from '@/store/live';
import { isWired, useProject } from '@/store/project';
import { Button, Heading, Select, Segmented, Slider, Switch } from '@/components/ui';
import { clsx } from 'clsx';
import { Part } from '../Part';

/** Sixteenths on a straight grid above, and where swing really places them below. */
function SwingDiagram({ swing }: { swing: number }) {
  const W = 340;
  const stepW = W / 8;
  return (
    <svg viewBox={`0 0 ${W} 44`} className="w-full" role="img" aria-label={`Timing at ${swing} percent swing`}>
      <line x1="0" y1="22" x2={W} y2="22" stroke="var(--color-line)" />
      {Array.from({ length: 8 }, (_, i) => {
        const x = i * stepW + 4;
        const late = i % 2 ? stepW * ((2 * swing) / 100 - 1) : 0;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1="4" y2="20" stroke="var(--color-line)" strokeWidth="2" />
            <line x1={x + late} x2={x + late} y1="24" y2="40" stroke="var(--color-ink)" strokeWidth="2" />
            {late > 0 && <line x1={x} x2={x + late} y1="22" y2="22" stroke="var(--color-ink)" strokeWidth="1" />}
          </g>
        );
      })}
    </svg>
  );
}

export function GroovePart() {
  const swing = useProject((s) => s.swing);
  const grooveId = useProject((s) => s.grooveId);
  const loadGroove = useProject((s) => s.loadGroove);
  const setTop = useProject((s) => s.setTop);
  const compareStraight = useLive((s) => s.compareStraight);
  const setLive = useLive((s) => s.set);
  const [undo, setUndo] = useState<{ patterns: (Pattern | null)[]; bpm: number; swing: number; grooveId: string | null } | null>(null);
  const groove = GROOVES.find((g) => g.id === grooveId);
  const wired = useProject((s) => isWired(s.edges, 'groove', 'sequencer'));

  return (
    <Part
      type="groove"
      width={806}
      status={wired ? 'Starting points to learn from' : 'Not connected, Sequencer plays straight'}
      ports={[{ id: 'midi-out', side: 'left', label: 'Timing', top: 58 }]}
    >
      <div className="grid grid-cols-[1fr_1fr] gap-6">
        <div>
          <Slider label="Swing" value={swing} min={50} max={75} format={(v) => `${v}%`} onChange={(v) => setTop({ swing: v })} />
          <div className="mt-2"><SwingDiagram swing={compareStraight ? 50 : swing} /></div>
          <p className="mt-1 text-xs text-muted">Top row is the straight grid. Bottom row is where your 16ths land.</p>
          <Button className="mt-2.5" pressed={compareStraight} onClick={() => setLive({ compareStraight: !compareStraight })}>
            {compareStraight ? 'Hearing straight, click for swing' : 'Compare with straight'}
          </Button>
        </div>
        <div>
          <div className="flex flex-wrap gap-1">
            {GROOVES.map((g) => (
              <Button
                key={g.id}
                size="sm"
                pressed={grooveId === g.id}
                onClick={() => {
                  const s = useProject.getState();
                  setUndo({ patterns: s.patterns, bpm: s.bpm, swing: s.swing, grooveId: s.grooveId });
                  loadGroove(g);
                }}
              >
                {g.name}
              </Button>
            ))}
          </div>
          {groove ? (
            <dl className="mt-2.5 space-y-1.5 text-xs">
              <div><dt className="font-semibold">Listen for</dt><dd className="text-muted">{groove.listenFor}</dd></div>
              <div><dt className="font-semibold">Try this</dt><dd className="text-muted">{groove.tryThis}</dd></div>
            </dl>
          ) : (
            <p className="mt-2.5 text-xs text-muted">Loading a groove replaces the current pattern and sets its tempo and swing. Lanes assume T1 kick, T2 snare, T3 metal, T4 perc, T5 tone and T6 chord.</p>
          )}
          {undo && (
            <Button size="sm" variant="ghost" className="mt-1.5 underline" onClick={() => { setTop(undo); setUndo(null); }}>
              Undo and restore my pattern
            </Button>
          )}
        </div>
      </div>
    </Part>
  );
}

const formatBytes = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`);

function DeviceProjects() {
  const link = useLive((s) => s.deviceLink);
  const playing = useLive((s) => s.playing);
  return (
    <>
      <Heading>Projects on the Cycles</Heading>
      {link.status === 'idle' && <p className="text-xs text-muted">Connect the Cycles to list its projects.</p>}
      {link.status === 'reading' && <p className="text-xs text-muted">Asking the Cycles.</p>}
      {link.status === 'no-sysex' && (
        <>
          <p className="text-xs text-muted">Listing projects needs Chrome's permission for system exclusive messages.</p>
          <Button size="sm" className="mt-2" onClick={() => void midi.connect()}>Allow and read projects</Button>
        </>
      )}
      {link.status === 'no-reply' && <p className="text-xs text-live-dark">The Cycles did not answer. Quit and reopen Chrome, which can stop hearing MIDI after a long run, then check that the Cycles' MIDI ports include USB.</p>}
      {link.status === 'error' && <p className="text-xs text-live-dark">The Cycles answered, but its reply could not be read: {link.message}.</p>}
      {link.status === 'ready' && !link.projects && (
        <p className="text-xs text-muted">{link.name}, OS {link.version}. It does not list its projects over USB, so manage them on the Cycles.</p>
      )}
      {link.status === 'ready' && link.projects && (
        <>
          <p className="text-xs">{link.name}, OS {link.version}: {link.projects.length} {link.projects.length === 1 ? 'project' : 'projects'}.</p>
          {link.projects.length > 0 && (
            <div className="nowheel mt-1.5 max-h-[180px] overflow-y-auto border-y border-line">
              {link.projects.map((p) => (
                <div key={p.slot} className="flex items-center gap-2 border-b border-line px-1 py-1 text-xs last:border-b-0">
                  <span className="mono text-muted">{String(p.slot).padStart(3, '0')}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="mono text-muted">{formatBytes(p.bytes)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {((link.status === 'ready' && link.projects) || link.status === 'no-reply' || link.status === 'error') && (
        <Button size="sm" className="mt-2" disabled={playing} onClick={() => void midi.readDevice()}>Read again</Button>
      )}
    </>
  );
}

export function BanksPart() {
  const patterns = useProject((s) => s.patterns);
  const current = useProject((s) => s.current);
  const selectPattern = useProject((s) => s.selectPattern);
  const copyPatternTo = useProject((s) => s.copyPatternTo);
  const sendPC = useProject((s) => s.sendProgramChange);
  const setTop = useProject((s) => s.setTop);
  const [copying, setCopying] = useState(false);
  const wired = useProject((s) => isWired(s.edges, 'banks', 'sequencer'));
  const devicePattern = useLive((s) => s.devicePattern);

  const hasSteps = (p: Pattern | null) => !!p?.lanes.some((l) => l.some(Boolean));

  return (
    <Part
      type="banks"
      width={340}
      status={wired ? `Editing ${patternName(current)}` : 'Not connected'}
      ports={[{ id: 'midi-out', side: 'left', label: 'Pattern', top: 58 }]}
    >
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `14px repeat(${PATTERNS_PER_BANK}, 1fr)` }}>
        {BANKS.map((bank, b) => (
          <div key={bank} className="contents">
            <span className="mono self-center text-[10px]">{bank}</span>
            {Array.from({ length: PATTERNS_PER_BANK }, (_, i) => {
              const index = b * PATTERNS_PER_BANK + i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Pattern ${patternName(index)}${hasSteps(patterns[index]) ? ', has steps' : ', empty'}${index === devicePattern ? ', on the Cycles now' : ''}`}
                  aria-current={index === current}
                  title={patternName(index)}
                  disabled={!wired}
                  onClick={() => {
                    if (copying) {
                      copyPatternTo(index);
                      setCopying(false);
                    } else selectPattern(index);
                  }}
                  className={clsx(
                    'h-4 cursor-pointer rounded-[1px] border',
                    'border-[#8f949c] disabled:cursor-not-allowed',
                    hasSteps(patterns[index]) ? 'border-transparent bg-[#1f5fd6]' : Math.floor(i / 4) % 2 === 0 ? 'bg-wash hover:bg-line' : 'bg-paper hover:bg-wash',
                    index === current && 'border-ink! bg-ink! ring-2 ring-ink ring-offset-1',
                    index === devicePattern && 'outline-2 outline-offset-1 outline-live',
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Button size="sm" pressed={copying} onClick={() => setCopying(!copying)}>
          {copying ? 'Click a slot to copy into' : `Copy ${patternName(current)} to`}
        </Button>
      </div>
      <div className="mt-2.5"><Switch label="Also switch the device pattern (Program Change)" checked={sendPC} onChange={(v) => setTop({ sendProgramChange: v })} /></div>
      <p className="mt-1.5 text-xs">
        {devicePattern !== null ? <>The Cycles is on <span className="mono font-semibold text-live-dark">{patternName(devicePattern)}</span>, outlined in red.</> : 'Change pattern on the Cycles to mark it here. This needs program change output turned on in its MIDI settings.'}
      </p>
      <p className="mt-1.5 text-xs text-muted">The filled slots are patterns written in this app. The app cannot read the patterns stored on the Cycles yet, only which one it is on.</p>
      <DeviceProjects />
    </Part>
  );
}

type PadPoint = { x: number; y: number };

// Where the dot sits, and where Back returns to, while the device has not told us a value.
const PAD_DEFAULT = 64;

function XYPad({ x, y, previous, onChange, onGrab, onRelease, onBack }: {
  x: number | undefined;
  y: number | undefined;
  previous: PadPoint | undefined;
  onChange: (x: number, y: number) => void;
  onGrab: () => void;
  onRelease: () => void;
  onBack: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const update = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 127);
    onChange(clamp((e.clientX - r.left) / r.width), clamp(1 - (e.clientY - r.top) / r.height));
  };
  return (
    <div
      ref={ref}
      role="group"
      aria-label="Color and Shape pad"
      className="nopan relative h-24 cursor-crosshair touch-none rounded-[2px] border border-ink bg-[linear-gradient(var(--color-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid)_1px,transparent_1px)] bg-[size:12px_12px]"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onGrab(); update(e); }}
      onPointerMove={(e) => { if (e.buttons) update(e); }}
      onLostPointerCapture={onRelease}
    >
      <span className="absolute bottom-0.5 left-1 text-[10px] text-muted">Color</span>
      <span className="absolute top-0.5 left-1 text-[10px] text-muted">Shape</span>
      {previous && (
        <>
          <span
            data-testid="xy-previous"
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border border-dashed border-muted"
            style={{ left: `${(previous.x / 127) * 100}%`, bottom: `${(previous.y / 127) * 100}%` }}
          />
          <Button size="sm" className="absolute top-1 right-1" onPointerDown={(e) => e.stopPropagation()} onClick={onBack}>Back</Button>
        </>
      )}
      {/* Hollow until the device or this app has given both values: the centre is only a placeholder. */}
      <span
        data-testid="xy-dot"
        className={clsx('pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border border-ink', x !== undefined && y !== undefined ? 'bg-ink' : 'bg-paper')}
        style={{ left: `${((x ?? PAD_DEFAULT) / 127) * 100}%`, bottom: `${((y ?? PAD_DEFAULT) / 127) * 100}%` }}
      />
    </div>
  );
}

const LIT_MS = 900;

export function SoundsPart() {
  // Each Sounds node can sit on its own track; the Chopper can still point them at one.
  const requested = useLive((s) => s.soloTrack);
  const [track, setTrack] = useState(requested);
  const wired = useProject((s) => isWired(s.edges, 'sounds', 'sequencer') && isWired(s.edges, 'sequencer', 'cycles'));
  useEffect(() => setTrack(requested), [requested]);
  // Moving a control on the Cycles brings its track here and marks the control until the moves stop.
  const touched = useLive((s) => s.touched);
  const [lit, setLit] = useState<number | null>(null);
  useEffect(() => {
    if (!touched) return;
    setTrack(touched.track);
    setLit(touched.cc);
    const timer = setTimeout(() => setLit(null), LIT_MS);
    return () => clearTimeout(timer);
  }, [touched]);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!hovered) return;
    const { set } = useLive.getState();
    set({ auditionTrack: track });
    return () => set({ auditionTrack: null });
  }, [hovered, track]);
  const known = useLive((s) => s.deviceParams[track]);
  const mySounds = useProject((s) => s.mySounds);
  const trackSound = useProject((s) => s.trackSound[track]);
  const sendParam = useProject((s) => s.sendParam);
  const sendMachine = useProject((s) => s.sendMachine);
  const applySound = useProject((s) => s.applySound);
  const saveSound = useProject((s) => s.saveSound);
  const deleteSound = useProject((s) => s.deleteSound);

  const machine: Machine | undefined = known?.[CC.machine] !== undefined ? MACHINES[known[CC.machine]] : undefined;
  const value = (key: SoundParam) => known?.[CC[key]];
  const sounds: Sound[] = [...STARTER_SOUNDS, ...mySounds].filter((s) => !machine || s.machine === machine);

  // Where the pad dot has been on each track, so each move can be stepped back. Kept for this session only.
  const [padHistory, setPadHistory] = useState<Record<number, PadPoint[]>>({});
  const trail = padHistory[track] ?? [];
  const grabbed = useRef<PadPoint | null>(null);
  const color = value('color');
  const shape = value('shape');
  const grabPad = () => {
    grabbed.current = { x: color ?? PAD_DEFAULT, y: shape ?? PAD_DEFAULT };
  };
  const releasePad = () => {
    const from = grabbed.current;
    grabbed.current = null;
    if (wired) transport.previewKit(track);
    if (!from || (color === undefined && shape === undefined) || (from.x === color && from.y === shape)) return;
    setPadHistory((h) => ({ ...h, [track]: [...(h[track] ?? []), from] }));
  };
  const backPad = () => {
    const to = trail[trail.length - 1];
    if (!to || !wired) return;
    sendParam(track, 'color', to.x);
    sendParam(track, 'shape', to.y);
    setPadHistory((h) => ({ ...h, [track]: trail.slice(0, -1) }));
  };

  const save = () => {
    if (!machine || !known) return;
    const params: Sound['params'] = {};
    for (const { key } of SOUND_CONTROLS) if (known[CC[key]] !== undefined) params[key] = known[CC[key]];
    saveSound(track, `My ${machine.toLowerCase()} ${mySounds.filter((s) => s.machine === machine).length + 1}`, machine, params);
  };

  return (
    <Part
      type="sounds"
      width={380}
      status={wired ? '-- means not yet known' : 'Not connected'}
      onHover={setHovered}
      ports={[{ id: 'midi-out', side: 'right', label: 'Sound', top: 58 }]}
    >
      <div className="flex items-center gap-2">
        <Segmented
          ariaLabel="Track"
          value={String(track)}
          onChange={(v) => setTrack(Number(v))}
          options={[0, 1, 2, 3, 4, 5].map((t) => ({ value: String(t), label: `T${t + 1}` }))}
          className="flex-1"
        />
        <Button size="sm" variant="solid" onClick={() => transport.trigger(track)}>Play</Button>
      </div>
      <div className={clsx('mt-2.5 flex items-center gap-2 text-xs transition-colors duration-150', lit === CC.machine && 'bg-live/15')}>
        <span className="w-[84px]">Machine</span>
        <Select
          ariaLabel="Machine"
          className="flex-1"
          value={machine}
          placeholder="Not known yet"
          onChange={(v) => {
            if (!wired) return;
            sendMachine(track, v as Machine);
            transport.previewKit(track);
          }}
          options={MACHINES.map((m) => ({ value: m, label: m }))}
        />
      </div>
      <div className="mt-2.5">
        <XYPad
          x={color}
          y={shape}
          previous={wired ? trail[trail.length - 1] : undefined}
          onGrab={grabPad}
          onRelease={releasePad}
          onBack={backPad}
          onChange={(x, y) => {
            if (!wired) return;
            sendParam(track, 'color', x);
            sendParam(track, 'shape', y);
          }}
        />
      </div>
      <div className="mt-2.5 space-y-0.5">
        {SOUND_CONTROLS.map(({ key, label }) => (
          <Slider key={key} label={label} value={value(key)} lit={lit === CC[key]} disabled={!wired} onChange={(v) => sendParam(track, key, v)} onCommit={() => transport.previewKit(track)} />
        ))}
      </div>
      <Heading>Sound bank</Heading>
      <div className="nowheel max-h-[150px] overflow-y-auto border-y border-line">
        {sounds.map((s) => (
          <div key={s.id} className={clsx('flex items-center gap-2 border-b border-line px-1 py-1 text-xs last:border-b-0', trackSound === s.id && 'bg-wash font-semibold')}>
            <button type="button" className="min-w-0 flex-1 cursor-pointer truncate text-left hover:underline" disabled={!wired} onClick={() => { applySound(track, s); transport.trigger(track); }}>
              {s.name}
            </button>
            <span className="text-muted">{s.machine}</span>
            {s.mine && <Button size="sm" variant="ghost" onClick={() => deleteSound(s.id)}>Delete</Button>}
          </div>
        ))}
      </div>
      <Button size="sm" className="mt-2" disabled={!machine} onClick={save}>Save as my sound</Button>
    </Part>
  );
}
