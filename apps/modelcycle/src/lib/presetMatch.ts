// Finds Cycles settings that sound like a recorded hit, by scoring what the device really plays.
// Nothing here touches the device, so the scoring and the search can be tested without one.
import { fft, matchToCycles, sliceFeatures } from './analysis';
import { type Machine, MACHINES } from './cycles';
import { STARTER_SOUNDS } from './sounds';

export const SEARCH_PARAMS = ['pitch', 'decay', 'color', 'shape', 'sweep', 'contour', 'volDist'] as const;
export type SearchParam = (typeof SEARCH_PARAMS)[number];
export type Candidate = { machine: Machine; params: Record<SearchParam, number> };

const MAX_TARGET_SEC = 1.5;
const SILENCE_PEAK = 0.002;
const FRAME = 1024;
const HOP = 256;
const BANDS = 32;
const FLOOR_DB = 60;

const peakOf = (data: Float32Array) => {
  let peak = 0;
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  return peak;
};

const normalized = (data: Float32Array, peak: number) => Float32Array.from(data, (v) => v / peak);

/** Cuts a take down to its first hit and normalizes it. Null when the take is too quiet to use. */
export function trimTarget(data: Float32Array, sampleRate: number): Float32Array | null {
  const peak = peakOf(data);
  if (peak < 0.01) return null;
  const onset = data.findIndex((v) => Math.abs(v) >= peak * 0.1);
  const start = Math.max(0, onset - Math.floor(sampleRate * 0.002));
  const win = Math.floor(sampleRate * 0.01);
  const limit = Math.min(data.length, start + Math.floor(sampleRate * MAX_TARGET_SEC));
  // The hit ends after 30 ms below -40 dB, so a second hit later in the take is left out.
  let end = limit;
  let quiet = 0;
  for (let i = onset; i + win <= limit; i += win) {
    quiet = peakOf(data.subarray(i, i + win)) < peak * 0.01 ? quiet + 1 : 0;
    if (quiet === 3) {
      end = i;
      break;
    }
  }
  const hit = data.subarray(start, end);
  return normalized(hit, peakOf(hit));
}

/** Where the new hit starts in a capture: the sharpest rise, since the last trial may still be ringing. */
export function findAttack(data: Float32Array, sampleRate: number): number | null {
  if (peakOf(data) < SILENCE_PEAK) return null;
  const hop = Math.max(1, Math.floor(sampleRate * 0.001));
  const searchEnd = Math.min(data.length, Math.floor(sampleRate * 0.25));
  let previous = 0;
  let bestRise = 0;
  let attack = 0;
  for (let i = 0; i + hop <= searchEnd; i += hop) {
    const level = peakOf(data.subarray(i, i + hop));
    if (level - previous > bestRise) {
      bestRise = level - previous;
      attack = i;
    }
    previous = level;
  }
  return attack;
}

export type Fingerprint = { cells: Float32Array; frames: number; sampleRate: number };

const framesFor = (length: number) => Math.max(1, Math.floor((length - FRAME) / HOP) + 1);

/** Log-spaced band levels over time, relative to the sound's overall level so mic and USB levels can differ. */
export function fingerprint(data: Float32Array, sampleRate: number, frames = framesFor(data.length)): Fingerprint {
  const power = new Float64Array(frames * BANDS);
  const re = new Float64Array(FRAME);
  const im = new Float64Array(FRAME);
  const edges = Array.from({ length: BANDS + 1 }, (_, b) => Math.min(FRAME / 2, Math.max(1, Math.round(((40 * 400 ** (b / BANDS)) * FRAME) / sampleRate))));
  let total = 0;
  for (let f = 0; f < frames; f++) {
    const at = f * HOP;
    for (let i = 0; i < FRAME; i++) {
      re[i] = (data[at + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1)));
      im[i] = 0;
    }
    fft(re, im);
    for (let b = 0; b < BANDS; b++) {
      let sum = 0;
      for (let k = edges[b]; k < Math.max(edges[b] + 1, edges[b + 1]); k++) sum += re[k] * re[k] + im[k] * im[k];
      power[f * BANDS + b] = sum;
      total += sum;
    }
  }
  const reference = total / frames + 1e-12;
  // 0 is the floor and 60 sits at the sound's overall level, so a band can only rise above it briefly.
  const cells = Float32Array.from(power, (p) => Math.max(0, 10 * Math.log10(p / reference + 1e-12) + FLOOR_DB));
  return { cells, frames, sampleRate };
}

/** Average level difference in dB, weighted towards what is audible in either sound. Lower is closer. */
export function distance(a: Fingerprint, b: Fingerprint) {
  let sum = 0;
  let weights = 0;
  for (let i = 0; i < a.cells.length; i++) {
    const weight = Math.max(a.cells[i], b.cells[i]);
    sum += weight * Math.abs(a.cells[i] - b.cells[i]);
    weights += weight;
  }
  return weights ? sum / weights : 0;
}

/** Lines a capture up with the target and scores it. Null when the Cycles made no sound. */
export function scoreCapture(target: Fingerprint, capture: Float32Array) {
  const attack = findAttack(capture, target.sampleRate);
  if (attack === null) return null;
  const hit = capture.subarray(attack);
  const peak = peakOf(hit);
  if (peak < SILENCE_PEAK) return null;
  const aligned = normalized(hit, peak);
  return { distance: distance(target, fingerprint(aligned, target.sampleRate, target.frames)), aligned };
}

/** A guide for comparing results, not a measure of how alike two sounds are to a listener. */
export const matchPercent = (d: number) => Math.round(Math.min(100, Math.max(0, 100 * (1 - d / 25))));

const clampCc = (v: number) => Math.round(Math.min(127, Math.max(0, v)));

const SCREEN_PER_MACHINE = 6;
const START_SIGMA = 28;
const MIN_SIGMA = 2;

type Lane = { machine: Machine; center: Candidate['params']; distance: number; sigma: number };

/**
 * Tries every machine briefly, then refines the best two. Each refinement changes a few settings
 * by a step that grows after a win and shrinks after a miss. The caller plays each candidate.
 */
export class PresetSearch {
  readonly total: number;
  trials = 0;
  best: { candidate: Candidate; distance: number } | null = null;
  private screen: Candidate[];
  private byMachine = new Map<Machine, { params: Candidate['params']; distance: number }>();
  private lanes: Lane[] = [];
  private turn = 0;
  private pending: { candidate: Candidate; lane: Lane | null } | null = null;

  constructor(target: Float32Array, sampleRate: number, total = 150, private random: () => number = Math.random) {
    this.total = Math.max(total, MACHINES.length * SCREEN_PER_MACHINE);
    this.screen = MACHINES.flatMap((machine) => this.screenFor(machine, target, sampleRate));
  }

  /** The starter sound, adjusted by what the sample's measurements suggest, then variations on it. */
  private screenFor(machine: Machine, target: Float32Array, sampleRate: number): Candidate[] {
    const { params: hint } = matchToCycles(sliceFeatures(target, sampleRate));
    const starter = STARTER_SOUNDS.find((s) => s.machine === machine)?.params;
    const seed: Candidate['params'] = {
      pitch: hint.pitch ?? starter?.pitch ?? 64,
      decay: hint.decay,
      color: hint.color,
      shape: starter?.shape ?? 64,
      sweep: starter?.sweep ?? 20,
      contour: starter?.contour ?? 30,
      volDist: 64,
    };
    return Array.from({ length: SCREEN_PER_MACHINE }, (_, i) => ({
      machine,
      params: i === 0 ? seed : this.vary(seed, 40, SEARCH_PARAMS.length),
    }));
  }

  private gaussian() {
    return Math.sqrt(-2 * Math.log(1 - this.random())) * Math.cos(2 * Math.PI * this.random());
  }

  private vary(from: Candidate['params'], sigma: number, count: number) {
    const params = { ...from };
    const order = [...SEARCH_PARAMS].sort(() => this.random() - 0.5);
    for (const key of order.slice(0, count)) params[key] = clampCc(params[key] + this.gaussian() * sigma);
    return params;
  }

  private startRefining() {
    this.lanes = [...this.byMachine.entries()]
      .sort((a, b) => a[1].distance - b[1].distance)
      .slice(0, 2)
      .map(([machine, found]) => ({ machine, center: found.params, distance: found.distance, sigma: START_SIGMA }));
  }

  /** The next settings to play, or null when the search has used all its trials. */
  next(): Candidate | null {
    if (this.trials >= this.total) return null;
    const screening = this.screen.shift();
    if (screening) {
      this.pending = { candidate: screening, lane: null };
      return screening;
    }
    if (!this.lanes.length) this.startRefining();
    // Past two thirds of the trials, only the leading machine is worth more time.
    if (this.lanes.length > 1 && this.trials > this.total * (2 / 3)) this.lanes = [this.lanes.reduce((a, b) => (b.distance < a.distance ? b : a))];
    if (!this.lanes.length) return null;
    const lane = this.lanes[this.turn++ % this.lanes.length];
    const count = 1 + Math.floor(this.random() * 3);
    const candidate = { machine: lane.machine, params: this.vary(lane.center, lane.sigma, count) };
    this.pending = { candidate, lane };
    return candidate;
  }

  /** Reports how the settings from next() scored. Infinity means they made no usable sound. */
  report(score: number) {
    const pending = this.pending;
    if (!pending) return;
    this.pending = null;
    this.trials++;
    const { candidate, lane } = pending;
    if (score < (this.best?.distance ?? Infinity)) this.best = { candidate, distance: score };
    if (!lane) {
      const known = this.byMachine.get(candidate.machine);
      if (score < (known?.distance ?? Infinity)) this.byMachine.set(candidate.machine, { params: candidate.params, distance: score });
      return;
    }
    if (score < lane.distance) {
      lane.center = candidate.params;
      lane.distance = score;
      lane.sigma = Math.min(START_SIGMA, lane.sigma * 1.25);
    } else {
      lane.sigma = Math.max(MIN_SIGMA, lane.sigma * 0.95);
    }
  }
}
