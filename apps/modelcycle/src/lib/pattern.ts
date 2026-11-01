import { LANES } from './cycles';

export type Step = {
  vel: number; // 1-127
  note: number; // MIDI note
  micro: number; // -23..23, in 1/24ths of a step
  chance: number; // 1-100 percent
  slice?: number; // Chops lane only
};

export type Lane = (Step | null)[];

export type Pattern = {
  length: number; // 16, 32, 48 or 64
  lanes: Lane[];
  muted: boolean[];
};

export const MAX_STEPS = 64;
export const DEFAULT_NOTE = 60;

export const newStep = (over: Partial<Step> = {}): Step => ({
  vel: 100,
  note: DEFAULT_NOTE,
  micro: 0,
  chance: 100,
  ...over,
});

export const emptyLane = (): Lane => Array.from({ length: MAX_STEPS }, () => null);

export const emptyPattern = (): Pattern => ({
  length: 16,
  lanes: Array.from({ length: LANES }, emptyLane),
  muted: Array.from({ length: LANES }, () => false),
});

/** Rotates a lane within the pattern length. Steps past the length are left alone. */
export function shiftLane(lane: Lane, by: number, length: number): Lane {
  const next = [...lane];
  for (let i = 0; i < length; i++) {
    next[(((i + by) % length) + length) % length] = lane[i];
  }
  return next;
}

/** Seconds a step is delayed by swing. 50 is straight; applies to every odd 16th. */
export function swingDelay(stepIndex: number, stepDur: number, swing: number): number {
  if (stepIndex % 2 === 0) return 0;
  return stepDur * ((2 * swing) / 100 - 1);
}

export const stepDuration = (bpm: number) => 60 / bpm / 4;

/** Offset of a step from its straight grid position, swing and micro timing included. */
export const stepOffset = (stepIndex: number, stepDur: number, swing: number, micro: number) =>
  swingDelay(stepIndex, stepDur, swing) + (micro / 24) * stepDur;
