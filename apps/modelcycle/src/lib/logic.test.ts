import { describe, expect, it } from 'vitest';
import { averageBands, balanceDifference, BANDS, detectTransients, estimateBpm, gridSlices, matchToCycles, sliceFeatures } from './analysis';
import { readGenerated } from './generated';
import { GROOVES, groovePattern } from './grooves';
import { emptyLane, newStep, shiftLane, stepDuration, stepOffset, swingDelay } from './pattern';
import { CC, LANES, patternName } from './cycles';
import { kitSound, kitVoice } from './kits';

const SR = 48000;
const sine = (hz: number, sec: number, decay = 0) =>
  Float32Array.from({ length: Math.floor(SR * sec) }, (_, i) => Math.sin((2 * Math.PI * hz * i) / SR) * Math.exp((-decay * i) / SR));

describe('timing', () => {
  it('50% swing is straight, 75% lands an odd 16th halfway to the next', () => {
    expect(swingDelay(1, 0.1, 50)).toBeCloseTo(0);
    expect(swingDelay(1, 0.1, 75)).toBeCloseTo(0.05);
    expect(swingDelay(2, 0.1, 75)).toBe(0);
  });
  it('a sixteenth at 120 BPM lasts 125 ms', () => expect(stepDuration(120)).toBeCloseTo(0.125));
  it('adds micro timing to swing', () => expect(stepOffset(1, 0.12, 50, 12)).toBeCloseTo(0.06));
});

describe('shifting', () => {
  it('rotates within the pattern length and leaves later steps alone', () => {
    const lane = emptyLane();
    lane[0] = newStep({ vel: 1 });
    lane[15] = newStep({ vel: 2 });
    lane[20] = newStep({ vel: 3 });
    const next = shiftLane(lane, 1, 16);
    expect(next[1]?.vel).toBe(1);
    expect(next[0]?.vel).toBe(2);
    expect(next[20]?.vel).toBe(3);
    expect(shiftLane(next, -1, 16)[0]?.vel).toBe(1);
  });
});

describe('patterns', () => {
  it('names patterns by bank', () => {
    expect(patternName(0)).toBe('A01');
    expect(patternName(95)).toBe('F16');
  });
  it('new patterns include the FM-1 lane', () => expect(groovePattern(GROOVES[0]).lanes).toHaveLength(LANES));
  it('every groove fits one bar', () => {
    for (const g of GROOVES) {
      const p = groovePattern(g);
      expect(p.lanes[0].filter(Boolean).length).toBeGreaterThan(0);
      p.lanes.forEach((l) => l.slice(16).forEach((s) => expect(s).toBeNull()));
    }
  });
});

describe('laptop kit sounds', () => {
  it('leaves the sample alone until a control is touched', () => {
    expect(kitSound(undefined)).toMatchObject({ semitones: 0, decay: null, cutoff: null, drive: null, sweep: 0, gain: 1, pan: 0, delay: 0, reverb: 0 });
  });
  it('Color opens the filter and Shape adds drive', () => {
    const dark = kitSound({ [CC.color]: 0, [CC.shape]: 0 });
    const bright = kitSound({ [CC.color]: 127, [CC.shape]: 127 });
    expect(dark.cutoff).toBeCloseTo(150);
    expect(bright.cutoff).toBeCloseTo(18000);
    expect(bright.drive!).toBeGreaterThan(dark.drive!);
  });
  it('plays the chosen machine, else the track position', () => {
    expect(kitVoice(0, undefined)).toBe(0);
    expect(kitVoice(0, { [CC.machine]: 5 })).toBe(5);
  });
});

describe('generated patterns', () => {
  it('fills tracks in order and keeps steps inside the pattern', () => {
    const result = readGenerated({ name: 'x', bpm: 90, swing: 60, kick: [{ step: 0, velocity: 120 }, { step: 16, velocity: 120 }], bass: [{ step: 3, velocity: 90, note: 36 }] }, 16)!;
    expect(result.lanes).toHaveLength(6);
    expect(result.lanes[0][0]?.vel).toBe(120);
    expect(result.lanes[0][16]).toBeNull();
    expect(result.lanes[4][3]?.note).toBe(36);
  });
  it('clamps what the model gets wrong and keeps drums at their own pitch', () => {
    const result = readGenerated({ bpm: 900, swing: 10, snare: [{ step: 4, velocity: 500, note: 12 }, { step: 1.5, velocity: 90 }, null] }, 16)!;
    expect(result.bpm).toBe(300);
    expect(result.swing).toBe(50);
    expect(result.lanes[1][4]).toMatchObject({ vel: 127, note: 60 });
    expect(result.lanes[1].filter(Boolean)).toHaveLength(1);
  });
  it('treats an answer with no steps as a failure', () => {
    expect(readGenerated({ kick: [] }, 16)).toBeNull();
    expect(readGenerated('nonsense', 16)).toBeNull();
  });
});

describe('analysis', () => {
  it('puts a 100 Hz tone in the bass band', () => {
    const bands = averageBands(sine(100, 1), SR);
    expect(bands.indexOf(Math.max(...bands))).toBe(BANDS.findIndex((b) => b.name === 'Bass'));
  });
  it('tonal balance ignores overall level', () => {
    const d = balanceDifference([-10, -20, -30], [-16, -26, -36]);
    d.forEach((v) => expect(v).toBeCloseTo(0));
  });
  it('finds clicks at their positions', () => {
    const data = new Float32Array(SR * 2);
    for (const at of [0.5, 1, 1.5]) data.fill(0.9, Math.floor(at * SR), Math.floor(at * SR) + 400);
    const found = detectTransients(data, SR, 4);
    expect(found).toHaveLength(4);
    expect(found[0]).toBe(0);
    [0.5, 1, 1.5].forEach((at, i) => expect(Math.abs(found[i + 1] / SR - at)).toBeLessThan(0.03));
  });
  it('estimates the tempo of a click track', () => {
    const data = new Float32Array(SR * 10);
    const beat = (60 / 124) * SR;
    for (let b = 0; b * beat < data.length - 400; b++) data.fill(0.9, Math.floor(b * beat), Math.floor(b * beat) + 400);
    expect(Math.abs((estimateBpm(data, SR) ?? 0) - 124)).toBeLessThan(2);
  });
  it('splits evenly', () => expect(gridSlices(160, 4)).toEqual([0, 40, 80, 120]));
  it('hears a low decaying sine as a kick at its pitch', () => {
    const f = sliceFeatures(sine(55, 0.5, 10), SR);
    expect(Math.abs((f.pitchHz ?? 0) - 55)).toBeLessThan(3);
    expect(matchToCycles(f).machine).toBe('Kick');
  });
  it('hears white noise as bright and noisy', () => {
    const noise = Float32Array.from({ length: SR / 4 }, () => Math.random() * 2 - 1);
    expect(matchToCycles(sliceFeatures(noise, SR)).machine).toBe('Metal');
  });
});
