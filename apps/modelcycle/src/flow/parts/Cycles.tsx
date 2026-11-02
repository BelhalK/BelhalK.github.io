import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { audio } from '@/engine/audio';
import { midi } from '@/engine/midi';
import { transport } from '@/engine/transport';
import { KITS } from '@/lib/kits';
import { type DeviceLink, mirrorProblem, useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { Button, Row, Select } from '@/components/ui';
import { Part } from '../Part';

export const connectAll = async () => {
  // Started together so a refused permission on one never blocks the other.
  await Promise.allSettled([midi.connect(), audio.start()]);
};

const MIDI_TEXT = {
  idle: 'Not connected',
  connected: 'Connected',
  missing: 'Device not found',
  denied: 'Permission denied',
  unsupported: 'Needs Chrome',
} as const;
const AUDIO_TEXT = {
  idle: 'Not connected',
  connected: 'Connected',
  missing: 'Device not found',
  denied: 'Permission denied',
  blocked: 'Blocked by macOS',
  error: 'Could not open',
} as const;

const DEVICE_LINK_TEXT = (link: DeviceLink) => {
  if (link.status === 'ready') return `${link.projects.length} found, listed in Banks`;
  return { idle: 'Not read', 'no-sysex': 'Needs permission', reading: 'Asking', 'no-reply': 'No reply', error: 'Unreadable reply' }[link.status];
};

export function CyclesPart() {
  const midiStatus = useLive((s) => s.midi);
  const midiInput = useLive((s) => s.midiInput);
  const audioStatus = useLive((s) => s.audio);
  const followBpm = useLive((s) => s.followBpm);
  const heard = useLive((s) => s.heard);
  const deviceLink = useLive((s) => s.deviceLink);
  const kit = useLive((s) => s.kit);
  const kitId = useProject((s) => s.kitId);
  const setTop = useProject((s) => s.setTop);
  const [setupOpen, setSetupOpen] = useState(true);
  const problem = mirrorProblem(heard);
  const ready = midiStatus === 'connected' && audioStatus === 'connected';

  return (
    <Part
      type="cycles"
      width={340}
      status="USB"
      ports={[
        { id: 'midi-in', side: 'left', label: 'MIDI', top: 58 },
        { id: 'audio-out', side: 'right', label: 'Audio', top: 58 },
      ]}
    >
      <Row label="MIDI">{MIDI_TEXT[midiStatus]}</Row>
      <Row label="Device to app MIDI">{midiInput ? 'Listening' : 'No input'}</Row>
      <Row label="USB audio">{AUDIO_TEXT[audioStatus]}</Row>
      <Row label="Projects on the Cycles">{DEVICE_LINK_TEXT(deviceLink)}</Row>
      <Row label="Clock from Cycles">{heard.clock ? 'Received' : 'None yet'}</Row>
      <Row label="Start and stop from Cycles">{heard.transport ? 'Received' : 'None yet'}</Row>
      <Row label="Notes from Cycles">{heard.notes ? 'Received' : 'None yet'}</Row>
      {followBpm !== null && <Row label="Tempo from Cycles">{followBpm.toFixed(1)} BPM</Row>}

      <div className="mt-3 flex gap-2">
        {ready ? (
          <Button size="sm" onClick={() => transport.trigger(0)}>Test trigger on T1</Button>
        ) : (
          <Button variant="solid" onClick={connectAll}>Connect Model:Cycles</Button>
        )}
      </div>
      {midiStatus !== 'connected' && (
        <div className="mt-3 border-t border-line pt-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="shrink-0">Laptop kit</span>
            <Select
              ariaLabel="Laptop kit"
              className="min-w-0 flex-1"
              value={kitId}
              onChange={(v) => setTop({ kitId: v })}
              options={KITS.map((k) => ({ value: k.id, label: k.name }))}
            />
          </div>
          <p className={`mt-1.5 text-xs ${kit === 'error' ? 'text-live-dark' : 'text-muted'}`}>
            {kit === 'error' ? 'The kit samples could not be downloaded. Check the connection, or choose another kit.' : kit === 'loading' ? 'Loading samples.' : 'The Sequencer plays this kit from the laptop until a Cycles is connected.'}
          </p>
        </div>
      )}
      {problem && <p className="mt-2 text-xs text-live-dark">{problem.fix}</p>}
      {audioStatus === 'blocked' && (
        <p className="mt-2 text-xs text-live-dark">macOS did not let Chrome open audio. In System Settings, go to Privacy and Security, then Microphone, turn on Google Chrome, restart Chrome and connect again.</p>
      )}
      {audioStatus === 'denied' && (
        <p className="mt-2 text-xs text-live-dark">Chrome blocked audio. Allow the microphone for this site in the address bar, then connect again.</p>
      )}

      <button type="button" onClick={() => setSetupOpen(!setupOpen)} aria-expanded={setupOpen} className="mt-3 flex cursor-pointer items-center gap-1 text-xs font-semibold">
        <ChevronRight className={`size-3.5 transition-transform duration-150 ${setupOpen ? 'rotate-90' : ''}`} />
        Settings on the device
      </button>
      {setupOpen && (
        <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs text-muted">
          <li>Open the settings menu, then MIDI.</li>
          <li>Under SYNC, turn on clock and transport, both in and out, so Play on either side runs both.</li>
          <li>Under PORTS, set MIDI in and out to USB, or to M+U for both USB and the MIDI jacks.</li>
          <li>Under CHANNELS, set tracks 1 to 6 to channels 1 to 6.</li>
          <li>On each track, press FUNC + TRACK and turn on MOut. Without this, its trigs never reach the grid.</li>
          <li>Turn on program change output so Banks can mark the pattern the Cycles is on.</li>
          <li>The Cycles sends its trigs as they play, not its stored patterns. A step appears here after it plays once.</li>
        </ol>
      )}
    </Part>
  );
}
