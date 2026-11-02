import { create } from 'zustand';
import { LANES } from '@/lib/cycles';
import type { DeviceProject } from '@/lib/elektron';

export type MidiStatus = 'idle' | 'connected' | 'missing' | 'denied' | 'unsupported';
export type AudioStatus = 'idle' | 'connected' | 'missing' | 'denied' | 'blocked' | 'error';
export type Devices = { inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] };
export type Soundfile = { name: string; duration: number; sampleRate: number };
export type DeviceLink =
  | { status: 'idle' | 'no-sysex' | 'reading' | 'no-reply' }
  | { status: 'error'; message: string }
  // Projects are null when the device has no command for listing them.
  | { status: 'ready'; name: string; version: string; projects: DeviceProject[] | null };
/** Recording a pattern into the Cycles over MIDI. */
export type SendState =
  | { phase: 'idle' | 'setup' | 'recording' | 'check' | 'stopped' }
  | { phase: 'count-in'; seconds: number };

/** Session state that is never saved. */
type Live = {
  midi: MidiStatus;
  midiInput: boolean;
  midiOutputs: string[];
  heard: { clock: number; transport: number; notes: number };
  fmMidi: boolean;
  fmAudio: AudioStatus;
  fmLastNote: string | null;
  audio: AudioStatus;
  /** The audio graph exists, device or not, so anything can sound and be measured. */
  audioReady: boolean;
  kit: 'loading' | 'ready' | 'error';
  devices: Devices;
  playing: boolean;
  clockSource: 'app' | 'device';
  step: number;
  bar: number;
  beat: number;
  followBpm: number | null;
  incoming: { step: number; lane: number; at: number; note: number; vel: number }[];
  chop: Soundfile | null;
  chopPeaksVersion: number;
  reference: Soundfile | null;
  recording: boolean;
  soloTrack: number;
  /** The pattern the Cycles last announced by Program Change; null until it does. */
  devicePattern: number | null;
  /** What the Cycles answered over SysEx when it connected. */
  deviceLink: DeviceLink;
  send: SendState;
  /** The track the spacebar auditions while the pointer is over a Sounds node. */
  auditionTrack: number | null;
  /** The control last moved on the Cycles itself. A new object each time, so moving the same one again still counts. */
  touched: { track: number; cc: number } | null;
  selectedStep: { lane: number; step: number } | null;
  selectedSlice: number;
  deviceParams: Record<number, Record<number, number>>;
  ab: 'mix' | 'reference';
  compareStraight: boolean;
  laneFlash: number[];
  set: (patch: Partial<Live>) => void;
};

/** What is stopping the grid from following the Cycles, judged from what it has actually sent. */
export function mirrorProblem(heard: Live['heard']): { short: string; fix: string } | null {
  if (!heard.transport) return null;
  if (!heard.clock) return { short: 'No clock from the Cycles', fix: 'The Cycles sent Start but no clock, so the playhead cannot follow it. Turn on clock output in its MIDI sync settings.' };
  if (!heard.notes) return { short: 'No notes from the Cycles', fix: 'Clock is arriving but no notes. Turn on MOut for each track (FUNC + TRACK) and play a pattern with trigs.' };
  return null;
}

export const useLive = create<Live>((set) => ({
  midi: 'idle',
  midiInput: false,
  midiOutputs: [],
  heard: { clock: 0, transport: 0, notes: 0 },
  fmMidi: false,
  fmAudio: 'idle',
  fmLastNote: null,
  audio: 'idle',
  audioReady: false,
  kit: 'loading',
  devices: { inputs: [], outputs: [] },
  playing: false,
  clockSource: 'app',
  step: 0,
  bar: 1,
  beat: 1,
  followBpm: null,
  incoming: [],
  chop: null,
  chopPeaksVersion: 0,
  reference: null,
  recording: false,
  soloTrack: 0,
  devicePattern: null,
  deviceLink: { status: 'idle' },
  send: { phase: 'idle' },
  auditionTrack: null,
  touched: null,
  selectedStep: null,
  selectedSlice: 0,
  deviceParams: {},
  ab: 'mix',
  compareStraight: false,
  laneFlash: Array.from({ length: LANES }, () => 0),
  set: (patch) => set(patch),
}));

// Leader lines listen here to pulse when a hit travels through them.
type PulseListener = (source: string) => void;
const listeners = new Set<PulseListener>();
export const onPulse = (fn: PulseListener) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
export const pulse = (source: string) => listeners.forEach((fn) => fn(source));
