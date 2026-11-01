import { emptyLane, newStep, type Lane } from './pattern';

const TRACKS = ['kick', 'snare', 'hat', 'perc', 'bass', 'chord'] as const;
const PITCHED = new Set<string>(['bass', 'chord']);

const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : fallback;

export type GeneratedPattern = { name: string; bpm: number; swing: number; lanes: Lane[] };

/** Turns the model's answer into lanes T1 to T6, keeping only steps that fit the pattern. Null if nothing plays. */
export function readGenerated(raw: unknown, length: number): GeneratedPattern | null {
  const data = (raw ?? {}) as Record<string, unknown>;
  let total = 0;
  const lanes = TRACKS.map((track) => {
    const lane = emptyLane();
    const hits = data[track];
    if (!Array.isArray(hits)) return lane;
    for (const hit of hits) {
      const step = hit?.step;
      if (!Number.isInteger(step) || step < 0 || step >= length) continue;
      if (!lane[step]) total++;
      lane[step] = newStep({
        vel: clamp(hit.velocity, 1, 127, 100),
        ...(PITCHED.has(track) ? { note: clamp(hit.note, 24, 96, 48) } : {}),
      });
    }
    return lane;
  });
  if (total === 0) return null;
  return {
    name: typeof data.name === 'string' ? data.name : 'Generated pattern',
    bpm: clamp(data.bpm, 40, 300, 124),
    swing: clamp(data.swing, 50, 75, 50),
    lanes,
  };
}
