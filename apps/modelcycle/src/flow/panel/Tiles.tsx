import { type ReactNode, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Circle, FolderOpen, ListPlus, Play, Search, Sparkles, Square, Undo2 } from 'lucide-react';
import { ANALYSER_FFT, audio } from '@/engine/audio';
import { transport } from '@/engine/transport';
import { CC, CHOPS_LANE, FM_LANE, LANE_COLORS, LANES, MATCH_LANE } from '@/lib/cycles';
import { emptyLane, newStep } from '@/lib/pattern';
import { toMono } from '@/lib/analysis';
import { matchPercent, trimTarget } from '@/lib/presetMatch';
import { type PresetProgress, type PresetResult, runPresetSearch } from '@/engine/presetSearch';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { FREQ_MAX, FREQ_MIN, RAMP, useAnimation, useInput } from '../parts/Mix';
import { drawWave, INPUT_ERRORS } from '../parts/Sample';
import { useGenerator } from '../parts/Llm';
import { applyPreset } from '../parts/SampleToPreset';

/*
 * The Panel's tiles: one job each, sized for fingers on a 1920 x 720 strip.
 * They drive the same project and engine as the canvas parts, so both views stay in step.
 */

/** A flat card. Everything inside is usage, no titles. */
export function Card({ grow, children, className }: { grow: number; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('relative min-w-0 overflow-hidden rounded-part border border-ink bg-paper', className)} style={{ flex: `${grow} 1 0` }}>
      {children}
    </div>
  );
}

const BIG = 'flex cursor-pointer items-center justify-center gap-2 rounded-part border border-ink font-semibold select-none disabled:cursor-not-allowed disabled:border-line disabled:text-muted';
const SOLID = 'bg-ink text-paper active:bg-[#2a2f37] disabled:bg-paper';
const OUTLINE = 'bg-paper text-ink active:bg-grid';

/** A canvas drawn at the size of its box, redrawn from scratch when the box changes. */
function useBoxSize() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSize({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [box, size] as const;
}

// Shape and Color

const PAD_DEFAULT = 64;

/** Color across, Shape up, on the track last picked in the Sequencer tile or moved on the Cycles. */
export function PadTile() {
  const track = useLive((s) => s.soloTrack);
  const color = useLive((s) => s.deviceParams[track]?.[CC.color]);
  const shape = useLive((s) => s.deviceParams[track]?.[CC.shape]);
  const sendParam = useProject((s) => s.sendParam);
  const ref = useRef<HTMLDivElement>(null);

  const update = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 127);
    sendParam(track, 'color', clamp((e.clientX - r.left) / r.width));
    sendParam(track, 'shape', clamp(1 - (e.clientY - r.top) / r.height));
  };

  const x = ((color ?? PAD_DEFAULT) / 127) * 100;
  const y = ((shape ?? PAD_DEFAULT) / 127) * 100;
  const hue = LANE_COLORS[track];
  return (
    <div
      ref={ref}
      role="group"
      aria-label={`Color and Shape for T${track + 1}`}
      className="absolute inset-0 cursor-crosshair touch-none bg-[linear-gradient(var(--color-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid)_1px,transparent_1px)] bg-[size:40px_40px]"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
      onPointerMove={(e) => { if (e.buttons) update(e); }}
      onLostPointerCapture={() => transport.previewKit(track)}
    >
      <span className="pointer-events-none absolute inset-y-0 w-px opacity-40" style={{ left: `${x}%`, background: hue }} />
      <span className="pointer-events-none absolute inset-x-0 h-px opacity-40" style={{ bottom: `${y}%`, background: hue }} />
      <span
        className="mono pointer-events-none absolute grid size-16 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full text-[15px] text-paper shadow-[0_2px_10px_rgb(14_17_22/0.25)]"
        style={{ left: `${x}%`, bottom: `${y}%`, background: hue }}
      >
        T{track + 1}
      </span>
    </div>
  );
}

// LLM

const STYLES = ['Deep house', 'Chicago jack', 'Garage shuffle', 'Minimal groove', 'Disco filter', 'Afro house'];
const LLM_STEPS = 32;

/** A field for the keyboard, and styles to tap for when there is none. */
export function LlmTile() {
  const [prompt, setPrompt] = useState('');
  const { generate, busy, error, made, canUndo, restore } = useGenerator();
  const [asked, setAsked] = useState<string | null>(null);
  const run = (text: string) => {
    setAsked(text);
    void generate(text, LLM_STEPS);
  };

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <textarea
        value={prompt}
        aria-label="Describe the pattern"
        placeholder="Describe a groove"
        maxLength={500}
        onChange={(e) => setPrompt(e.target.value)}
        className="h-[110px] shrink-0 resize-none rounded-part border border-ink p-3 text-[16px] placeholder:text-muted"
      />
      <button type="button" disabled={busy || !prompt.trim()} onClick={() => run(prompt)} className={clsx(BIG, SOLID, 'h-16 shrink-0 text-[17px]')}>
        <Sparkles className="size-5" /> {busy && asked === prompt ? 'Writing' : 'Generate'}
      </button>
      <div className="grid min-h-0 flex-1 grid-cols-2 auto-rows-fr gap-2">
        {STYLES.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => run(s)} className={clsx(BIG, OUTLINE, 'px-2 text-center text-[15px]', busy && asked === s && 'animate-pulse')}>
            {s}
          </button>
        ))}
      </div>
      {(error || made) && (
        <div className="flex h-12 shrink-0 items-center gap-2">
          <p className={clsx('min-w-0 flex-1 truncate text-[14px]', error ? 'text-live-dark' : 'text-muted')}>{error ?? made}</p>
          {canUndo && !error && (
            <button type="button" aria-label="Undo" onClick={restore} className={clsx(BIG, OUTLINE, 'size-12')}>
              <Undo2 className="size-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Sequencer

/** Tap a step to write or clear it, tap a colour to hear the row and point the pad at it. */
export function SequencerTile() {
  const pattern = useProject((s) => s.pattern());
  const page = useProject((s) => s.page);
  const setTop = useProject((s) => s.setTop);
  const toggleStep = useProject((s) => s.toggleStep);
  const matchRows = useProject((s) => s.matchRows);
  const solo = useLive((s) => s.soloTrack);
  const playing = useLive((s) => s.playing);
  const playStep = useLive((s) => s.step);

  const pages = Math.max(1, pattern.length / 16);
  const shown = Math.min(page, pages - 1);
  const lanes = Array.from({ length: LANES }, (_, l) => l).filter((l) => l < MATCH_LANE || matchRows[l - MATCH_LANE]);

  const audition = (lane: number) => {
    if (lane >= MATCH_LANE) transport.triggerMatch(lane);
    else if (lane === CHOPS_LANE) audio.playSlice(useLive.getState().selectedSlice, performance.now());
    else if (lane === FM_LANE) transport.triggerFm();
    else {
      useLive.getState().set({ soloTrack: lane });
      transport.trigger(lane);
    }
  };

  return (
    <div className="flex h-full gap-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {lanes.map((lane) => (
          <div key={lane} className={clsx('flex min-h-0 flex-1 gap-1', lane === CHOPS_LANE && 'mt-2')}>
            <button
              type="button"
              aria-label={`Hear row ${lane + 1}`}
              onClick={() => audition(lane)}
              className={clsx('w-14 shrink-0 cursor-pointer rounded-part', lane === solo && 'outline-3 outline-offset-2 outline-ink')}
              style={{ background: LANE_COLORS[lane] }}
            />
            {Array.from({ length: 16 }, (_, i) => {
              const index = shown * 16 + i;
              const step = pattern.lanes[lane][index];
              const now = playing && playStep === index;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Row ${lane + 1} step ${index + 1}${step ? ', on' : ''}`}
                  aria-pressed={!!step}
                  onClick={() => toggleStep(lane, index, lane === CHOPS_LANE && !step ? { slice: useLive.getState().selectedSlice } : undefined)}
                  className={clsx(
                    'min-w-0 flex-1 cursor-pointer rounded-[3px] border',
                    !step && (Math.floor(i / 4) % 2 === 0 ? 'border-[#b9bdc4] bg-wash' : 'border-[#b9bdc4] bg-paper'),
                    now && 'outline-2 outline-offset-1 outline-live',
                  )}
                  style={step ? { background: LANE_COLORS[lane], borderColor: LANE_COLORS[lane], opacity: (pattern.muted[lane] ? 0.3 : 0.45) + (step.vel / 127) * 0.55 } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex w-14 shrink-0 flex-col gap-1.5">
          {Array.from({ length: pages }, (_, p) => (
            <button
              key={p}
              type="button"
              aria-label={`Steps ${p * 16 + 1} to ${(p + 1) * 16}`}
              onClick={() => setTop({ page: p })}
              className={clsx(BIG, 'mono flex-1 text-[16px]', p === shown ? SOLID : OUTLINE)}
            >
              {p + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Spectrogram and Spectrum

const DB_FLOOR = -95;

/** Low notes at the bottom, newest sound on the right. */
export function SpectrogramTile({ id }: { id: string }) {
  const analyser = useInput(id);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [box, { w: W, h: H }] = useBoxSize();
  const bins = useRef<Float32Array<ArrayBuffer> | null>(null);
  const frame = useRef(0);

  useAnimation(() => {
    const c = canvas.current;
    if (!c || !analyser || !W || !H) return;
    const g = c.getContext('2d')!;
    if (!bins.current) bins.current = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(bins.current);
    frame.current++;
    if (frame.current % 2) return;
    g.drawImage(c, -2, 0);
    const image = g.createImageData(2, H);
    const binHz = audio.ctx!.sampleRate / ANALYSER_FFT;
    for (let y = 0; y < H; y++) {
      const f = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** (1 - y / H);
      const v = bins.current[Math.min(bins.current.length - 1, Math.round(f / binHz))];
      const level = Math.max(0, Math.min(255, ((v - DB_FLOOR) / 75) * 255));
      const [r, gr, b] = RAMP[Math.floor(isFinite(level) ? level : 0)];
      image.data.set([r, gr, b, 255, r, gr, b, 255], y * 8);
    }
    g.putImageData(image, W - 2, 0);
  }, !!analyser);

  return (
    <div ref={box} className="absolute inset-0">
      <canvas ref={canvas} width={W} height={H} className="block size-full" aria-label="Spectrogram" />
    </div>
  );
}

/** The live frequency curve, low on the left. */
export function SpectrumTile({ id }: { id: string }) {
  const analyser = useInput(id);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [box, { w: W, h: H }] = useBoxSize();
  const bins = useRef<Float32Array<ArrayBuffer> | null>(null);
  const smooth = useRef<Float32Array | null>(null);

  useAnimation(() => {
    const c = canvas.current;
    if (!c || !analyser || !W || !H) return;
    if (!bins.current) {
      bins.current = new Float32Array(analyser.frequencyBinCount);
      smooth.current = new Float32Array(analyser.frequencyBinCount).fill(-120);
    }
    const f = bins.current;
    const s = smooth.current!;
    analyser.getFloatFrequencyData(f);
    for (let i = 0; i < f.length; i++) {
      const v = isFinite(f[i]) ? f[i] : -120;
      s[i] = v > s[i] ? v : s[i] * 0.86 + v * 0.14;
    }
    const g = c.getContext('2d')!;
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, W, H);
    g.strokeStyle = '#eef0f2';
    g.lineWidth = 1;
    g.beginPath();
    for (const fq of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
      const x = (Math.log(fq / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * W;
      g.moveTo(x, 0);
      g.lineTo(x, H);
    }
    g.stroke();
    const binHz = audio.ctx!.sampleRate / ANALYSER_FFT;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x < W; x += 2) {
      const fq = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** (x / W);
      const v = s[Math.min(s.length - 1, Math.round(fq / binHz))];
      g.lineTo(x, Math.min(H, Math.max(0, ((-v - 10) / 80) * H)));
    }
    g.lineTo(W, H);
    g.closePath();
    g.fillStyle = 'rgb(14 17 22 / 0.1)';
    g.fill();
    g.strokeStyle = '#0e1116';
    g.lineWidth = 2.5;
    g.stroke();
  }, !!analyser);

  return (
    <div ref={box} className="absolute inset-0">
      <canvas ref={canvas} width={W * 2} height={H * 2} className="block size-full" aria-label="Live frequency spectrum" />
    </div>
  );
}

// Recorder

/** One button. The take goes straight to the Chopper and to Sample to Preset. */
export function RecorderTile() {
  const recording = useLive((s) => s.recording);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [take, setTake] = useState<AudioBuffer | null>(null);
  const [time, setTime] = useState(0);
  const ring = useRef<HTMLSpanElement>(null);
  const wave = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!recording) return;
    const started = performance.now();
    const data = new Float32Array(2048);
    let id = 0;
    const loop = () => {
      audio.micAnalyser.getFloatTimeDomainData(data);
      let p = 0;
      for (const v of data) p = Math.max(p, Math.abs(v));
      if (ring.current) ring.current.style.transform = `scale(${1 + Math.min(1, p) * 0.45})`;
      setTime((performance.now() - started) / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      if (ring.current) ring.current.style.transform = '';
    };
  }, [recording]);

  useEffect(() => {
    if (take && wave.current) drawWave(wave.current, take);
  }, [take]);

  const record = async () => {
    if (recording) {
      audio.stopRecording();
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // The system's default input: choose the audio interface there.
      await audio.armRecorder('');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setError(INPUT_ERRORS[name] ?? 'Could not open the input.');
      setBusy(false);
      return;
    }
    setBusy(false);
    try {
      const next = await audio.startRecording();
      setTake(next);
      audio.loadChopBuffer(next, `Recording ${next.duration.toFixed(1)} s`);
    } catch {
      setError('The recording could not be read. Try again.');
    } finally {
      audio.disarmRecorder();
    }
  };

  return (
    <div className="flex h-full flex-col items-center p-3">
      <div className="grid w-full flex-1 place-items-center">
        <button
          type="button"
          aria-label={recording ? 'Stop recording' : 'Record'}
          disabled={busy}
          onClick={() => void record()}
          className="relative grid size-44 cursor-pointer place-items-center rounded-full"
        >
          <span ref={ring} className={clsx('absolute inset-0 rounded-full transition-transform duration-75', recording ? 'bg-live/20' : 'bg-grid')} />
          <span className={clsx('relative grid size-32 place-items-center rounded-full border-2', recording ? 'border-live-dark bg-live-dark' : 'border-ink bg-paper')}>
            {recording ? <Square className="size-10 text-paper" fill="currentColor" /> : <Circle className="size-14 text-live" fill="currentColor" />}
          </span>
        </button>
      </div>
      <p className="mono h-9 text-[24px]">{recording || take ? `${(recording ? time : take!.duration).toFixed(1)} s` : ''}</p>
      {error && <p className="mb-2 text-center text-[14px] text-live-dark">{error}</p>}
      {take && !recording && (
        <button type="button" aria-label="Play the take" onClick={() => audio.previewBuffer(take)} className="flex h-20 w-full shrink-0 cursor-pointer items-center gap-3 rounded-part border border-ink px-3 active:bg-grid">
          <Play className="size-6 shrink-0" fill="currentColor" />
          <canvas ref={wave} width={600} height={120} className="block h-[60px] min-w-0 flex-1" />
        </button>
      )}
    </div>
  );
}

// Chopper

/** Slices as pads. Tap one to hear it; the Chops row plays the last one tapped. */
export function ChopperTile() {
  const chop = useLive((s) => s.chop);
  const version = useLive((s) => s.chopPeaksVersion);
  const selected = useLive((s) => s.selectedSlice);
  const slices = useProject((s) => s.slices);
  const chopSteps = useProject((s) => s.chopSteps);
  const [laid, setLaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wave = useRef<HTMLCanvasElement>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audio.chopBuffer && wave.current) drawWave(wave.current, audio.chopBuffer);
    setLaid(false);
  }, [version, chop]);

  const open = async (f: File) => {
    setError(null);
    try {
      await audio.loadChop(await f.arrayBuffer(), f.name);
    } catch {
      setError(`Could not read ${f.name}.`);
    }
  };

  const hit = (i: number) => {
    useLive.getState().set({ selectedSlice: i });
    audio.playSlice(i, performance.now());
  };

  const layOut = () => {
    const s = useProject.getState();
    const pattern = s.pattern();
    const lane = emptyLane();
    for (let i = 0; i < Math.min(slices.length, pattern.length); i++) lane[i] = newStep({ slice: i });
    const patterns = [...s.patterns];
    patterns[s.current] = { ...pattern, lanes: pattern.lanes.map((l, i) => (i === CHOPS_LANE ? lane : l)) };
    s.setTop({ patterns });
    setLaid(true);
  };

  const sampleLen = audio.chopBuffer?.length ?? 1;
  const span = audio.sliceSpan(selected);
  const input = <input ref={file} type="file" accept="audio/*" hidden onChange={(e) => e.target.files?.[0] && void open(e.target.files[0])} />;

  if (!chop) {
    return (
      <button type="button" onClick={() => file.current?.click()} className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 text-[17px] font-semibold active:bg-grid">
        {input}
        <FolderOpen className="size-12" />
        Open a sound
        {error && <span className="text-[14px] font-normal text-live-dark">{error}</span>}
      </button>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {input}
      <div className="flex h-14 shrink-0 gap-2">
        {[8, 16, 32].map((n) => (
          <button key={n} type="button" onClick={() => audio.sliceBy('grid', n)} className={clsx(BIG, 'mono w-16 text-[17px]', chopSteps === n ? SOLID : OUTLINE)}>
            {n}
          </button>
        ))}
        <div className="flex-1" />
        <button type="button" aria-label="Lay the slices on the Chops row" onClick={layOut} className={clsx(BIG, laid ? SOLID : OUTLINE, 'px-4 text-[15px]')}>
          <ListPlus className="size-5" /> To Chops row
        </button>
        <button type="button" aria-label="Open another sound" onClick={() => file.current?.click()} className={clsx(BIG, OUTLINE, 'w-14')}>
          <FolderOpen className="size-5" />
        </button>
      </div>
      <div className="relative h-[120px] shrink-0 rounded-part border border-ink">
        <canvas ref={wave} width={1400} height={240} className="block size-full" />
        {span && <span className="pointer-events-none absolute inset-y-0 bg-ink/10" style={{ left: `${(span.start / sampleLen) * 100}%`, width: `${((span.end - span.start) / sampleLen) * 100}%` }} />}
        {slices.map((s, i) => <span key={i} className="pointer-events-none absolute inset-y-0 w-px bg-[#0b8ea6]" style={{ left: `${(s / sampleLen) * 100}%` }} />)}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-8 auto-rows-fr gap-1.5">
        {slices.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slice ${i + 1}`}
            onPointerDown={() => hit(i)}
            className={clsx('mono cursor-pointer rounded-part border border-ink text-[16px] select-none', i === selected ? 'bg-ink text-paper' : 'bg-paper active:bg-grid')}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sample to Preset

const PRESET_TRACK = 5;

/** Finds the Cycles sound nearest the recorded hit, on T6, then compares the two. */
export function PresetTile() {
  const chop = useLive((s) => s.chop);
  const midiStatus = useLive((s) => s.midi);
  const audioStatus = useLive((s) => s.audio);
  const playing = useLive((s) => s.playing);
  const [progress, setProgress] = useState<PresetProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<{ result: PresetResult; target: Float32Array; sampleRate: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const blocker =
    !chop ? 'Record a sound first'
    : midiStatus !== 'connected' || audioStatus !== 'connected' ? 'Connect the Cycles first'
    : playing ? 'Stop to search'
    : null;

  const start = async () => {
    const buffer = audio.chopBuffer;
    if (!buffer) return;
    const target = trimTarget(toMono(buffer), buffer.sampleRate);
    if (!target) {
      setError('Too quiet to match');
      return;
    }
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    setFound(null);
    setProgress(null);
    setRunning(true);
    try {
      const result = await runPresetSearch(target, buffer.sampleRate, PRESET_TRACK, controller.signal, setProgress);
      if (result) {
        setFound({ result, target, sampleRate: buffer.sampleRate });
        applyPreset(PRESET_TRACK, result);
      } else if (!controller.signal.aborted) setError('No trial made a usable sound');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The search stopped');
    } finally {
      setRunning(false);
    }
  };

  const play = (data: Float32Array, sampleRate: number) => {
    const buffer = audio.ctx!.createBuffer(1, data.length, sampleRate);
    buffer.getChannelData(0).set(data);
    audio.previewBuffer(buffer);
  };

  const shown = running ? progress?.best : found?.result;
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {shown ? (
          <>
            <span className="mono text-[64px] leading-none">{matchPercent(shown.distance)}%</span>
            <span className="text-[16px]">{shown.candidate.machine} on T{PRESET_TRACK + 1}</span>
          </>
        ) : (
          <Search className="size-14 text-line" />
        )}
        {running && <span className="mono text-[15px] text-muted">{progress?.trial ?? 0} / {progress?.total ?? 150}</span>}
        {(error || (blocker && !running && !found)) && <span className="text-[15px] text-muted">{error ?? blocker}</span>}
        {/* The search cannot put the old sound back, so this one line stays. */}
        {!error && !blocker && !running && <span className="text-[15px] text-muted">Replaces the sound on T{PRESET_TRACK + 1}</span>}
      </div>
      {found && !running && (
        <div className="grid h-16 shrink-0 grid-cols-2 gap-2">
          <button type="button" onClick={() => play(found.target, found.sampleRate)} className={clsx(BIG, OUTLINE, 'text-[15px]')}><Play className="size-5" /> Mine</button>
          <button type="button" onClick={() => transport.trigger(PRESET_TRACK)} className={clsx(BIG, OUTLINE, 'text-[15px]')}><Play className="size-5" /> Cycles</button>
        </div>
      )}
      {running ? (
        <button type="button" onClick={() => abort.current?.abort()} className={clsx(BIG, 'h-20 shrink-0 border-live-dark bg-live-dark text-[18px] text-paper')}>Stop</button>
      ) : (
        <button type="button" disabled={!!blocker} onClick={() => void start()} className={clsx(BIG, SOLID, 'h-20 shrink-0 text-[18px]')}>
          <Search className="size-5" /> {found ? 'Search again' : 'Find preset'}
        </button>
      )}
    </div>
  );
}
