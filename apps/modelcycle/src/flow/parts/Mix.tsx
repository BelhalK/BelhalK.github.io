import { useEffect, useRef, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BANDS, balanceDifference, bandsFromPower, db } from '@/lib/analysis';
import { ANALYSER_FFT, audio } from '@/engine/audio';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { Button, Heading, Row, Segmented, Select, Slider } from '@/components/ui';
import { Part } from '../Part';

const FREQ_MIN = 20;
const FREQ_MAX = 20000;
const logPos = (f: number) => Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN);

function useAnimation(fn: () => void, active: boolean) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const loop = () => {
      saved.current();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

function useInput(id: string) {
  const connected = useLive((s) => s.audioReady);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  useEffect(() => {
    if (connected) setAnalyser(audio.registerAnalyser(id));
  }, [connected, id]);
  return analyser;
}

// One hue, light to dark, so brightness only ever means level.
const RAMP = Array.from({ length: 256 }, (_, i) => {
  const t = i / 255;
  const stops = [[255, 255, 255], [150, 185, 240], [31, 95, 214], [14, 17, 22]];
  const p = t * (stops.length - 1);
  const a = Math.min(Math.floor(p), stops.length - 2);
  const k = p - a;
  return stops[a].map((v, c) => Math.round(v + (stops[a + 1][c] - v) * k));
});

export function SpectrogramPart({ id }: NodeProps) {
  const analyser = useInput(id);
  const canvas = useRef<HTMLCanvasElement>(null);
  const W = 470;
  const H = 280;
  const bins = useRef<Float32Array<ArrayBuffer> | null>(null);
  const frame = useRef(0);

  useAnimation(() => {
    const c = canvas.current;
    if (!c || !analyser) return;
    const g = c.getContext('2d')!;
    if (!bins.current) bins.current = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(bins.current);
    frame.current++;
    if (frame.current % 2) return;
    g.drawImage(c, -2, 0);
    const image = g.createImageData(2, H);
    const binHz = audio.ctx!.sampleRate / ANALYSER_FFT;
    for (let y = 0; y < H; y++) {
      const f = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** (1 - y / H);
      const v = bins.current[Math.min(bins.current.length - 1, Math.round(f / binHz))];
      const level = Math.max(0, Math.min(255, ((v + 95) / 75) * 255));
      const [r, gr, b] = RAMP[Math.floor(isFinite(level) ? level : 0)];
      for (let x = 0; x < 2; x++) {
        const at = (y * 2 + x) * 4;
        image.data.set([r, gr, b, 255], at);
      }
    }
    g.putImageData(image, W - 2, 0);
  }, !!analyser);

  return (
    <Part type="spectrogram" width={520} status="Newest on the right" tight ports={[{ id: 'audio-in', side: 'left', label: 'Audio', top: 58 }]}>
      <div className="relative p-2.5 pl-10">
        <canvas ref={canvas} width={W} height={H} className="block h-[280px] w-full border border-ink bg-paper" />
        {[100, 1000, 10000].map((f) => (
          <span key={f} className="mono absolute left-1.5 -translate-y-1/2 text-[10px]" style={{ top: 10 + (1 - logPos(f)) * H }}>
            {f >= 1000 ? `${f / 1000}k` : f}
          </span>
        ))}
        {!analyser && <p className="absolute inset-0 grid place-items-center text-xs text-muted">Press Play to see the sound here.</p>}
      </div>
    </Part>
  );
}

type Finding = { text: string; severe?: boolean };

function readFindings(bands: number[], peak: number, rmsLevel: number): Finding[] {
  if (rmsLevel < -60) return [];
  const out: Finding[] = [];
  const [sub, bass, lowMid, mid, , presence, air] = bands;
  const crest = peak - rmsLevel;
  if (peak > -0.5) out.push({ text: `Peaks reach ${peak.toFixed(1)} dBFS. Lower track levels to avoid clipping.`, severe: true });
  if (crest < 6) out.push({ text: `Only ${crest.toFixed(1)} dB between peak and average. Drive is flattening the kick.` });
  if (sub > bass + 4) out.push({ text: 'Sub is louder than bass. Check the kick and bass are not sitting on the same note.' });
  if (lowMid > bass) out.push({ text: 'Low mids outweigh the bass, which often reads as mud. Try shortening chord or bass decay.' });
  if (mid > bass + 3) out.push({ text: 'Mids are over the low end, so the track may feel thin in a club.' });
  if (air < presence - 18) out.push({ text: 'Very little above 6 kHz. Hats may be too dark or too low.' });
  return out;
}

export function SpectrumPart({ id }: NodeProps) {
  const analyser = useInput(id);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<{ bands: number[]; peak: number; rms: number }>({ bands: BANDS.map(() => -120), peak: -120, rms: -120 });
  const avg = useRef<Float64Array | null>(null);
  const smooth = useRef<Float32Array | null>(null);
  const peakRef = useRef(-120);
  const sumSq = useRef({ sum: 0, n: 0 });
  const buffers = useRef<{ f: Float32Array<ArrayBuffer>; t: Float32Array<ArrayBuffer> } | null>(null);
  const W = 500;
  const H = 180;

  useAnimation(() => {
    const c = canvas.current;
    if (!c || !analyser) return;
    if (!buffers.current) {
      buffers.current = { f: new Float32Array(analyser.frequencyBinCount), t: new Float32Array(analyser.fftSize) };
      avg.current = new Float64Array(analyser.frequencyBinCount);
      smooth.current = new Float32Array(analyser.frequencyBinCount).fill(-120);
    }
    const { f, t } = buffers.current;
    analyser.getFloatFrequencyData(f);
    analyser.getFloatTimeDomainData(t);
    const s = smooth.current!;
    for (let i = 0; i < f.length; i++) {
      const v = isFinite(f[i]) ? f[i] : -120;
      s[i] = v > s[i] ? v : s[i] * 0.86 + v * 0.14;
      avg.current![i] += 10 ** (v / 10);
    }
    for (let i = 0; i < t.length; i++) {
      peakRef.current = Math.max(peakRef.current, db(Math.abs(t[i])));
      sumSq.current.sum += t[i] * t[i];
    }
    sumSq.current.n += t.length;

    const g = c.getContext('2d')!;
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, W, H);
    g.strokeStyle = '#eef0f2';
    g.lineWidth = 1;
    g.beginPath();
    for (const dB of [-20, -40, -60, -80]) {
      const y = ((-dB - 10) / 80) * H;
      g.moveTo(0, y);
      g.lineTo(W, y);
    }
    for (const fq of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
      const x = logPos(fq) * W;
      g.moveTo(x, 0);
      g.lineTo(x, H);
    }
    g.stroke();
    const binHz = audio.ctx!.sampleRate / ANALYSER_FFT;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x < W; x += 2) {
      const fq = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** (x / W);
      const v = s[Math.min(s.length - 1, Math.round(fq / binHz))];
      g.lineTo(x, Math.min(H, Math.max(0, ((-v - 10) / 80) * H)));
    }
    g.lineTo(W, H);
    g.closePath();
    g.fillStyle = 'rgb(14 17 22 / 0.1)';
    g.fill();
    g.strokeStyle = '#0e1116';
    g.lineWidth = 2;
    g.stroke();
  }, !!analyser);

  // Readouts update slowly enough to read, over a rolling window.
  useEffect(() => {
    const id = setInterval(() => {
      if (!avg.current || !audio.ctx || !sumSq.current.n) return;
      setStats({
        bands: bandsFromPower(avg.current, audio.ctx.sampleRate / ANALYSER_FFT),
        peak: peakRef.current,
        rms: db(Math.sqrt(sumSq.current.sum / sumSq.current.n)),
      });
      avg.current.fill(0);
      peakRef.current = -120;
      sumSq.current = { sum: 0, n: 0 };
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const findings = readFindings(stats.bands, stats.peak, stats.rms);
  const quiet = stats.rms < -60;
  return (
    <Part type="spectrum" width={520} status="Rules of thumb, updated every 3 s" ports={[{ id: 'audio-in', side: 'left', label: 'Audio', top: 58 }]}>
      <div className="relative">
        <canvas ref={canvas} width={W * 2} height={H * 2} className="block h-[180px] w-full border border-ink" aria-label="Live frequency spectrum" />
        {[100, 1000, 10000].map((fq) => (
          <span key={fq} className="mono pointer-events-none absolute bottom-0.5 -translate-x-1/2 text-[10px]" style={{ left: `${logPos(fq) * 100}%` }}>
            {fq >= 1000 ? `${fq / 1000}k` : fq}
          </span>
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-4">
        <Row label="Peak">{quiet ? '--' : `${stats.peak.toFixed(1)} dBFS`}</Row>
        <Row label="Peak minus average">{quiet ? '--' : `${(stats.peak - stats.rms).toFixed(1)} dB`}</Row>
      </div>
      <Heading>Mix notes</Heading>
      {quiet ? (
        <p className="text-xs text-muted">Waiting for sound.</p>
      ) : findings.length ? (
        <ul className="space-y-1 text-xs">
          {findings.map((f) => (
            <li key={f.text} className={f.severe ? 'font-semibold text-live-dark' : ''}>{f.text}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">Nothing stands out. Check it against a reference.</p>
      )}
    </Part>
  );
}

function BalanceChart({ diff }: { diff: number[] }) {
  const range = 12;
  return (
    <div className="space-y-1" role="table" aria-label="Your tonal balance compared with the reference">
      {BANDS.map((b, i) => {
        const v = Math.max(-range, Math.min(range, diff[i]));
        const left = 50 + (Math.min(v, 0) / range) * 50;
        const width = (Math.abs(v) / range) * 50;
        return (
          <div key={b.name} role="row" className="grid grid-cols-[62px_1fr_56px] items-center gap-2 text-xs">
            <span role="cell">{b.name}</span>
            <div role="presentation" className="relative h-3.5 bg-wash">
              <span className="absolute inset-y-0 left-1/2 w-px bg-ink" />
              <span className="absolute inset-y-0.5" style={{ left: `${left}%`, width: `${width}%`, background: v > 0 ? '#c2185b' : '#1f5fd6' }} />
            </div>
            <span role="cell" className="mono text-right">{diff[i] > 0 ? '+' : ''}{diff[i].toFixed(1)} dB</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReferencePart() {
  const reference = useLive((s) => s.reference);
  const ab = useLive((s) => s.ab);
  const [playing, setPlaying] = useState(false);
  const [diff, setDiff] = useState<number[] | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(audio.mixSeconds());
      const mine = audio.mixBands();
      if (mine && audio.refBands && audio.mixSeconds() >= 2) setDiff(balanceDifference(mine, audio.refBands));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const open = async (f: File) => {
    setError(null);
    try {
      await audio.loadReference(await f.arrayBuffer(), f.name);
      setPlaying(false);
      setDiff(null);
    } catch {
      setError(`Could not read ${f.name}. Try a WAV, MP3, AIFF or M4A file.`);
    }
  };

  return (
    <Part
      type="reference"
      width={520}
      status={reference ? reference.name : 'No track loaded'}
      ports={[
        { id: 'audio-in', side: 'left', label: 'Your mix', top: 58 },
        { id: 'audio-out', side: 'left', label: 'Out', top: 96 },
      ]}
    >
      <input ref={file} type="file" accept="audio/*" hidden onChange={(e) => e.target.files?.[0] && open(e.target.files[0])} />
      <div className="flex items-center gap-2">
        <Button variant={reference ? 'outline' : 'solid'} onClick={() => file.current?.click()}>{reference ? 'Replace track' : 'Load a reference track'}</Button>
        {reference && (
          <>
            <Button
              onClick={() => {
                if (playing) {
                  audio.stopReference();
                  audio.setAB('mix');
                } else {
                  audio.startReference();
                  audio.setAB('reference');
                }
                setPlaying(!playing);
              }}
            >
              {playing ? 'Stop track' : 'Play track'}
            </Button>
            <Segmented
              ariaLabel="What you hear"
              className="ml-auto"
              value={ab}
              onChange={(v) => {
                if (v === 'reference' && !playing) {
                  audio.startReference();
                  setPlaying(true);
                }
                audio.setAB(v);
              }}
              options={[{ value: 'mix', label: 'Hear mine' }, { value: 'reference', label: 'Hear reference' }]}
            />
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-live-dark">{error}</p>}
      {!reference && <p className="mt-2 text-xs text-muted">Pick a track you wish you had made. Playback is level matched, so loudness will not bias you.</p>}

      <Heading>Tonal balance, mine against reference</Heading>
      {reference && diff ? (
        <BalanceChart diff={diff} />
      ) : (
        <p className="text-xs text-muted">
          {reference ? 'Play your pattern for a few seconds to compare.' : 'Load a track, then play your pattern. The chart shows where you have more or less energy than the reference, with overall level removed.'}
        </p>
      )}
      {reference && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span className="mono">{seconds.toFixed(0)} s of your mix measured</span>
          <Button size="sm" variant="ghost" onClick={() => { audio.resetMixAverage(); setDiff(null); }}>Start over</Button>
        </div>
      )}
    </Part>
  );
}

function Meter({ label, node }: { label: string; node: () => AnalyserNode | undefined }) {
  const bar = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLSpanElement>(null);
  const data = useRef<Float32Array<ArrayBuffer> | null>(null);
  const held = useRef(0);
  const connected = useLive((s) => s.audioReady);

  useAnimation(() => {
    const a = node();
    if (!a || !bar.current) return;
    data.current ??= new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(data.current);
    let p = 0;
    for (const v of data.current) p = Math.max(p, Math.abs(v));
    const dB = db(p);
    bar.current.style.width = `${Math.max(0, (dB + 60) / 60) * 100}%`;
    if (dB >= -0.1) held.current = performance.now();
    if (clip.current) clip.current.style.visibility = performance.now() - held.current < 1500 ? 'visible' : 'hidden';
  }, connected);

  return (
    <div className="grid grid-cols-[14px_1fr_34px] items-center gap-2 text-xs">
      <span>{label}</span>
      <div className="relative h-3 border border-ink"><div ref={bar} className="h-full bg-ink" style={{ width: 0 }} /></div>
      <span ref={clip} className="font-semibold text-live-dark" style={{ visibility: 'hidden' }}>Clip</span>
    </div>
  );
}

export function MonitorPart() {
  const masterGain = useProject((s) => s.masterGain);
  const monitorGain = useProject((s) => s.monitorGain);
  const setTop = useProject((s) => s.setTop);
  const outputs = useLive((s) => s.devices.outputs);
  const [output, setOutput] = useState('default');
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <Part type="monitor" width={340} status="Sound output" ports={[{ id: 'audio-in', side: 'left', label: 'Audio', top: 58 }]}>
      <div className="space-y-2">
        <Meter label="L" node={() => audio.meterL} />
        <Meter label="R" node={() => audio.meterR} />
      </div>
      <div className="mt-3 space-y-1">
        <Slider label="Main volume" value={masterGain} min={0} max={1} step={0.01} format={pct} onChange={(v) => { setTop({ masterGain: v }); audio.setMaster(v); }} />
        <Slider label="Cycles level" value={monitorGain} min={0} max={1} step={0.01} format={pct} onChange={(v) => { setTop({ monitorGain: v }); audio.setMonitor(v); }} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="w-[84px] shrink-0">Output</span>
        <Select
          ariaLabel="Output device"
          className="min-w-0 flex-1"
          value={output}
          onChange={(v) => { setOutput(v); void audio.setOutput(v); }}
          options={outputs.length ? outputs.map((d) => ({ value: d.deviceId, label: d.label || 'Output' })) : [{ value: 'default', label: 'System default' }]}
        />
      </div>
    </Part>
  );
}
