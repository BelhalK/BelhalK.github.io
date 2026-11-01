// Facts about the Model:Cycles. CC numbers come from the community-maintained
// MIDI table at github.com/pencilresearch/midi, not from Elektron's manual.

export const MACHINES = ['Kick', 'Snare', 'Metal', 'Perc', 'Tone', 'Chord'] as const;
export type Machine = (typeof MACHINES)[number];

export const DEVICE_TRACKS = 6;
export const CHOPS_LANE = 6;
export const FM_LANE = 7;
export const LANES = 8;

export const LANE_NAMES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'Chops', 'FM-1'];
export const LANE_COLORS = ['#0e1116', '#c2185b', '#1f5fd6', '#0f8f6b', '#d99100', '#7a3fd1', '#0b8ea6', '#a0522d'];

export const CC = {
  mute: 94,
  level: 95,
  pan: 10,
  machine: 70,
  pitch: 65,
  decay: 80,
  color: 16,
  shape: 17,
  sweep: 18,
  contour: 19,
  delay: 12,
  reverb: 13,
  volDist: 7,
  swing: 15,
  chance: 14,
  punch: 66,
  gate: 67,
} as const;

export type SoundParam = keyof Omit<typeof CC, 'mute' | 'machine'>;

export const SOUND_CONTROLS: { key: SoundParam; label: string }[] = [
  { key: 'pitch', label: 'Pitch' },
  { key: 'decay', label: 'Decay' },
  { key: 'color', label: 'Color' },
  { key: 'shape', label: 'Shape' },
  { key: 'sweep', label: 'Sweep' },
  { key: 'contour', label: 'Contour' },
  { key: 'volDist', label: 'Vol + Dist' },
  { key: 'level', label: 'Level' },
  { key: 'pan', label: 'Pan' },
  { key: 'delay', label: 'Delay send' },
  { key: 'reverb', label: 'Reverb send' },
];

export const BANKS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const PATTERNS_PER_BANK = 16;
export const PATTERN_COUNT = BANKS.length * PATTERNS_PER_BANK;

export const patternName = (index: number) =>
  `${BANKS[Math.floor(index / PATTERNS_PER_BANK)]}${String((index % PATTERNS_PER_BANK) + 1).padStart(2, '0')}`;
