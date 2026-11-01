import { pulse, useLive } from '@/store/live';
import { useProject } from '@/store/project';

const DEVICE_MATCH = /model\s*:?\s*cycles/i;
const FM_MATCH = /fm-?\s?1\b|m-?\s?vave/i;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

type Handlers = {
  onClock: (time: number) => void;
  onStart: () => void;
  onContinue: () => void;
  onStop: () => void;
  onNote: (channel: number, note: number, velocity: number) => void;
  onCC: (channel: number, cc: number, value: number) => void;
  onProgram: (program: number) => void;
};

class Midi {
  private access: MIDIAccess | null = null;
  private output: MIDIOutput | null = null;
  private input: MIDIInput | null = null;
  private fmOutput: MIDIOutput | null = null;
  private fmInput: MIDIInput | null = null;
  handlers: Partial<Handlers> = {};

  async connect() {
    if (!navigator.requestMIDIAccess) {
      useLive.getState().set({ midi: 'unsupported' });
      return;
    }
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch {
      useLive.getState().set({ midi: 'denied' });
      return;
    }
    this.access.onstatechange = () => this.bind();
    this.bind();
  }

  /** Connects without a click once Chrome has already allowed MIDI for this site. */
  async reconnect() {
    const permission = await navigator.permissions?.query({ name: 'midi' as PermissionName }).catch(() => null);
    if (permission?.state === 'granted') await this.connect();
  }

  private bind() {
    if (!this.access) return;
    const find = <T extends MIDIPort>(ports: Iterable<T>) =>
      [...ports].find((p) => DEVICE_MATCH.test(p.name ?? '') && p.state === 'connected') ?? null;
    this.output = find(this.access.outputs.values());
    const input = find(this.access.inputs.values());
    if (input !== this.input) {
      if (this.input) this.input.onmidimessage = null;
      this.input = input;
      if (input) input.onmidimessage = (e) => this.receive(e);
    }
    // A port chosen by hand wins over the name match, since the synth's USB name is unconfirmed.
    const chosen = useProject.getState().fmMidiPort;
    const isFm = (p: MIDIPort) => p.state === 'connected' && (chosen ? p.name === chosen : FM_MATCH.test(p.name ?? ''));
    this.fmOutput = [...this.access.outputs.values()].find(isFm) ?? null;
    const fmInput = [...this.access.inputs.values()].find(isFm) ?? null;
    if (fmInput !== this.fmInput) {
      if (this.fmInput) this.fmInput.onmidimessage = null;
      this.fmInput = fmInput;
      if (fmInput) fmInput.onmidimessage = (e) => this.receiveFm(e);
    }
    useLive.getState().set({
      midi: this.output ? 'connected' : 'missing',
      midiInput: !!this.input,
      fmMidi: !!this.fmOutput,
      midiOutputs: [...this.access.outputs.values()].filter((p) => p.state === 'connected').map((p) => p.name ?? 'Unnamed port'),
    });
  }

  rebind() {
    this.bind();
  }

  private receiveFm(e: MIDIMessageEvent) {
    const d = e.data;
    if (!d || (d[0] & 0xf0) !== 0x90 || d[2] === 0) return;
    useLive.getState().set({ fmLastNote: `${NOTE_NAMES[d[1] % 12]}${Math.floor(d[1] / 12) - 2}` });
    pulse('fm1>sequencer');
  }

  private lastHeard = { clock: 0, transport: 0, notes: 0 };
  private heardTimer = 0;

  /** Records what the Cycles sends, for the readout in its node. Published at most twice a second. */
  private noteHeard(status: number, velocity: number) {
    const now = performance.now();
    if (status === 0xf8) this.lastHeard.clock = now;
    else if (status === 0xfa || status === 0xfb || status === 0xfc) this.lastHeard.transport = now;
    else if ((status & 0xf0) === 0x90 && velocity > 0) this.lastHeard.notes = now;
    else return;
    if (this.heardTimer) return;
    this.heardTimer = window.setTimeout(() => {
      this.heardTimer = 0;
      useLive.getState().set({ heard: { ...this.lastHeard } });
    }, 500);
  }

  private receive(e: MIDIMessageEvent) {
    const data = e.data;
    if (!data) return;
    const status = data[0];
    this.noteHeard(status, data[2]);
    if (status === 0xf8) return this.handlers.onClock?.(e.timeStamp);
    if (status === 0xfa) return this.handlers.onStart?.();
    if (status === 0xfb) return this.handlers.onContinue?.();
    if (status === 0xfc) return this.handlers.onStop?.();
    const kind = status & 0xf0;
    const channel = status & 0x0f;
    if (kind === 0x90 && data[2] > 0) this.handlers.onNote?.(channel, data[1], data[2]);
    if (kind === 0xb0) this.handlers.onCC?.(channel, data[1], data[2]);
    // Any channel: the Cycles sets its own program change channel.
    if (kind === 0xc0) this.handlers.onProgram?.(data[1]);
  }

  private send(bytes: number[], time?: number) {
    this.output?.send(bytes, time);
  }

  note(channel: number, note: number, velocity: number, time: number, gateMs: number) {
    this.send([0x90 | channel, note, velocity], time);
    this.send([0x80 | channel, note, 0], time + gateMs);
  }
  fmNote(channel: number, note: number, velocity: number, time: number, gateMs: number) {
    this.fmOutput?.send([0x90 | channel, note, velocity], time);
    this.fmOutput?.send([0x80 | channel, note, 0], time + gateMs);
  }
  fmProgram(channel: number, program: number) {
    this.fmOutput?.send([0xc0 | channel, program]);
  }
  cc(channel: number, cc: number, value: number) {
    this.send([0xb0 | channel, cc, Math.round(value)]);
  }
  programChange(channel: number, program: number) {
    this.send([0xc0 | channel, program]);
  }
  clock(time: number) {
    this.send([0xf8], time);
  }
  start() {
    this.send([0xfa]);
  }
  stop() {
    this.send([0xfc]);
  }
  /** All Notes Off on the six track channels. */
  panic() {
    for (let c = 0; c < 6; c++) this.send([0xb0 | c, 123, 0]);
    this.fmOutput?.send([0xb0 | useProject.getState().fmChannel, 123, 0]);
  }
}

export const midi = new Midi();
