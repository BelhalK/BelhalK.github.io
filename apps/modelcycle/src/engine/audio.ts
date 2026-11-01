import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Edge, Node } from '@xyflow/react';
import { averageBands, BANDS, bandsFromPower, detectTransients, encodeWav, estimateBpm, gridSlices, rms, toMono } from '@/lib/analysis';
import { driveCurve, kitSampleUrls, kitSound, type KitSound, kitVoice } from '@/lib/kits';
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
// A person on a phone may still be reading the permission prompt.
const MIC_TIMEOUT_MS = 60000;

function openInput(constraints: MediaTrackConstraints, timeout = OPEN_TIMEOUT_MS) {
  return new Promise<MediaStream>((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(new DOMException('Timed out opening the input', 'TimeoutError'));
    }, timeout);
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
  private micOpening = false;
  private micSource: MediaStreamAudioSourceNode | null = null;
  micAnalyser!: AnalyserNode;
  private recorder: MediaRecorder | null = null;

  chopBuffer: AudioBuffer | null = null;
  private chopLoads = 0;
  private activeChops = new Set<AudioBufferSourceNode>();
  refBuffer: AudioBuffer | null = null;
  private refSource: AudioBufferSourceNode | null = null;
  refBands: number[] | null = null;
  refRms = 0;
  private mixPower: Float64Array | null = null;
  private mixFrames = 0;
  private kitBuffers: AudioBuffer[] = [];
  private kitRequest = '';
  private kitDelay: DelayNode | null = null;
  private kitReverb: ConvolverNode | null = null;

  /** Connects the devices. Must be called from a user gesture. */
  async start() {
    this.boot();
    await this.connectCycles();
    await this.connectFm();
    this.sync(useProject.getState().nodes, useProject.getState().edges);
  }

  /** Creates the context without asking for any device. Must be called from a user gesture. */
  boot() {
    this.setAudioSession();
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
      navigator.mediaDevices?.addEventListener('devicechange', () => {
        void this.refreshDevices().then(() => this.connectFm());
      });
      useLive.getState().set({ audioReady: true });
      void this.restoreChop();
    }
    // Not awaited: resume can stay pending until an output is ready.
    void this.ctx.resume();
    // Mobile browsers open the output for good once a sound starts inside a tap.
    if (this.ctx.state !== 'running') {
      const unlock = this.ctx.createBufferSource();
      unlock.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      unlock.connect(this.ctx.destination);
      unlock.start();
    }
    this.sync(useProject.getState().nodes, useProject.getState().edges);
    this.startMixAverage();
  }

  /** iPhones mute web audio under the silent switch unless the page counts as playback, but playback cannot use the mic. */
  private setAudioSession() {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = this.micOpening || this.micStream ? 'play-and-record' : 'playback';
  }

  // Kit: what T1 to T6 play while no Model:Cycles is connected. It leaves through
  // the Cycles port, so the cables on the canvas route it like the real device.

  /** Decodes offline, so the samples are ready before the first click allows an AudioContext. */
  async loadKit(kit: string) {
    this.kitRequest = kit;
    useLive.getState().set({ kit: 'loading' });
    try {
      const decoder = new OfflineAudioContext(2, 1, 48000);
      const buffers = await Promise.all(kitSampleUrls(kit).map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        return decoder.decodeAudioData(await response.arrayBuffer());
      }));
      if (this.kitRequest !== kit) return;
      this.kitBuffers = buffers;
      useLive.getState().set({ kit: 'ready' });
    } catch {
      if (this.kitRequest === kit) useLive.getState().set({ kit: 'error' });
    }
  }

  /** time is in performance.now() milliseconds. T1 to T4 are samples, T5 a bass and T6 a chord. */
  playKit(track: number, note: number, velocity: number, time: number) {
    if (!this.ctx) return;
    const c = this.ctx;
    const at = c.currentTime + Math.max(0, (time - performance.now()) / 1000);
    const params = useLive.getState().deviceParams[track];
    const sound = kitSound(params);
    const voice = kitVoice(track, params);
    const gain = (velocity / 127) * sound.gain;
    const pitch = (n: number) => 440 * 2 ** ((n + sound.semitones - 69) / 12);
    if (voice === 4) this.playKitSynth('sawtooth', [pitch(note)], at, sound.decay ?? 0.28, sound, sound.cutoff ?? 500, gain * 0.7);
    else if (voice === 5) this.playKitSynth('triangle', [0, 3, 7].map((i) => pitch(note + i)), at, sound.decay ?? 0.35, sound, sound.cutoff ?? 1800, gain * 0.3);
    else if (this.kitBuffers[voice]) {
      const src = c.createBufferSource();
      src.buffer = this.kitBuffers[voice];
      // Note 60 is the sample's own pitch, as the Note control's default.
      const rate = 2 ** ((note - 60 + sound.semitones) / 12);
      src.playbackRate.setValueAtTime(rate * 2 ** (sound.sweep / 12), at);
      if (sound.sweep) src.playbackRate.exponentialRampToValueAtTime(rate, at + sound.sweepTime);
      src.connect(this.kitChain(sound, sound.cutoff, gain, at));
      src.start(at);
      if (sound.decay !== null) src.stop(at + sound.decay);
    }
  }

  /** The FM-1 lane's voice while no FM-1 is connected: two operators, leaving through the FM-1 port. */
  playFm(note: number, velocity: number, time: number, length: number) {
    if (!this.ctx) return;
    const c = this.ctx;
    const at = c.currentTime + Math.max(0, (time - performance.now()) / 1000);
    const pitch = 440 * 2 ** ((note - 69) / 12);
    const carrier = c.createOscillator();
    const modulator = c.createOscillator();
    const depth = c.createGain();
    const level = c.createGain();
    carrier.frequency.value = pitch;
    modulator.frequency.value = pitch * 2;
    depth.gain.setValueAtTime(pitch * 3, at);
    depth.gain.exponentialRampToValueAtTime(pitch * 0.2, at + length);
    level.gain.setValueAtTime((velocity / 127) * 0.4, at);
    level.gain.exponentialRampToValueAtTime(0.001, at + length);
    modulator.connect(depth).connect(carrier.frequency);
    carrier.connect(level).connect(this.fmGain);
    for (const osc of [carrier, modulator]) {
      osc.start(at);
      osc.stop(at + length);
    }
  }

  private playKitSynth(type: OscillatorType, frequencies: number[], at: number, length: number, sound: KitSound, cutoff: number, gain: number) {
    const c = this.ctx!;
    const input = this.kitChain({ ...sound, decay: length }, cutoff, gain, at);
    for (const frequency of frequencies) {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      if (sound.sweep) {
        osc.detune.setValueAtTime(sound.sweep * 100, at);
        osc.detune.linearRampToValueAtTime(0, at + sound.sweepTime);
      }
      osc.connect(input);
      osc.start(at);
      osc.stop(at + length);
    }
  }

  /** One hit's path to the Cycles port, built from what the Sounds part has set. Returns its input. */
  private kitChain(sound: KitSound, cutoff: number | null, gain: number, at: number) {
    const c = this.ctx!;
    const input = c.createGain();
    let last: AudioNode = input;
    if (sound.drive !== null) {
      const shaper = c.createWaveShaper();
      shaper.curve = driveCurve(sound.drive);
      last = last.connect(shaper);
    }
    if (cutoff !== null) {
      const filter = c.createBiquadFilter();
      filter.frequency.value = cutoff;
      last = last.connect(filter);
    }
    const level = c.createGain();
    level.gain.setValueAtTime(gain, at);
    if (sound.decay !== null) level.gain.exponentialRampToValueAtTime(0.001, at + sound.decay);
    last.connect(level);
    const panner = c.createStereoPanner();
    panner.pan.value = sound.pan;
    level.connect(panner).connect(this.cyclesGain);
    if (sound.delay > 0 || sound.reverb > 0) {
      const { delay, reverb } = this.kitSends();
      delay.delayTime.setValueAtTime(Math.min(0.99, (60 / useProject.getState().bpm) * 0.75), at);
      const toDelay = c.createGain();
      const toReverb = c.createGain();
      toDelay.gain.value = sound.delay;
      toReverb.gain.value = sound.reverb;
      level.connect(toDelay).connect(delay);
      level.connect(toReverb).connect(reverb);
    }
    return input;
  }

  private kitSends() {
    if (!this.kitDelay || !this.kitReverb) {
      const c = this.ctx!;
      this.kitDelay = c.createDelay(1);
      const feedback = c.createGain();
      feedback.gain.value = 0.35;
      this.kitDelay.connect(feedback).connect(this.kitDelay);
      this.kitDelay.connect(this.cyclesGain);
      // A short burst of fading noise is enough of a room.
      const impulse = c.createBuffer(2, Math.floor(c.sampleRate * 1.4), c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
      }
      this.kitReverb = c.createConvolver();
      this.kitReverb.buffer = impulse;
      this.kitReverb.connect(this.cyclesGain);
    }
    return { delay: this.kitDelay, reverb: this.kitReverb };
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
    this.boot();
    const copy = data.slice(0);
    const load = save ? ++this.chopLoads : this.chopLoads;
    const decoded = await this.ctx!.decodeAudioData(data);
    // Restoring the saved sample must not land on top of something newer.
    if (load !== this.chopLoads) return;
    this.chopBuffer = decoded;
    if (save) {
      await idbSet('chop', { data: copy, name });
      useProject.getState().setTop({ slices: gridSlices(this.chopBuffer.length, useProject.getState().chopSteps) });
    }
    this.publishChop(name);
  }

  loadChopBuffer(buffer: AudioBuffer, name: string) {
    this.chopLoads++;
    this.chopBuffer = buffer;
    // Kept as a WAV so the take survives the phone reloading the page.
    void encodeWav(buffer).arrayBuffer().then((data) => idbSet('chop', { data, name }));
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
    if (saved && !this.chopBuffer) await this.loadChop(saved.data, saved.name, false);
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
    this.resume();
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

  /** Needs no Connect first: a phone has no device to connect, only its own mic. */
  async armRecorder(deviceId: string) {
    this.disarmRecorder();
    this.micOpening = true;
    try {
      this.boot();
      this.micStream = await this.openMic(deviceId);
    } finally {
      this.micOpening = false;
      this.setAudioSession();
    }
    // Opening the mic can interrupt the context on an iPhone.
    this.resume();
    try {
      this.micSource = this.ctx!.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.micAnalyser);
    } catch {
      // Some browsers refuse a mic at another sample rate. The take records from the stream regardless; only the meter stays still.
    }
    // Input names stay hidden until the permission is granted.
    await this.refreshDevices().catch(() => {});
  }

  private async openMic(deviceId: string) {
    const constraints = { ...RAW_AUDIO, deviceId: deviceId ? { exact: deviceId } : undefined };
    try {
      return await openInput(constraints, MIC_TIMEOUT_MS);
    } catch (err) {
      // Device ids can change between visits, so fall back to the default input.
      if (deviceId && err instanceof DOMException && err.name === 'OverconstrainedError') return openInput(RAW_AUDIO, MIC_TIMEOUT_MS);
      throw err;
    }
  }

  disarmRecorder() {
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micSource?.disconnect();
    this.micStream = null;
    this.micSource = null;
    this.setAudioSession();
  }

  startRecording(stream = this.micStream) {
    if (!stream) throw new Error('Recorder is not armed');
    const chunks: Blob[] = [];
    this.recorder = new MediaRecorder(stream);
    const done = new Promise<AudioBuffer>((resolve, reject) => {
      this.recorder!.ondataavailable = (e) => chunks.push(e.data);
      // Also fires when the system ends the input, such as a call on a phone.
      this.recorder!.onstop = async () => {
        useLive.getState().set({ recording: false });
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
    if (this.recorder?.state === 'recording') this.recorder.stop();
    useLive.getState().set({ recording: false });
  }

  previewBuffer(buffer: AudioBuffer) {
    if (!this.ctx) return;
    this.resume();
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.master);
    src.start();
    return src;
  }

  // Reference

  async loadReference(data: ArrayBuffer, name: string) {
    this.boot();
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
