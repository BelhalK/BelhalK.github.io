// Offline audio analysis shared by the Chopper, Reference and Spectrum nodes.

export const BANDS = [
  { name: 'Sub', lo: 20, hi: 60 },
  { name: 'Bass', lo: 60, hi: 150 },
  { name: 'Low mid', lo: 150, hi: 400 },
  { name: 'Mid', lo: 400, hi: 1000 },
  { name: 'High mid', lo: 1000, hi: 2500 },
  { name: 'Presence', lo: 2500, hi: 6000 },
  { name: 'Air', lo: 6000, hi: 20000 },
];

export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nc = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nc;
      }
    }
  }
}

/** Sums per-bin power into BANDS and returns dB per band. */
export function bandsFromPower(power: ArrayLike<number>, binHz: number): number[] {
  return BANDS.map(({ lo, hi }) => {
    let sum = 0;
    const end = Math.min(power.length - 1, Math.floor(hi / binHz));
    for (let i = Math.max(1, Math.ceil(lo / binHz)); i <= end; i++) sum += power[i];
    return 10 * Math.log10(sum + 1e-12);
  });
}

/** Long-term band spectrum of a mono signal. */
export function averageBands(data: Float32Array, sampleRate: number, size = 4096): number[] {
  const power = new Float64Array(size / 2);
  const hop = Math.max(size, Math.floor(data.length / 400));
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let frames = 0;
  for (let start = 0; start + size <= data.length; start += hop) {
    for (let i = 0; i < size; i++) {
      re[i] = data[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
      im[i] = 0;
    }
    fft(re, im);
    for (let i = 0; i < size / 2; i++) power[i] += (re[i] * re[i] + im[i] * im[i]) / (size * size);
    frames++;
  }
  if (frames) for (let i = 0; i < power.length; i++) power[i] /= frames;
  return bandsFromPower(power, sampleRate / size);
}

/** Removes the overall level difference, leaving only tonal balance. */
export function balanceDifference(mine: number[], reference: number[]): number[] {
  const diff = mine.map((v, i) => v - reference[i]);
  const mean = diff.reduce((a, b) => a + b, 0) / diff.length;
  return diff.map((d) => d - mean);
}

export function toMono(buffer: AudioBuffer): Float32Array {
  const out = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) out[i] += data[i] / buffer.numberOfChannels;
  }
  return out;
}

export function rms(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / (data.length || 1));
}

export const db = (v: number) => 20 * Math.log10(Math.max(v, 1e-6));

/** Min and max per pixel column, for drawing a waveform. */
export function peaks(data: Float32Array, columns: number): [number, number][] {
  const out: [number, number][] = [];
  const size = Math.max(1, Math.floor(data.length / columns));
  for (let c = 0; c < columns; c++) {
    let lo = 0;
    let hi = 0;
    const end = Math.min(data.length, (c + 1) * size);
    for (let i = c * size; i < end; i++) {
      if (data[i] < lo) lo = data[i];
      if (data[i] > hi) hi = data[i];
    }
    out.push([lo, hi]);
  }
  return out;
}

const HOP = 512;

function onsetEnvelope(data: Float32Array): Float32Array {
  const frames = Math.floor(data.length / HOP);
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = 0; i < HOP; i++) sum += data[f * HOP + i] ** 2;
    energy[f] = Math.sqrt(sum / HOP);
  }
  const flux = new Float32Array(frames);
  for (let f = 1; f < frames; f++) flux[f] = Math.max(0, energy[f] - energy[f - 1]);
  return flux;
}

/** Sample positions of the strongest transients, always starting at 0. */
export function detectTransients(data: Float32Array, sampleRate: number, count: number): number[] {
  const flux = onsetEnvelope(data);
  const minGap = Math.floor((0.06 * sampleRate) / HOP);
  const candidates: { f: number; v: number }[] = [];
  for (let f = 1; f < flux.length - 1; f++) {
    if (flux[f] > flux[f - 1] && flux[f] >= flux[f + 1] && flux[f] > 0) candidates.push({ f, v: flux[f] });
  }
  candidates.sort((a, b) => b.v - a.v);
  const picked: number[] = [];
  for (const c of candidates) {
    if (picked.length >= count - 1) break;
    if (c.f >= minGap && picked.every((p) => Math.abs(p - c.f) >= minGap)) picked.push(c.f);
  }
  return [0, ...picked.sort((a, b) => a - b).map((f) => f * HOP)];
}

export function gridSlices(lengthSamples: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => Math.floor((i * lengthSamples) / count));
}

/** Estimates tempo by autocorrelating onsets. Folded into the usual house range. */
export function estimateBpm(data: Float32Array, sampleRate: number): number | null {
  const flux = onsetEnvelope(data);
  if (flux.length < 200) return null;
  const framesPerSec = sampleRate / HOP;
  let best = 0;
  let bestLag = 0;
  for (let bpm = 90; bpm <= 150; bpm += 0.5) {
    const lag = Math.round((60 / bpm) * framesPerSec);
    let score = 0;
    for (let i = lag; i < flux.length; i++) score += flux[i] * flux[i - lag];
    if (score > best) {
      best = score;
      bestLag = lag;
    }
  }
  return bestLag ? Math.round(((60 * framesPerSec) / bestLag) * 10) / 10 : null;
}

export type SliceFeatures = { pitchHz: number | null; decaySec: number; brightness: number; noisiness: number };

export function sliceFeatures(data: Float32Array, sampleRate: number): SliceFeatures {
  const size = 4096;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < Math.min(size, data.length); i++) re[i] = data[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
  fft(re, im);
  let powerSum = 0;
  let weighted = 0;
  let logSum = 0;
  const lo = 2;
  const hi = size / 2;
  for (let i = lo; i < hi; i++) {
    const p = re[i] * re[i] + im[i] * im[i] + 1e-12;
    powerSum += p;
    weighted += p * Math.log2(((i * sampleRate) / size + 1));
    logSum += Math.log(p);
  }
  const centroidOct = weighted / powerSum;
  const brightness = Math.min(1, Math.max(0, (centroidOct - Math.log2(60)) / (Math.log2(10000) - Math.log2(60))));
  const noisiness = Math.min(1, Math.exp(logSum / (hi - lo)) / (powerSum / (hi - lo)));

  // Time for the envelope to fall 40 dB below its peak.
  let peak = 0;
  let peakAt = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > peak) {
      peak = a;
      peakAt = i;
    }
  }
  const win = Math.floor(sampleRate * 0.01);
  let end = data.length;
  for (let i = peakAt; i + win < data.length; i += win) {
    let m = 0;
    for (let j = i; j < i + win; j++) m = Math.max(m, Math.abs(data[j]));
    if (m < peak * 0.01) {
      end = i;
      break;
    }
  }
  const decaySec = (end - peakAt) / sampleRate;

  // Autocorrelation pitch over 30 Hz to 2 kHz.
  const n = Math.min(data.length - peakAt, 8192);
  let pitchHz: number | null = null;
  if (n > 2048 && peak > 0.001) {
    const seg = data.subarray(peakAt, peakAt + n);
    let zero = 0;
    for (let i = 0; i < n; i++) zero += seg[i] * seg[i];
    let bestCorr = 0;
    let bestLag = 0;
    const minLag = Math.floor(sampleRate / 2000);
    const maxLag = Math.min(Math.floor(sampleRate / 30), n - 1);
    // Very short lags always correlate, so only look past the first dip.
    let dipped = false;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let c = 0;
      for (let i = 0; i + lag < n; i++) c += seg[i] * seg[i + lag];
      c /= zero * ((n - lag) / n);
      if (c < 0.2) dipped = true;
      if (dipped && c > bestCorr) {
        bestCorr = c;
        bestLag = lag;
      }
    }
    if (bestCorr > 0.5 && bestLag) pitchHz = sampleRate / bestLag;
  }
  return { pitchHz, decaySec, brightness, noisiness };
}

export type CyclesMatch = {
  machine: 'Kick' | 'Snare' | 'Metal' | 'Perc' | 'Tone' | 'Chord';
  reason: string;
  params: { pitch?: number; decay: number; color: number };
};

/** Picks a machine and rough settings for a slice. A guide for ears, not a clone. */
export function matchToCycles(f: SliceFeatures): CyclesMatch {
  const clamp = (v: number) => Math.round(Math.min(127, Math.max(0, v)));
  const decay = clamp((Math.log10(Math.max(f.decaySec, 0.02)) + 1.7) * 55);
  const color = clamp(f.brightness * 127);
  const pitch = f.pitchHz ? clamp(64 + (12 * Math.log2(f.pitchHz / 261.63)) / 2) : undefined;
  const hz = f.pitchHz ? `${Math.round(f.pitchHz)} Hz` : 'no clear pitch';

  let machine: CyclesMatch['machine'];
  let reason: string;
  if (f.noisiness > 0.25 && f.brightness > 0.6) {
    machine = 'Metal';
    reason = `Bright and noisy, ${hz}`;
  } else if (f.noisiness > 0.15 && f.decaySec < 0.5) {
    machine = 'Snare';
    reason = `Short and noisy, ${hz}`;
  } else if (f.pitchHz && f.pitchHz < 110 && f.decaySec < 0.8) {
    machine = 'Kick';
    reason = `Low and short, ${hz}`;
  } else if (f.decaySec < 0.2) {
    machine = 'Perc';
    reason = `Short and pitched, ${hz}`;
  } else if (f.brightness > 0.45) {
    machine = 'Chord';
    reason = `Sustained and harmonically rich, ${hz}`;
  } else {
    machine = 'Tone';
    reason = `Sustained and dark, ${hz}`;
  }
  return { machine, reason, params: { pitch, decay, color } };
}

export function encodeWav(buffer: AudioBuffer, start = 0, end = buffer.length): Blob {
  const channels = buffer.numberOfChannels;
  const frames = end - start;
  const out = new DataView(new ArrayBuffer(44 + frames * channels * 2));
  const text = (at: number, s: string) => [...s].forEach((c, i) => out.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  out.setUint32(4, 36 + frames * channels * 2, true);
  text(8, 'WAVEfmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, channels, true);
  out.setUint32(24, buffer.sampleRate, true);
  out.setUint32(28, buffer.sampleRate * channels * 2, true);
  out.setUint16(32, channels * 2, true);
  out.setUint16(34, 16, true);
  text(36, 'data');
  out.setUint32(40, frames * channels * 2, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let at = 44;
  for (let i = start; i < end; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      out.setInt16(at, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      at += 2;
    }
  }
  return new Blob([out], { type: 'audio/wav' });
}
