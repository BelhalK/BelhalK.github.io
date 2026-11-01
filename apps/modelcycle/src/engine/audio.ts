import { del, get as idbGet, set as idbSet } from 'idb-keyval';
import type { Edge, Node } from '@xyflow/react';
import { averageBands, BANDS, bandsFromPower, detectTransients, estimateBpm, gridSlices, rms, toMono } from '@/lib/analysis';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { baseType } from '@/flow/defaults';

const DEVICE_MATCH = /elektron|model\s*:?\s*cycles/i;
const FM_MATCH = /fm-?\s?1\b|m-?\s?vave/i;

type Port = { input?: AudioNode; output?: AudioNode };

const RAW_AUDIO: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 2,
};

export const ANALYSER_FFT = 4096;

// macOS can leave this pending forever while Chrome lacks system microphone access.
const OPEN_TIMEOUT_MS = 8000;

function openInput(constraints: MediaTrackConstraints) {
  return new Promise<MediaStream>((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(new DOMException('Timed out opening the input', 'TimeoutError'));
    }, OPEN_TIMEOUT_MS);
    navigator.mediaDevices.getUserMedia({ audio: constraints }).then(
      (stream) => {
        clearTimeout(timer);
        // A late success after giving up must not hold the input open.
        if (timedOut) stream.getTracks().forEach((t) => t.stop());
        else resolve(stream);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

class Audio {
  ctx: AudioContext | null = null;
  private ports = new Map<string, Port>();
  private wires = new Set<string>();

  private master!: GainNode;
  meterL!: AnalyserNode;
  meterR!: AnalyserNode;
  private cyclesStream: MediaStream | null = null;
  private cyclesSource: MediaStreamAudioSourceNode | null = null;
  private cyclesGain!: GainNode;
  private fmStream: MediaStream | null = null;
  private fmSource: MediaStreamAudioSourceNode | null = null;
  private fmGain!: GainNode;
  private chopGain!: GainNode;
  private refGain!: GainNode;
  private refInput!: AnalyserNode;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  micAnalyser!: AnalyserNode;
  private recorder: MediaRecorder | null = null;

  chopBuffer: AudioBuffer | null = null;
  private activeChops = new Set<AudioBufferSourceNode>();
  refBuffer: AudioBuffer | null = null;
  private refSource: AudioBufferSourceNode | null = null;
  refBands: number[] | null = null;
  refRms = 0;
  private mixPower: Float64Array | null = null;
  private mixFrames = 0;

  /** Creates the context. Must be called from a user gesture. */
  async start() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = useProject.getState().masterGain;
      const splitter = c.createChannelSplitter(2);
      this.meterL = this.analyser(2048);
      this.meterR = this.analyser(2048);
      this.master.connect(c.destination);
      this.master.connect(splitter);
      splitter.connect(this.meterL, 0);
      splitter.connect(this.meterR, 1);
      this.cyclesGain = c.createGain();
      this.cyclesGain.gain.value = useProject.getState().monitorGain;
      this.chopGain = c.createGain();
      this.chopGain.gain.value = useProject.getState().chopLevel;
      this.fmGain = c.createGain();
      this.fmGain.gain.value = useProject.getState().fmLevel;
      this.refGain = c.createGain();
      this.refGain.gain.value = 0;
      this.refInput = this.analyser(ANALYSER_FFT);
      this.micAnalyser = this.analyser(2048);
      this.ports.set('monitor', { input: this.master });
      this.ports.set('cycles', { output: this.cyclesGain });
      this.ports.set('chopper', { output: this.chopGain });
      this.ports.set('fm1', { output: this.fmGain });
      this.ports.set('reference', { output: this.refGain, input: this.refInput });
      this.ports.set('recorder', { output: this.micAnalyser });
      navigator.mediaDevices.addEventListener('devicechange', () => {
        void this.refreshDevices().then(() => this.connectFm());
      });
    }
    // Not awaited: resume can stay pending until an output is ready.
    void this.ctx.resume();
    this.sync(useProject.getState().nodes, useProject.getState().edges);
    this.startMixAverage();
    await this.restoreChop();
    await this.connectCycles();
    await this.connectFm();
    this.sync(useProject.getState().nodes, useProject.getState().edges);
  }

  resume() {
    void this.ctx?.resume();
  }

  private analyser(fft: number) {
    const a = this.ctx!.createAnalyser();
    a.fftSize = fft;
    a.smoothingTimeConstant = 0;
    return a;
  }

  async refreshDevices() {
    const all = await navigator.mediaDevices.enumerateDevices();
    useLive.getState().set({
      devices: {
        inputs: all.filter((d) => d.kind === 'audioinput' && d.deviceId !== 'default' && d.deviceId !== 'communications'),
        outputs: all.filter((d) => d.kind === 'audiooutput' && d.deviceId !== 'communications'),
      },
    });
    return all;
  }

  async connectCycles() {
    const live = useLive.getState();
    try {
      let all = await this.refreshDevices();
      // Labels stay hidden until the first permission grant.
      if (!all.some((d) => d.label)) {
        const probe = await openInput(RAW_AUDIO);
        probe.getTracks().forEach((t) => t.stop());
        all = await this.refreshDevices();
      }
      const device = all.find((d) => d.kind === 'audioinput' && DEVICE_MATCH.test(d.label));
      if (!device) {
        live.set({ audio: 'missing' });
        return;
      }
      this.cyclesStream?.getTracks().forEach((t) => t.stop());
      this.cyclesSource?.disconnect();
      this.cyclesStream = await openInput({ ...RAW_AUDIO, deviceId: { exact: device.deviceId } });
      this.cyclesSource = this.ctx!.createMediaStreamSource(this.cyclesStream);
      this.cyclesSource.connect(this.cyclesGain);
      this.cyclesStream.getTracks()[0].onended = () => useLive.getState().set({ audio: 'missing' });
      useLive.getState().set({ audio: 'connected' });
      await this.avoidFeedbackOutput(all);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      useLive.getState().set({ audio: name === 'NotAllowedError' ? 'denied' : name === 'TimeoutError' ? 'blocked' : 'error' });
    }
  }

  /** Opens the FM-1's USB audio. Safe to call again whenever devices change. */
  async connectFm() {
    if (!this.ctx) return;
    const chosen = useProject.getState().fmAudioInput;
    const inputs = useLive.getState().devices.inputs;
    const device = inputs.find((d) => (chosen ? d.label === chosen : FM_MATCH.test(d.label)));
    const open = this.fmStream?.getTracks()[0];
    if (open?.readyState === 'live' && device && open.getSettings().deviceId === device.deviceId) return;
    open?.stop();
    this.fmSource?.disconnect();
    this.fmStream = null;
    this.fmSource = null;
    if (!device) {
      useLive.getState().set({ fmAudio: 'missing' });
      return;
    }
    try {
      this.fmStream = await openInput({ ...RAW_AUDIO, deviceId: { exact: device.deviceId } });
      this.fmSource = this.ctx.createMediaStreamSource(this.fmStream);
      this.fmSource.connect(this.fmGain);
      this.fmStream.getTracks()[0].onended = () => useLive.getState().set({ fmAudio: 'missing' });
      useLive.getState().set({ fmAudio: 'connected' });
    } catch (err) {
      useLive.getState().set({ fmAudio: err instanceof DOMException && err.name === 'TimeoutError' ? 'blocked' : 'error' });
    }
  }

  startFmCapture() {
    if (!this.fmStream) throw new Error('FM-1 audio is not connected');
    return this.startRecording(this.fmStream);
  }

  /** Never leave the output on the Cycles itself: its USB return would loop back. */
  private async avoidFeedbackOutput(all: MediaDeviceInfo[]) {
    const outputs = all.filter((d) => d.kind === 'audiooutput');
    const current = outputs.find((d) => d.deviceId === 'default');
    if (current && (DEVICE_MATCH.test(current.label) || FM_MATCH.test(current.label))) {
      const safe = outputs.find((d) => d.deviceId !== 'default' && !DEVICE_MATCH.test(d.label) && !FM_MATCH.test(d.label));
      if (safe) await this.setOutput(safe.deviceId);
    }
  }

  async setOutput(deviceId: string) {
    const ctx = this.ctx as AudioContext & { setSinkId?: (id: string) => Promise<void> };
    await ctx?.setSinkId?.(deviceId === 'default' ? '' : deviceId);
  }

  setMaster(v: number) {
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }
  setMonitor(v: number) {
    if (this.ctx) this.cyclesGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }

  setChopLevel(v: number) {
    if (this.ctx) this.chopGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }
  setFmLevel(v: number) {
    // While A/B is on the reference the FM-1 stays silent; the new level applies on the way back.
    if (this.ctx && useLive.getState().ab === 'mix') this.fmGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }

  // Graph: canvas edges are the real audio connections.

  registerAnalyser(id: string, fft = ANALYSER_FFT): AnalyserNode | null {
    if (!this.ctx) return null;
    const existing = this.ports.get(id);
    if (existing?.input) return existing.input as AnalyserNode;
    const a = this.analyser(fft);
    this.ports.set(id, { input: a });
    const { nodes, edges } = useProject.getState();
    this.sync(nodes, edges);
    return a;
  }

  sync(nodes: Node[], edges: Edge[]) {
    if (!this.ctx) return;
    const ids = new Set(nodes.map((n) => n.id));
    // Copies of a device or file part share its one audio port; analysers each have their own.
    const portOf = (id: string) => {
      if (this.ports.has(id)) return id;
      const base = baseType(id);
      return base === 'spectrogram' || base === 'spectrum' ? null : base;
    };
    const want = new Set<string>();
    for (const e of edges) {
      if (e.sourceHandle !== 'audio-out' || !ids.has(e.source) || !ids.has(e.target)) continue;
      const from = portOf(e.source);
      const to = portOf(e.target);
      if (from && to) want.add(`${from}>${to}`);
    }
    for (const wire of this.wires) {
      if (!want.has(wire)) {
        const [s, t] = wire.split('>');
        const from = this.ports.get(s)?.output;
        const to = this.ports.get(t)?.input;
        if (from && to) from.disconnect(to);
        this.wires.delete(wire);
      }
    }
    for (const wire of want) {
      if (this.wires.has(wire)) continue;
      const [s, t] = wire.split('>');
      const from = this.ports.get(s)?.output;
      const to = this.ports.get(t)?.input;
      if (from && to) {
        from.connect(to);
        this.wires.add(wire);
      }
    }
  }

  /** Sum of audio arriving at a node's input is non-silent only when wired. */
  isFed(id: string) {
    for (const wire of this.wires) if (wire.endsWith(`>${id}`)) return true;
    return false;
  }

  // Chopper

  async loadChop(data: ArrayBuffer, name: string, save = true) {
    if (!this.ctx) await this.start();
    const copy = data.slice(0);
    this.chopBuffer = await this.ctx!.decodeAudioData(data);
    if (save) {
      await idbSet('chop', { data: copy, name });
      useProject.getState().setTop({ slices: gridSlices(this.chopBuffer.length, useProject.getState().chopSteps) });
    }
    this.publishChop(name);
  }

  loadChopBuffer(buffer: AudioBuffer, name: string) {
    this.chopBuffer = buffer;
    void del('chop');
    useProject.getState().setTop({ slices: gridSlices(buffer.length, useProject.getState().chopSteps) });
    this.publishChop(name);
  }

  private publishChop(name: string) {
    const b = this.chopBuffer!;
    const live = useLive.getState();
    live.set({
      chop: { name, duration: b.duration, sampleRate: b.sampleRate },
      chopPeaksVersion: live.chopPeaksVersion + 1,
      selectedSlice: 0,
    });
  }

  private async restoreChop() {
    if (this.chopBuffer) return;
    const saved = await idbGet<{ data: ArrayBuffer; name: string }>('chop');
    if (saved) await this.loadChop(saved.data, saved.name, false);
  }

  sliceSpan(index: number) {
    const { slices } = useProject.getState();
    const b = this.chopBuffer;
    if (!b || !slices.length) return null;
    const i = Math.min(index, slices.length - 1);
    return { start: slices[i], end: slices[i + 1] ?? b.length };
  }

  /** time is in performance.now() milliseconds. */
  playSlice(index: number, time: number, gain = 1) {
    const span = this.sliceSpan(index);
    if (!span || !this.ctx) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = this.chopBuffer;
    g.gain.value = gain;
    src.connect(g).connect(this.chopGain);
    const at = c.currentTime + Math.max(0, (time - performance.now()) / 1000);
    const dur = (span.end - span.start) / this.chopBuffer!.sampleRate;
    src.start(at, span.start / this.chopBuffer!.sampleRate, dur);
    this.activeChops.add(src);
    src.onended = () => this.activeChops.delete(src);
  }

  stopChops() {
    this.activeChops.forEach((s) => s.stop());
    this.activeChops.clear();
  }

  sliceMono(index: number) {
    const span = this.sliceSpan(index);
    if (!span) return null;
    return toMono(this.chopBuffer!).subarray(span.start, span.end);
  }

  sliceBy(mode: 'grid' | 'transient', count: number) {
    const b = this.chopBuffer;
    if (!b) return;
    const slices = mode === 'grid' ? gridSlices(b.length, count) : detectTransients(toMono(b), b.sampleRate, count);
    useProject.getState().setTop({ slices, chopSteps: count });
    useLive.getState().set({ selectedSlice: 0 });
  }

  chopBpm() {
    return this.chopBuffer ? estimateBpm(toMono(this.chopBuffer), this.chopBuffer.sampleRate) : null;
  }

  // Recorder

  async armRecorder(deviceId: string) {
    if (!this.ctx) await this.start();
    this.disarmRecorder();
    this.micStream = await openInput({ ...RAW_AUDIO, deviceId: deviceId ? { exact: deviceId } : undefined });
    this.micSource = this.ctx!.createMediaStreamSource(this.micStream);
    this.micSource.connect(this.micAnalyser);
  }

  disarmRecorder() {
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micSource?.disconnect();
    this.micStream = null;
    this.micSource = null;
  }

  startRecording(stream = this.micStream) {
    if (!stream) throw new Error('Recorder is not armed');
    const chunks: Blob[] = [];
    this.recorder = new MediaRecorder(stream);
    const done = new Promise<AudioBuffer>((resolve, reject) => {
      this.recorder!.ondataavailable = (e) => chunks.push(e.data);
      this.recorder!.onstop = async () => {
        try {
          const data = await new Blob(chunks).arrayBuffer();
          resolve(await this.ctx!.decodeAudioData(data));
        } catch (err) {
          reject(err);
        }
      };
    });
    this.recorder.start();
    useLive.getState().set({ recording: true });
    return done;
  }

  stopRecording() {
    this.recorder?.stop();
    useLive.getState().set({ recording: false });
  }

  previewBuffer(buffer: AudioBuffer) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.master);
    src.start();
    return src;
  }

  // Reference

  async loadReference(data: ArrayBuffer, name: string) {
    if (!this.ctx) await this.start();
    this.stopReference();
    this.refBuffer = await this.ctx!.decodeAudioData(data);
    const mono = toMono(this.refBuffer);
    this.refBands = averageBands(mono, this.refBuffer.sampleRate);
    this.refRms = rms(mono);
    this.resetMixAverage();
    useLive.getState().set({ reference: { name, duration: this.refBuffer.duration, sampleRate: this.refBuffer.sampleRate } });
  }

  startReference() {
    if (!this.refBuffer || !this.ctx || this.refSource) return;
    this.refSource = this.ctx.createBufferSource();
    this.refSource.buffer = this.refBuffer;
    this.refSource.loop = true;
    this.refSource.connect(this.refGain);
    this.refSource.start();
  }

  stopReference() {
    this.refSource?.stop();
    this.refSource = null;
  }

  /** Switches between the two sources at matched loudness, so the louder one does not win. */
  setAB(which: 'mix' | 'reference') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const mixLevel = this.mixRms();
    const match = mixLevel > 1e-4 && this.refRms > 0 ? Math.min(2, mixLevel / this.refRms) : 1;
    this.refGain.gain.setTargetAtTime(which === 'reference' ? match : 0, t, 0.01);
    this.cyclesGain.gain.setTargetAtTime(which === 'mix' ? useProject.getState().monitorGain : 0, t, 0.01);
    this.fmGain.gain.setTargetAtTime(which === 'mix' ? useProject.getState().fmLevel : 0, t, 0.01);
    useLive.getState().set({ ab: which });
  }

  private startMixAverage() {
    if (this.mixPower) return;
    const bins = new Float32Array(this.refInput.frequencyBinCount);
    this.mixPower = new Float64Array(bins.length);
    setInterval(() => {
      if (useLive.getState().ab !== 'mix') return;
      this.refInput.getFloatFrequencyData(bins);
      if (!isFinite(bins[10])) return;
      let sum = 0;
      for (let i = 0; i < bins.length; i++) sum += 10 ** (bins[i] / 10);
      if (sum < 1e-7) return;
      for (let i = 0; i < bins.length; i++) this.mixPower![i] += 10 ** (bins[i] / 10);
      this.mixFrames++;
    }, 100);
  }

  resetMixAverage() {
    this.mixPower?.fill(0);
    this.mixFrames = 0;
  }

  mixSeconds() {
    return this.mixFrames / 10;
  }

  mixBands(): number[] | null {
    if (!this.mixPower || !this.mixFrames || !this.ctx) return null;
    const avg = Array.from(this.mixPower, (v) => v / this.mixFrames);
    return bandsFromPower(avg, this.ctx.sampleRate / ANALYSER_FFT);
  }

  private mixRms() {
    const data = new Float32Array(this.refInput.fftSize);
    this.refInput.getFloatTimeDomainData(data);
    return rms(data);
  }

  isReferencePlaying() {
    return !!this.refSource;
  }
}

export const BAND_NAMES = BANDS.map((b) => b.name);
export const audio = new Audio();
