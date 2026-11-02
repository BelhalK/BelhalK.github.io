import { CC, MACHINES } from '@/lib/cycles';
import { type Candidate, fingerprint, PresetSearch, scoreCapture, SEARCH_PARAMS } from '@/lib/presetMatch';
import { audio } from '@/engine/audio';
import { midi } from '@/engine/midi';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';

// Time for the Cycles to take new settings before the trial's note. A machine change takes longer.
const SETTLE_MS = 30;
const MACHINE_SETTLE_MS = 150;
const TAIL_MS = 250;
const GIVE_UP_AFTER_SILENT = 8;
export const CAPTURE_LEVEL = 110;

export type PresetProgress = { trial: number; total: number; best: { candidate: Candidate; distance: number } | null };
export type PresetResult = { candidate: Candidate; distance: number; capture: Float32Array; trials: number };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function sendCandidate(track: number, candidate: Candidate) {
  midi.cc(track, CC.machine, MACHINES.indexOf(candidate.machine));
  for (const key of SEARCH_PARAMS) midi.cc(track, CC[key], candidate.params[key]);
  // Each capture must be the dry sound, at a level that cannot clip.
  midi.cc(track, CC.delay, 0);
  midi.cc(track, CC.reverb, 0);
  midi.cc(track, CC.level, CAPTURE_LEVEL);
}

/** Plays settings on a track and compares what comes back. Stopping early keeps the best so far. */
export async function runPresetSearch(target: Float32Array, sampleRate: number, track: number, signal: AbortSignal, onProgress: (p: PresetProgress) => void): Promise<PresetResult | null> {
  const print = fingerprint(target, sampleRate);
  const search = new PresetSearch(target, sampleRate);
  const noteMs = Math.round((target.length / sampleRate) * 1000);
  let found: Float32Array | null = null;
  let silent = 0;
  let machine: Candidate['machine'] | null = null;

  // The app's monitor stays quiet. The Cycles' own outputs still sound.
  audio.setMonitor(0);
  midi.cc(track, CC.mute, 0);
  try {
    for (let candidate = search.next(); candidate && !signal.aborted; candidate = search.next()) {
      if (useLive.getState().playing) throw new Error('Playback started, so the search stopped.');
      sendCandidate(track, candidate);
      await wait(candidate.machine === machine ? SETTLE_MS : MACHINE_SETTLE_MS);
      machine = candidate.machine;
      const capture = await audio.captureCycles(noteMs + TAIL_MS, () => midi.note(track, 60, 110, performance.now(), noteMs));
      const scored = scoreCapture(print, capture);
      silent = scored ? 0 : silent + 1;
      if (silent >= GIVE_UP_AFTER_SILENT) throw new Error('No sound is coming back from the Cycles. Check that the track is not muted and that its USB audio is on.');
      const before = search.best?.distance ?? Infinity;
      search.report(scored?.distance ?? Infinity);
      if (scored && scored.distance < before) found = scored.aligned;
      onProgress({ trial: search.trials, total: search.total, best: search.best });
    }
  } finally {
    audio.setMonitor(useProject.getState().monitorGain);
  }
  return search.best && found ? { ...search.best, capture: found, trials: search.trials } : null;
}
