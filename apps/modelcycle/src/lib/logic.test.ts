import { describe, expect, it } from 'vitest';
import { averageBands, balanceDifference, BANDS, detectTransients, estimateBpm, gridSlices, matchToCycles, sliceFeatures } from './analysis';
import { decodeReply, encode, encodeRequest, listArgs, parsePing, parseProjects, parseVersion, PING, replyOk } from './elektron';
import { readGenerated } from './generated';
import { compareHeard, countInLoops, sendSummary, trackSetup } from './send';
import { GROOVES, groovePattern } from './grooves';
import { emptyLane, emptyPattern, newStep, shiftLane, stepDuration, stepOffset, swingDelay } from './pattern';
import { CC, LANES, patternName } from './cycles';
import { kitSound, kitVoice } from './kits';

const SR = 48000;
const sine = (hz: number, sec: number, decay = 0) =>
  Float32Array.from({ length: Math.floor(SR * sec) }, (_, i) => Math.sin((2 * Math.PI * hz * i) / SR) * Math.exp((-decay * i) / SR));

describe('Elektron SysEx', () => {
  // Wraps a decoded reply the way the device would. The format comes from Elektroid, not a captured device reply.
  // A reply echoes the request's sequence in bytes 2 and 3; bytes 0 and 1 are the device's own count.
  const frame = (seq: number, type: number, body: number[]) =>
    Uint8Array.from([0xf0, 0, 0x20, 0x3c, 0x10, 0, ...encode([0, 9, seq >> 8, seq & 0xff, type, ...body]), 0xf7]);
  const text = (s: string) => [...s].map((c) => c.charCodeAt(0));
  const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

  it('encodes a ping byte for byte', () => {
    expect(encodeRequest(0, PING)).toEqual([0xf0, 0, 0x20, 0x3c, 0x10, 0, 0, 0, 0, 0, 0, 1, 0xf7]);
  });
  it('moves high bits into the leading byte and back', () => {
    const raw = frame(0x0102, 0xd3, [0x80, 0xff, 0x7f]);
    expect(raw.slice(6, -1).every((b) => b < 0x80)).toBe(true);
    const reply = decodeReply(raw)!;
    expect(reply.seq).toBe(0x0102);
    expect(reply.type).toBe(0xd3);
    expect([...reply.data.slice(5)]).toEqual([0x80, 0xff, 0x7f]);
  });
  it('puts the request sequence in the first two bytes', () => {
    expect(encodeRequest(0x0102, PING).slice(6, -1)).toEqual([0, 1, 2, 0, 0, 1]);
  });
  it('builds the list arguments', () => {
    expect(listArgs('/a')).toEqual([0x2f, 0x61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
  });
  it('ignores SysEx from anything else', () => {
    expect(decodeReply(Uint8Array.from([0xf0, 0x7e, 0, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0xf7]))).toBeNull();
  });
  it('reads the device name and version', () => {
    const ping = decodeReply(frame(0, 0x81, [27, 2, 9, 9, ...text('Model:Cycles'), 0]))!;
    expect(ping.data[5]).toBe(27);
    expect(parsePing(ping.data)).toBe('Model:Cycles');
    const version = decodeReply(frame(1, 0x82, [1, 0, 0, 0, 0, ...text('1.40'), 0]))!;
    expect(parseVersion(version.data)).toBe('1.40');
  });
  it('lists projects, skipping folders', () => {
    const project = (name: string, slot: number, size: number) => [...text(name), 0, 0, 2, ...u32(slot), ...u32(size), 0, 18, 1, 1];
    const body = [1, ...new Array(12).fill(0), ...project('HOUSE 1', 1, 160), ...text('dir'), 0, 1, 1, ...u32(0), ...project('D\xc9J\xc0', 7, 2048)];
    const reply = decodeReply(frame(2, 0xd3, body))!;
    expect(replyOk(reply.data)).toBe(true);
    expect(parseProjects(reply.data)).toEqual([
      { slot: 1, name: 'HOUSE 1', bytes: 160, hasData: true },
      { slot: 7, name: 'DÉJÀ', bytes: 2048, hasData: true },
    ]);
  });
  it('reads an empty list and rejects a cut-off one', () => {
    const empty = decodeReply(frame(0, 0xd3, [1, ...new Array(12).fill(0)]))!;
    expect(parseProjects(empty.data)).toEqual([]);
    const cut = decodeReply(frame(0, 0xd3, [1, ...new Array(12).fill(0), ...text('X'), 0, 0, 2, 0, 0]))!;
    expect(() => parseProjects(cut.data)).toThrow();
  });
});

describe('sending a pattern to the Cycles', () => {
  const pattern = () => {
    const p = emptyPattern();
    p.lanes[0][0] = newStep();
    p.lanes[1][4] = newStep({ chance: 50 });
    p.lanes[2][8] = newStep();
    p.muted[2] = true;
    p.lanes[6][0] = newStep({ slice: 0 });
    p.lanes[7][0] = newStep();
    return p;
  };
  it('counts in whole loops, at least six seconds long', () => {
    expect(countInLoops(120, 16)).toBe(3);
    expect(countInLoops(120, 64)).toBe(1);
    expect(countInLoops(60, 64)).toBe(1);
  });
  it('reports what cannot go with the pass', () => {
    expect(sendSummary(pattern())).toEqual({ steps: 2, muted: 1, chops: 1, fm: 1, chance: 1 });
  });
  it('ignores steps past the pattern length', () => {
    const p = pattern();
    p.lanes[0][40] = newStep();
    expect(sendSummary(p).steps).toBe(2);
  });
  it('lets a later knob move override the chosen sound', () => {
    const sound = { id: 'x', name: 'x', machine: 'Snare' as const, params: { decay: 10, color: 20 } };
    expect(trackSetup(sound, { [CC.decay]: 99 })).toEqual([[CC.machine, 1], [CC.decay, 99], [CC.color, 20]]);
    expect(trackSetup(undefined, undefined)).toEqual([]);
  });
  it('compares what the Cycles played with what was sent', () => {
    expect(compareHeard(pattern(), [{ lane: 0, step: 0 }, { lane: 3, step: 2 }])).toEqual({
      expected: 2, matched: 1, missing: ['T2 step 5'], extra: ['T4 step 3'],
    });
  });
});

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
