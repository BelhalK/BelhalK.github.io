import { CC } from './cycles';

// Stand-in sounds for when no Model:Cycles is connected. T1 to T4 are samples
// from the Tone.js audio repository; T5 and T6 are synth voices in the audio engine.
export const KITS = [
  { id: 'Techno', name: 'Techno' },
  { id: 'CR78', name: 'CR-78' },
  { id: 'KPR77', name: 'KPR-77' },
  { id: 'LINN', name: 'LinnDrum' },
  { id: 'Kit8', name: 'Electro' },
];

export const DEFAULT_KIT = KITS[0].id;

export const KIT_LANE_NAMES = ['Kick', 'Snare', 'Hat', 'Perc', 'Bass', 'Chord'];

const SAMPLE_FILES = ['kick', 'snare', 'hihat', 'tom3'];

export const kitSampleUrls = (kit: string) =>
  SAMPLE_FILES.map((file) => `https://tonejs.github.io/audio/drum-samples/${kit}/${file}.mp3`);

type Params = Record<number, number> | undefined;

/** Which voice a track plays: its Machine once one is chosen, else the kit's own order, which matches MACHINES. */
export const kitVoice = (track: number, params: Params) => params?.[CC.machine] ?? track;

export type KitSound = {
  semitones: number;
  decay: number | null; // seconds; null plays the sound out
  cutoff: number | null; // Hz; null leaves it open
  drive: number | null;
  sweep: number; // semitones the hit starts above its pitch
  sweepTime: number; // seconds
  gain: number;
  pan: number; // -1 to 1
  delay: number; // send, 0 to 1
  reverb: number; // send, 0 to 1
};

const exp = (v: number, from: number, to: number) => from * (to / from) ** (v / 127);

/**
 * The laptop's reading of the Sounds controls. These are its own approximations of
 * the Cycles' parameters, not a model of them. A control never touched changes nothing.
 */
export function kitSound(params: Params): KitSound {
  const get = (cc: number) => params?.[cc];
  const pitch = get(CC.pitch);
  const decay = get(CC.decay);
  const color = get(CC.color);
  const shape = get(CC.shape);
  const contour = get(CC.contour);
  const level = get(CC.level);
  const volDist = get(CC.volDist);
  const pan = get(CC.pan);
  return {
    semitones: pitch === undefined ? 0 : ((pitch - 64) / 64) * 12,
    decay: decay === undefined ? null : exp(decay, 0.02, 2),
    cutoff: color === undefined ? null : exp(color, 150, 18000),
    drive: shape === undefined ? null : 1 + (shape / 127) ** 2 * 20,
    sweep: ((get(CC.sweep) ?? 0) / 127) * 36,
    sweepTime: contour === undefined ? 0.05 : exp(contour, 0.01, 0.3),
    gain: (level === undefined ? 1 : level / 127) * (volDist === undefined ? 1 : Math.min(2, volDist / 64)),
    pan: pan === undefined ? 0 : Math.max(-1, Math.min(1, (pan - 64) / 63)),
    delay: (get(CC.delay) ?? 0) / 127,
    reverb: (get(CC.reverb) ?? 0) / 127,
  };
}

const curves = new Map<number, Float32Array<ArrayBuffer>>();

/** A saturation curve; louder drive is pulled back so Shape changes the tone more than the level. */
export function driveCurve(drive: number) {
  const key = Math.round(drive);
  let curve = curves.get(key);
  if (!curve) {
    curve = new Float32Array(1025);
    const trim = 1 / (1 + (key - 1) * 0.04);
    for (let i = 0; i < curve.length; i++) curve[i] = (Math.tanh(key * (i / 512 - 1)) / Math.tanh(key)) * trim;
    curves.set(key, curve);
  }
  return curve;
}
