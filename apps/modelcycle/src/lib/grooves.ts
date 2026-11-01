import type { Pattern } from './pattern';
import { emptyPattern, newStep } from './pattern';

// Lanes assume T1 Kick, T2 Snare, T3 Metal, T4 Perc, T5 Tone, T6 Chord.
type LaneSpec = { steps: number[]; vel?: number; accents?: number[]; micro?: number; note?: number; notes?: number[] };

export type Groove = {
  id: string;
  name: string;
  swing: number;
  bpm: number;
  listenFor: string;
  tryThis: string;
  lanes: Partial<Record<number, LaneSpec>>;
};

const FOUR = [0, 4, 8, 12];
const OFFBEATS = [2, 6, 10, 14];

export const GROOVES: Groove[] = [
  {
    id: 'straight',
    name: 'Straight four',
    swing: 50,
    bpm: 124,
    listenFor: 'A dead-straight grid. Use it as the baseline to hear what swing adds.',
    tryThis: 'Raise swing one percent at a time and stop the moment the hats start to lean.',
    lanes: {
      0: { steps: FOUR, vel: 120 },
      1: { steps: [4, 12], vel: 100 },
      2: { steps: OFFBEATS, vel: 95 },
    },
  },
  {
    id: 'chicago',
    name: 'Chicago jack',
    swing: 58,
    bpm: 122,
    listenFor: 'Sixteenth hats with moving accents. The bounce comes from velocity as much as timing.',
    tryThis: 'Lower every hat that is not on an offbeat by 20, then compare with the accents flat.',
    lanes: {
      0: { steps: FOUR, vel: 124 },
      1: { steps: [4, 12], vel: 104 },
      2: { steps: [0, 2, 3, 6, 7, 10, 11, 14, 15], vel: 72, accents: OFFBEATS },
      3: { steps: [7, 13], vel: 86 },
      4: { steps: [3, 6, 10, 15], vel: 96, note: 48 },
    },
  },
  {
    id: 'deep',
    name: 'Deep chord stab',
    swing: 56,
    bpm: 120,
    listenFor: 'Chords answering the kick off the beat, leaving the downbeat clear for the low end.',
    tryThis: 'Move the chord one step later with Shift. Notice how the tension in the bar changes.',
    lanes: {
      0: { steps: FOUR, vel: 118 },
      1: { steps: [4, 12], vel: 88, micro: 2 },
      2: { steps: OFFBEATS, vel: 84 },
      4: { steps: [0, 7, 10], vel: 100, note: 41 },
      5: { steps: [3, 11], vel: 92, note: 60 },
    },
  },
  {
    id: 'garage',
    name: 'Garage skip',
    swing: 62,
    bpm: 128,
    listenFor: 'A heavy shuffle with a skipping kick. The missing kick on beat three is what drives it.',
    tryThis: 'Add the kick back on step 9 and hear how much of the skip disappears.',
    lanes: {
      0: { steps: [0, 7, 10], vel: 122 },
      1: { steps: [4, 12], vel: 106 },
      2: { steps: [2, 6, 10, 14, 15], vel: 90 },
      3: { steps: [3, 9, 13], vel: 78 },
    },
  },
  {
    id: 'disco',
    name: 'Disco filter',
    swing: 54,
    bpm: 126,
    listenFor: 'Open offbeat hats and a busy octave bass under a steady four.',
    tryThis: 'Mute the bass for one bar before a change, then bring it back on the downbeat.',
    lanes: {
      0: { steps: FOUR, vel: 120 },
      1: { steps: [4, 12], vel: 102 },
      2: { steps: OFFBEATS, vel: 100 },
      3: { steps: [1, 5, 9, 13], vel: 64 },
      4: { steps: [0, 2, 4, 6, 8, 10, 12, 14], vel: 94, notes: [36, 48] },
    },
  },
];

export function groovePattern(groove: Groove): Pattern {
  const pattern = emptyPattern();
  for (const [laneKey, spec] of Object.entries(groove.lanes)) {
    const lane = pattern.lanes[Number(laneKey)];
    spec!.steps.forEach((s, i) => {
      lane[s] = newStep({
        vel: spec!.accents?.includes(s) ? 112 : (spec!.vel ?? 100),
        micro: spec!.micro ?? 0,
        note: spec!.notes ? spec!.notes[i % spec!.notes.length] : (spec!.note ?? 60),
      });
    });
  }
  return pattern;
}
