import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { audio } from './audio';
import { midi } from './midi';

const INTERFACE = /komplete\s*audio/i;
// Inputs on the interface, counted from 0: the mic on input 1, the FM-1's line out on input 2.
const MIC_CHANNEL = 0;
const FM_CHANNEL = 1;

/**
 * One tap for the studio: connects the Cycles and the FM-1, then routes everything through
 * the audio interface. Plays out of it, takes the FM-1 from input 2 alone, and records the mic
 * from input 1 alone. Without the interface it still connects the rest. Needs a user gesture.
 */
export async function setupStudio() {
  // Started together so a refused permission on one never blocks the other.
  await Promise.allSettled([midi.connect(), audio.start()]);
  const all = await audio.refreshDevices().catch(() => [] as MediaDeviceInfo[]);
  const named = (kind: MediaDeviceKind) =>
    all.find((d) => d.kind === kind && INTERFACE.test(d.label) && d.deviceId !== 'default' && d.deviceId !== 'communications');
  const input = named('audioinput');
  const output = named('audiooutput');

  const { setTop } = useProject.getState();
  if (output) setTop({ outputLabel: output.label });
  if (input) setTop({ micInput: input.label, micChannel: MIC_CHANNEL, fmAudioInput: input.label, fmAudioChannel: FM_CHANNEL });
  if (output) await audio.applyOutput();
  else useLive.getState().set({ iface: 'missing' });
  await audio.connectFm();
}

/** The Recorder's input from studio setup: a device id, or '' for the system default, and its channel. */
export function micChoice() {
  const { micInput, micChannel } = useProject.getState();
  const device = micInput ? useLive.getState().devices.inputs.find((d) => d.label === micInput) : undefined;
  return device ? { deviceId: device.deviceId, channel: micChannel } : { deviceId: '', channel: null };
}
