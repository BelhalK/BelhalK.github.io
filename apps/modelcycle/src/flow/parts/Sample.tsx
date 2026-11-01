import { useEffect, useRef, useState } from 'react';
import { Circle, Download, Square } from 'lucide-react';
import { encodeWav, matchToCycles, peaks, sliceFeatures, toMono, type CyclesMatch } from '@/lib/analysis';
import { CHOPS_LANE } from '@/lib/cycles';
import { emptyLane, newStep } from '@/lib/pattern';
import { audio } from '@/engine/audio';
import { transport } from '@/engine/transport';
import { useLive } from '@/store/live';
import { isWired, useProject } from '@/store/project';
import { Button, Heading, Row, Segmented, Select } from '@/components/ui';
import { Part } from '../Part';

const download = (blob: Blob, name: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

function drawWave(canvas: HTMLCanvasElement, buffer: AudioBuffer) {
  const g = canvas.getContext('2d')!;
  const { width: W, height: H } = canvas;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#0e1116';
  peaks(toMono(buffer), W).forEach(([lo, hi], x) => {
    const top = ((1 - hi) / 2) * H;
    g.fillRect(x, top, 1, Math.max(1, ((hi - lo) / 2) * H));
  });
}

export function RecorderPart() {
  const inputs = useLive((s) => s.devices.inputs);
  const recording = useLive((s) => s.recording);
  const toChopper = useProject((s) => isWired(s.edges, 'recorder', 'chopper'));
  const [deviceId, setDeviceId] = useState('');
  const [armed, setArmed] = useState(false);
  const [take, setTake] = useState<AudioBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const level = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (deviceId || !inputs.length) return;
    setDeviceId((inputs.find((d) => /macbook|built|intégré/i.test(d.label)) ?? inputs[0]).deviceId);
  }, [inputs, deviceId]);

  useEffect(() => {
    if (!armed) return;
    let id = 0;
    const data = new Float32Array(2048);
    const loop = () => {
      audio.micAnalyser.getFloatTimeDomainData(data);
      let p = 0;
      for (const v of data) p = Math.max(p, Math.abs(v));
      if (level.current) level.current.style.width = `${Math.min(100, p * 100)}%`;
      if (useLive.getState().recording) setTime((performance.now() - startedAt.current) / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [armed]);

  useEffect(() => {
    if (take && canvas.current) drawWave(canvas.current, take);
  }, [take]);

  const arm = async () => {
    setError(null);
    try {
      await audio.armRecorder(deviceId);
      setArmed(true);
    } catch {
      setError('Could not open that input. Check the microphone permission in Chrome.');
    }
  };

  const record = async () => {
    if (recording) {
      audio.stopRecording();
      return;
    }
    startedAt.current = performance.now();
    setTime(0);
    try {
      setTake(await audio.startRecording());
    } catch {
      setError('The recording could not be decoded. Try again.');
    }
  };

  return (
    <Part type="recorder" width={340} status={recording ? 'Recording' : armed ? 'Input open' : 'Input closed'} ports={[
        { id: 'audio-out', side: 'right', label: 'Audio', top: 58 },
        { id: 'chop-out', side: 'bottom', label: 'To Chopper', top: 170 },
      ]}>
      <div className="flex items-center gap-2 text-xs">
        <span className="shrink-0">Input</span>
        <Select
          ariaLabel="Recording input"
          className="min-w-0 flex-1"
          value={deviceId || undefined}
          placeholder="Connect to list inputs"
          onChange={(v) => {
            setDeviceId(v);
            if (armed) { audio.disarmRecorder(); setArmed(false); }
          }}
          options={inputs.map((d) => ({ value: d.deviceId, label: d.label || 'Input' }))}
        />
      </div>
      <div className="mt-2.5 h-2 border border-ink"><div ref={level} className="h-full bg-ink" style={{ width: 0 }} /></div>

      <div className="mt-2.5 flex items-center gap-2">
        {!armed ? (
          <Button onClick={arm} disabled={!inputs.length}>Open input</Button>
        ) : (
          <Button variant={recording ? 'live' : 'outline'} onClick={record}>
            {recording ? <Square className="size-3.5" fill="currentColor" /> : <Circle className="size-3.5 text-live" fill="currentColor" />}
            {recording ? 'Stop' : 'Record'}
          </Button>
        )}
        <span className="mono ml-auto text-xs">{time.toFixed(1)} s</span>
      </div>
      {error && <p className="mt-2 text-xs text-live-dark">{error}</p>}

      {take ? (
        <>
          <canvas ref={canvas} width={632} height={140} className="mt-2.5 block h-[70px] w-full border border-line" />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => audio.previewBuffer(take)}>Play</Button>
            <Button size="sm" variant="solid" disabled={!toChopper} title={toChopper ? undefined : 'Connect the Recorder to the Chopper first'} onClick={() => audio.loadChopBuffer(take, `Recording ${take.duration.toFixed(1)} s`)}>Send to Chopper</Button>
            <Button size="sm" className="ml-auto" onClick={() => download(encodeWav(take), 'recording.wav')}><Download className="size-3" /> WAV</Button>
          </div>
        </>
      ) : (
        <p className="mt-2.5 text-xs text-muted">Record from the Mac's microphone, your iPhone, or the Cycles itself, then chop the take.</p>
      )}
    </Part>
  );
}

export function ChopperPart() {
  const chop = useLive((s) => s.chop);
  const version = useLive((s) => s.chopPeaksVersion);
  const selected = useLive((s) => s.selectedSlice);
  const setLive = useLive((s) => s.set);
  const slices = useProject((s) => s.slices);
  const chopSteps = useProject((s) => s.chopSteps);
  const bpm = useProject((s) => s.bpm);
  const setTop = useProject((s) => s.setTop);
  const [mode, setMode] = useState<'grid' | 'transient'>('grid');
  const [dragOver, setDragOver] = useState(false);
  const [detected, setDetected] = useState<number | null>(null);
  const [match, setMatch] = useState<CyclesMatch | null>(null);
  const [target, setTarget] = useState('4');
  const [error, setError] = useState<string | null>(null);
  const wave = useRef<HTMLCanvasElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const W = 800;
  const H = 150;

  useEffect(() => {
    if (audio.chopBuffer && wave.current) drawWave(wave.current, audio.chopBuffer);
    setDetected(audio.chopBpm());
  }, [version]);

  useEffect(() => setMatch(null), [selected, version, slices]);

  const open = async (f: File) => {
    setError(null);
    try {
      await audio.loadChop(await f.arrayBuffer(), f.name);
    } catch {
      setError(`Could not read ${f.name}. Try a WAV, MP3, AIFF or M4A file.`);
    }
  };

  const reslice = (nextMode: 'grid' | 'transient', count: number) => {
    setMode(nextMode);
    audio.sliceBy(nextMode, count);
  };

  const sampleLen = audio.chopBuffer?.length ?? 1;
  const span = audio.sliceSpan(selected);

  const clickWave = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const at = ((e.clientX - r.left) / r.width) * sampleLen;
    let index = 0;
    slices.forEach((s, i) => { if (s <= at) index = i; });
    setLive({ selectedSlice: index });
    audio.playSlice(index, performance.now());
  };

  const layOut = () => {
    const s = useProject.getState();
    const pattern = s.pattern();
    const lane = emptyLane();
    for (let i = 0; i < Math.min(slices.length, pattern.length); i++) lane[i] = newStep({ slice: i });
    const patterns = [...s.patterns];
    patterns[s.current] = { ...pattern, lanes: pattern.lanes.map((l, i) => (i === CHOPS_LANE ? lane : l)) };
    setTop({ patterns });
  };

  const applyMatch = () => {
    if (!match) return;
    const track = Number(target);
    const p = useProject.getState();
    p.sendMachine(track, match.machine);
    p.sendParam(track, 'decay', match.params.decay);
    p.sendParam(track, 'color', match.params.color);
    if (match.params.pitch !== undefined) p.sendParam(track, 'pitch', match.params.pitch);
    useLive.getState().set({ soloTrack: track });
    transport.trigger(track);
  };

  return (
    <Part
      type="chopper"
      width={820}
      status={chop ? chop.name : 'Plays from the laptop, in time with the Cycles'}
      ports={[
        { id: 'midi-in', side: 'left', label: 'MIDI', top: 58 },
        { id: 'chop-in', side: 'top', label: 'From Recorder', top: 610 },
        { id: 'audio-out', side: 'right', label: 'Audio', top: 58 },
      ]}
    >
      <input ref={file} type="file" accept="audio/*" hidden onChange={(e) => e.target.files?.[0] && open(e.target.files[0])} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0]) open(e.dataTransfer.files[0]);
        }}
      >
        {chop ? (
          <div className="relative cursor-pointer border border-ink" onClick={clickWave} role="button" aria-label="Waveform. Click a slice to select and hear it.">
            <canvas ref={wave} width={W * 2} height={H * 2} className="block h-[150px] w-full" />
            {span && (
              <span className="pointer-events-none absolute inset-y-0 bg-ink/10" style={{ left: `${(span.start / sampleLen) * 100}%`, width: `${((span.end - span.start) / sampleLen) * 100}%` }} />
            )}
            {slices.map((s, i) => (
              <span key={i} className="pointer-events-none absolute inset-y-0 w-px" style={{ left: `${(s / sampleLen) * 100}%`, background: '#0b8ea6' }}>
                <span className="mono absolute top-0.5 left-0.5 bg-paper px-0.5 text-[10px] text-ink">{i + 1}</span>
              </span>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => file.current?.click()}
            className={`grid h-[150px] w-full cursor-pointer place-items-center border border-dashed border-ink text-center ${dragOver ? 'bg-wash' : 'bg-paper hover:bg-wash'}`}
          >
            <span>
              <span className="block font-semibold">Drop a song here, or click to choose one</span>
              <span className="mt-1 block text-xs text-muted">WAV, MP3, AIFF or M4A. Stays on this laptop.</span>
            </span>
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-live-dark">{error}</p>}

      {chop && (
        <div className="mt-3 grid grid-cols-[1fr_1fr] gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                ariaLabel="Slice method"
                value={mode}
                onChange={(v) => reslice(v, chopSteps)}
                options={[{ value: 'grid', label: 'Even grid' }, { value: 'transient', label: 'On transients' }]}
              />
              <Segmented
                ariaLabel="Slice count"
                value={String(chopSteps)}
                onChange={(v) => reslice(mode, Number(v))}
                options={[8, 16, 32].map((n) => ({ value: String(n), label: String(n) }))}
              />
              <Button size="sm" onClick={() => file.current?.click()}>Replace</Button>
            </div>
            <div className="mt-2.5">
              <Row label="Length">{chop.duration.toFixed(2)} s</Row>
              <Row label="Estimated tempo">
                {detected ? `${detected} BPM` : 'Not clear'}
              </Row>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {detected && detected !== bpm && <Button size="sm" onClick={() => setTop({ bpm: detected })}>Use {detected} BPM</Button>}
              <Button size="sm" variant="solid" onClick={layOut}>Lay slices on the Chops lane</Button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-xs">Slice {selected + 1}</span>
              <Button size="sm" onClick={() => audio.playSlice(selected, performance.now())}>Play</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (span) download(encodeWav(audio.chopBuffer!, span.start, span.end), `slice-${selected + 1}.wav`);
                }}
              >
                <Download className="size-3" /> WAV
              </Button>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => {
                  const mono = audio.sliceMono(selected);
                  if (mono) setMatch(matchToCycles(sliceFeatures(mono, audio.chopBuffer!.sampleRate)));
                }}
              >
                Rebuild on the Cycles
              </Button>
            </div>
            <Heading>Nearest Cycles sound</Heading>
            {match ? (
              <>
                <Row label="Machine">{match.machine}</Row>
                <Row label="Heard">{match.reason}</Row>
                <Row label="Pitch / Decay / Color">{match.params.pitch ?? '--'} / {match.params.decay} / {match.params.color}</Row>
                <div className="mt-2 flex items-center gap-2">
                  <Select
                    ariaLabel="Target track"
                    className="w-20"
                    value={target}
                    onChange={setTarget}
                    options={[0, 1, 2, 3, 4, 5].map((t) => ({ value: String(t), label: `T${t + 1}` }))}
                  />
                  <Button size="sm" variant="solid" onClick={applyMatch}>Apply and play</Button>
                  <span className="text-xs text-muted">A starting point. Finish it by ear.</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted">The Model:Cycles has no sample memory, so audio cannot be loaded onto it. Slices play from this laptop in time with it, or the app can estimate an FM sound on the Cycles that gets close.</p>
            )}
          </div>
        </div>
      )}
    </Part>
  );
}
