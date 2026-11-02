import { DATA_LIST, decodeReply, encodeRequest, listArgs, parsePing, parseProjects, parseVersion, PING, PROJECTS_PATH, replyOk, SOFTWARE_VERSION } from '@/lib/elektron';
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

  private sysex = false;
  private linked = false;
  private seq = 0;
  private readRun = 0;
  private pending = new Map<number, { type: number; resolve: (data: Uint8Array) => void; reject: (err: Error) => void }>();

  async connect(sysex = true): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      useLive.getState().set({ midi: 'unsupported' });
      return;
    }
    try {
      this.access = await navigator.requestMIDIAccess({ sysex });
      this.sysex = sysex;
    } catch {
      // Refusing SysEx only costs the project list, so plain MIDI still gets its chance.
      if (sysex) return this.connect(false);
      useLive.getState().set({ midi: 'denied' });
      return;
    }
    this.linked = false;
    this.access.onstatechange = () => this.bind();
    this.bind();
  }

  /** Connects without a click once Chrome has already allowed MIDI for this site. */
  async reconnect() {
    const query = (descriptor: object) => navigator.permissions?.query(descriptor as PermissionDescriptor).catch(() => null);
    if ((await query({ name: 'midi', sysex: true }))?.state === 'granted') return this.connect(true);
    if ((await query({ name: 'midi' }))?.state === 'granted') await this.connect(false);
  }

  /** Sends one read request and waits for the reply that carries its sequence number. */
  private request(command: number, args: number[] = [], timeoutMs = 5000) {
    const seq = this.seq;
    this.seq = (seq + 1) & 0xffff;
    return new Promise<Uint8Array>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(seq);
        reject(new Error('No reply'));
      }, timeoutMs);
      const settle = <T,>(fn: (value: T) => void) => (value: T) => {
        window.clearTimeout(timer);
        this.pending.delete(seq);
        fn(value);
      };
      this.pending.set(seq, { type: command | 0x80, resolve: settle(resolve), reject: settle(reject) });
      try {
        this.output?.send(encodeRequest(seq, command, args));
      } catch (err) {
        this.pending.get(seq)?.reject(err as Error);
      }
    });
  }

  private receiveSysex(raw: Uint8Array) {
    const reply = decodeReply(raw);
    const waiting = reply && this.pending.get(reply.seq);
    if (!waiting) return;
    if (reply.type === waiting.type) waiting.resolve(reply.data);
    else waiting.reject(new Error(`Unexpected reply type ${reply.type}`));
  }

  /** Asks the Cycles who it is and which projects it holds. Read-only. */
  async readDevice() {
    const { set } = useLive.getState();
    if (!this.linked) return;
    if (!this.sysex) return set({ deviceLink: { status: 'no-sysex' } });
    const run = ++this.readRun;
    set({ deviceLink: { status: 'reading' } });
    try {
      const name = parsePing(await this.request(PING, [], 1000));
      const version = parseVersion(await this.request(SOFTWARE_VERSION));
      const list = await this.request(DATA_LIST, listArgs(PROJECTS_PATH));
      if (!replyOk(list)) throw new Error('The Cycles refused the project list');
      const projects = parseProjects(list);
      if (run === this.readRun) set({ deviceLink: { status: 'ready', name, version, projects } });
    } catch (err) {
      if (run !== this.readRun) return;
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ deviceLink: message === 'No reply' ? { status: 'no-reply' } : { status: 'error', message } });
    }
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
    // Sending opens the port, which fires another state change, so this reads once per connection.
    const linked = !!(this.output && this.input);
    if (linked === this.linked) return;
    this.linked = linked;
    if (linked) void this.readDevice();
    else {
      this.readRun++;
      useLive.getState().set({ deviceLink: { status: 'idle' } });
    }
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
    if (status === 0xf0) return this.receiveSysex(data);
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
