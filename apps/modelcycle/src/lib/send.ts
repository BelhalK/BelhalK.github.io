// Recording a pattern into the Cycles: the app plays it once over MIDI while the device is in live record.
import { CC, CHOPS_LANE, DEVICE_TRACKS, FM_LANE, LANE_NAMES, MACHINES, MATCH_LANE, MATCH_ROWS, SOUND_CONTROLS } from './cycles';
import { stepDuration, type Pattern } from './pattern';
import type { Sound } from './sounds';

// Long enough to reach the device and turn on live record.
const MIN_COUNT_IN_MS = 6000;

/** Whole loops, so the pass starts on step 1 of a device pattern of the same length. */
export const countInLoops = (bpm: number, length: number) =>
  Math.max(1, Math.ceil(MIN_COUNT_IN_MS / (stepDuration(bpm) * 1000 * length)));

const countSteps = (pattern: Pattern, lane: number) => pattern.lanes[lane].slice(0, pattern.length).filter(Boolean).length;

/** What one pass will send, and what cannot go with it. */
export function sendSummary(pattern: Pattern) {
  const tracks = Array.from({ length: DEVICE_TRACKS }, (_, lane) => lane);
  const sent = tracks.filter((lane) => !pattern.muted[lane]);
  return {
    steps: sent.reduce((n, lane) => n + countSteps(pattern, lane), 0),
    muted: tracks.filter((lane) => pattern.muted[lane]).reduce((n, lane) => n + countSteps(pattern, lane), 0),
    chops: countSteps(pattern, CHOPS_LANE),
    fm: countSteps(pattern, FM_LANE),
    matches: Array.from({ length: MATCH_ROWS }, (_, i) => countSteps(pattern, MATCH_LANE + i)).reduce((a, b) => a + b, 0),
    chance: sent.reduce((n, lane) => n + pattern.lanes[lane].slice(0, pattern.length).filter((s) => s && s.chance < 100).length, 0),
  };
}

/** The CCs that give a track its sound: the chosen Sound, with any later knob moves on top. */
export function trackSetup(sound: Sound | undefined, known: Record<number, number> | undefined): [number, number][] {
  const machine = known?.[CC.machine] ?? (sound ? MACHINES.indexOf(sound.machine) : undefined);
  const setup: [number, number][] = machine === undefined ? [] : [[CC.machine, machine]];
  for (const { key } of SOUND_CONTROLS) {
    const value = known?.[CC[key]] ?? sound?.params[key];
    if (value !== undefined) setup.push([CC[key], value]);
  }
  return setup;
}

const stepLabel = ({ lane, step }: { lane: number; step: number }) => `${LANE_NAMES[lane]} step ${step + 1}`;

/** Compares the steps the Cycles played back with the steps that were sent. */
export function compareHeard(pattern: Pattern, heard: { lane: number; step: number }[]) {
  const expected: { lane: number; step: number }[] = [];
  for (let lane = 0; lane < DEVICE_TRACKS; lane++) {
    if (pattern.muted[lane]) continue;
    for (let step = 0; step < pattern.length; step++) if (pattern.lanes[lane][step]) expected.push({ lane, step });
  }
  const has = (list: { lane: number; step: number }[], hit: { lane: number; step: number }) =>
    list.some((h) => h.lane === hit.lane && h.step === hit.step);
  return {
    expected: expected.length,
    matched: expected.filter((h) => has(heard, h)).length,
    missing: expected.filter((h) => !has(heard, h)).map(stepLabel),
    extra: heard.filter((h) => !has(expected, h)).map(stepLabel),
  };
}
