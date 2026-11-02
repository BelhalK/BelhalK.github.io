import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { peaks, toMono } from '@/lib/analysis';
import { MATCH_LANE } from '@/lib/cycles';
import { matchPercent, trimTarget } from '@/lib/presetMatch';
import { audio } from '@/engine/audio';
import { CAPTURE_LEVEL, type PresetProgress, type PresetResult, runPresetSearch } from '@/engine/presetSearch';
import { transport } from '@/engine/transport';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { Button, Heading, Row, Segmented, Select } from '@/components/ui';
import { baseType } from '../defaults';
import { Part } from '../Part';
import { FIT_PADDING } from '../PartsNav';

function Wave({ data, label }: { data: Float32Array; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = canvas.current?.getContext('2d');
    if (!g) return;
    const { width: W, height: H } = g.canvas;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#0e1116';
    peaks(data, W).forEach(([lo, hi], x) => g.fillRect(x, ((1 - hi) / 2) * H, 1, Math.max(1, ((hi - lo) / 2) * H)));
  }, [data]);
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-xs text-muted">{label}</p>
      <canvas ref={canvas} width={380} height={100} className="block h-[50px] w-full border border-line" aria-label={`${label} waveform`} />
    </div>
  );
}

const asBuffer = (data: Float32Array, sampleRate: number) => {
  const buffer = audio.ctx!.createBuffer(1, data.length, sampleRate);
  buffer.getChannelData(0).set(data);
  return buffer;
};

export function SampleToPresetPart() {
  const chop = useLive((s) => s.chop);
  const selected = useLive((s) => s.selectedSlice);
  const midiStatus = useLive((s) => s.midi);
  const audioStatus = useLive((s) => s.audio);
  const playing = useLive((s) => s.playing);
  const [source, setSource] = useState<'take' | 'slice'>('take');
  const [track, setTrack] = useState('5');
  const [progress, setProgress] = useState<PresetProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [row, setRow] = useState('0');
  const [addedRow, setAddedRow] = useState<number | null>(null);
  const [newRow, setNewRow] = useState<number | null>(null);
  const rowsFull = useProject((s) => s.matchRows.every(Boolean));
  const [found, setFound] = useState<{ result: PresetResult; target: Float32Array; track: number; sampleRate: number } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const { fitView } = useReactFlow();

  useEffect(() => () => abort.current?.abort(), []);

  const blocker =
    !chop ? 'Record a hit and choose Match on Cycles, or load a sound into the Chopper.'
    : midiStatus !== 'connected' ? 'Connect the Cycles first: the search plays every trial on it.'
    : audioStatus !== 'connected' ? 'The app cannot hear the Cycles yet. Connect its USB audio first.'
    : playing ? 'Stop the transport to search.'
    : null;

  const start = async () => {
    const buffer = audio.chopBuffer;
    const data = source === 'take' && buffer ? toMono(buffer) : audio.sliceMono(selected);
    if (!buffer || !data) return;
    const target = trimTarget(data, buffer.sampleRate);
    if (!target) {
      setError('That sound is too quiet to match. Record it closer to the microphone.');
      return;
    }
    const t = Number(track);
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    setFound(null);
    setSavedId(null);
    setAddedRow(null);
    setNewRow(null);
    setProgress(null);
    setRunning(true);
    try {
      const result = await runPresetSearch(target, buffer.sampleRate, t, controller.signal, setProgress);
      if (result) {
        setFound({ result, target, track: t, sampleRate: buffer.sampleRate });
        setRow(String(t));
        applyToTrack(t, result);
      } else if (!controller.signal.aborted) {
        setError('No trial made a usable sound.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The search stopped.');
    } finally {
      setRunning(false);
    }
  };

  const applyToTrack = (t: number, result: PresetResult) => {
    const p = useProject.getState();
    p.sendMachine(t, result.candidate.machine);
    for (const [key, value] of Object.entries(result.candidate.params)) p.sendParam(t, key as keyof typeof result.candidate.params, value);
    p.sendParam(t, 'delay', 0);
    p.sendParam(t, 'reverb', 0);
    // The search left the track at this level, so the app should show it.
    p.sendParam(t, 'level', CAPTURE_LEVEL);
    useLive.getState().set({ soloTrack: t });
  };

  const backToBack = () => {
    if (!found) return;
    const first = audio.previewBuffer(asBuffer(found.target, found.sampleRate));
    if (first) first.onended = () => audio.previewBuffer(asBuffer(found.result.capture, found.sampleRate));
  };

  const save = () => {
    if (!found) return null;
    const p = useProject.getState();
    const existing = p.mySounds.find((s) => s.id === savedId);
    if (existing) return existing;
    const { candidate } = found.result;
    const count = p.mySounds.filter((s) => s.name.startsWith('Sample match')).length + 1;
    const sound = p.saveSound(found.track, `Sample match ${count}`, candidate.machine, { ...candidate.params, delay: 0, reverb: 0, level: CAPTURE_LEVEL });
    setSavedId(sound.id);
    return sound;
  };

  /** The Cycles has six tracks, so the sound takes over a track's row instead of adding a seventh voice. */
  const addToSequencer = () => {
    const sound = save();
    if (!sound) return;
    const track = Number(row);
    const p = useProject.getState();
    p.applySound(track, sound);
    useLive.getState().set({ soloTrack: track });
    setAddedRow(track);
    const sequencer = p.nodes.find((n) => baseType(n.id) === 'sequencer')?.id ?? p.addPart('sequencer', { x: 0, y: 0 });
    setTimeout(() => void fitView({ nodes: [{ id: sequencer }], padding: FIT_PADDING, maxZoom: 1, duration: 250 }), 80);
  };

  /** Plays what the Cycles recorded, from the laptop, so no track has to give up its sound. */
  const addAsNewRow = async () => {
    const sound = save();
    if (!sound || !found) return;
    const p = useProject.getState();
    const id = crypto.randomUUID();
    await audio.addMatch(id, found.result.capture, found.sampleRate);
    const lane = p.addMatchRow({ id, name: sound.name });
    if (lane === null) return audio.removeMatch(id);
    audio.sync(useProject.getState().nodes, useProject.getState().edges);
    setNewRow(lane - MATCH_LANE + 1);
    const sequencer = useProject.getState().nodes.find((n) => baseType(n.id) === 'sequencer')?.id ?? useProject.getState().addPart('sequencer', { x: 0, y: 0 });
    setTimeout(() => void fitView({ nodes: [{ id: sequencer }], padding: FIT_PADDING, maxZoom: 1, duration: 250 }), 80);
  };

  const best = progress?.best;

  return (
    <Part
      type="preset"
      width={420}
      status={running ? `Trial ${progress?.trial ?? 0} of ${progress?.total ?? 150}` : found ? `${matchPercent(found.result.distance)}% match` : 'Plays trials on the Cycles'}
      ports={[
        { id: 'chop-in', side: 'top', label: 'From Chopper', top: 210 },
        { id: 'midi-in', side: 'left', label: 'MIDI', top: 58 },
        { id: 'audio-out', side: 'right', label: 'Audio', top: 58 },
      ]}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          ariaLabel="Sound to match"
          value={source}
          onChange={setSource}
          options={[{ value: 'take', label: 'First hit' }, { value: 'slice', label: `Slice ${selected + 1}` }]}
        />
        <Select
          ariaLabel="Track to use"
          className="w-20"
          value={track}
          onChange={setTrack}
          options={[0, 1, 2, 3, 4, 5].map((t) => ({ value: String(t), label: `T${t + 1}` }))}
        />
      </div>
      <p className="mt-2 text-xs">This replaces the sound on T{Number(track) + 1}, and the app cannot put it back. Save anything you want to keep on the Cycles first.</p>
      <p className="mt-1 text-xs text-muted">About 150 trials, usually a few minutes. The app's monitor is muted, but the Cycles' own outputs still sound.</p>
      {blocker && !running && <p className="mt-2 text-xs text-muted">{blocker}</p>}
      <div className="mt-2.5 flex items-center gap-2">
        {running
          ? <Button variant="live" onClick={() => abort.current?.abort()}>Stop and keep best</Button>
          : <Button variant="solid" disabled={!!blocker} onClick={() => void start()}>{found ? 'Search again' : 'Find preset'}</Button>}
        {running && best && <span className="text-xs">Best so far: {best.candidate.machine}, {matchPercent(best.distance)}%</span>}
      </div>
      {error && <p className="mt-2 text-xs text-live-dark">{error}</p>}

      {found && !running && (
        <>
          <Heading>Closest sound found</Heading>
          <Row label="Machine">{found.result.candidate.machine}</Row>
          <Row label="Match">{matchPercent(found.result.distance)}%, after {found.result.trials} trials</Row>
          <Row label="Pitch / Decay / Color">{found.result.candidate.params.pitch} / {found.result.candidate.params.decay} / {found.result.candidate.params.color}</Row>
          <Row label="Shape / Sweep / Contour">{found.result.candidate.params.shape} / {found.result.candidate.params.sweep} / {found.result.candidate.params.contour}</Row>
          <Row label="Vol + Dist">{found.result.candidate.params.volDist}</Row>
          <div className="mt-2 flex gap-3">
            <Wave data={found.target} label="Your sound" />
            <Wave data={found.result.capture} label="The Cycles" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={backToBack}>Compare</Button>
            <Button size="sm" onClick={() => transport.trigger(found.track)}>Play on T{found.track + 1}</Button>
            <Button size="sm" disabled={!!savedId} onClick={save}>{savedId ? 'Saved to Sounds' : 'Save to Sounds'}</Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="solid" disabled={newRow !== null || rowsFull} onClick={() => void addAsNewRow()}>{newRow !== null ? `Added as Match ${newRow}` : 'Add as new row'}</Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            {newRow !== null
              ? 'Its row is below FM-1 in the Sequencer. It plays this recording from the laptop, like Chops, so it leaves the Cycles\' outputs and Send to Cycles out.'
              : rowsFull
                ? 'All four Match rows are in use. Remove one in the Sequencer to add this one.'
                : 'Plays this recording from the laptop, like Chops, and uses none of T1 to T6.'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Select
              ariaLabel="Sequencer row"
              className="w-20"
              value={row}
              onChange={(v) => { setRow(v); setAddedRow(null); }}
              options={[0, 1, 2, 3, 4, 5].map((t) => ({ value: String(t), label: `T${t + 1}` }))}
            />
            <Button size="sm" onClick={addToSequencer}>{addedRow === Number(row) ? `Loaded on T${Number(row) + 1}` : 'Load on track'}</Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            {addedRow !== null
              ? `Row T${addedRow + 1} now plays this sound. Click its steps to write a pattern.`
              : Number(row) === found.track
                ? 'The Cycles has six tracks, so the sound uses one of their rows. Steps already on that row will play it.'
                : `This replaces the sound on T${Number(row) + 1}. Steps already on that row will play the new sound.`}
          </p>
          <p className="mt-2 text-xs">The sound is on T{found.track + 1} now. To keep it on the device, save it from the Cycles' own preset menu.</p>
        </>
      )}
    </Part>
  );
}
