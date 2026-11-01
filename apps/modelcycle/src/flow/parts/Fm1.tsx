import { useEffect, useRef, useState } from 'react';
import { Circle, Download, Square } from 'lucide-react';
import { encodeWav, peaks, toMono } from '@/lib/analysis';
import { audio } from '@/engine/audio';
import { midi } from '@/engine/midi';
import { transport } from '@/engine/transport';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { Button, Heading, Row, Select, Slider } from '@/components/ui';
import { connectAll } from './Cycles';
import { Part } from '../Part';

const AUTO = '__auto';

export function Fm1Part() {
  const fmMidi = useLive((s) => s.fmMidi);
  const fmAudio = useLive((s) => s.fmAudio);
  const fmLastNote = useLive((s) => s.fmLastNote);
  const midiOutputs = useLive((s) => s.midiOutputs);
  const inputs = useLive((s) => s.devices.inputs);
  const midiStatus = useLive((s) => s.midi);
  const recording = useLive((s) => s.recording);
  const channel = useProject((s) => s.fmChannel);
  const preset = useProject((s) => s.fmPreset);
  const portName = useProject((s) => s.fmMidiPort);
  const inputLabel = useProject((s) => s.fmAudioInput);
  const setTop = useProject((s) => s.setTop);
  const [take, setTake] = useState<AudioBuffer | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wave = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = wave.current;
    if (!take || !c) return;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#0e1116';
    peaks(toMono(take), c.width).forEach(([lo, hi], x) => {
      g.fillRect(x, ((1 - hi) / 2) * c.height, 1, Math.max(1, ((hi - lo) / 2) * c.height));
    });
  }, [take]);

  const capture = async () => {
    if (capturing) {
      audio.stopRecording();
      setCapturing(false);
      return;
    }
    setError(null);
    setCapturing(true);
    try {
      setTake(await audio.startFmCapture());
    } catch {
      setCapturing(false);
      setError('The take could not be captured. Check the FM-1 audio input above.');
    }
  };

  const connected = midiStatus !== 'idle';
  const status = fmMidi || fmAudio === 'connected' ? 'Connected' : 'Playing from this device';

  return (
    <Part
      type="fm1"
      width={380}
      status={status}
      ports={[
        { id: 'midi-in', side: 'left', label: 'MIDI', top: 58 },
        { id: 'audio-out', side: 'right', label: 'Audio', top: 58 },
      ]}
    >
      <Row label="MIDI">{fmMidi ? 'Connected' : 'Not found'}</Row>
      <Row label="USB audio">{fmAudio === 'connected' ? 'Connected' : fmAudio === 'blocked' ? 'Blocked by macOS' : 'Not found'}</Row>
      <Row label="Last note played">{fmLastNote ?? '--'}</Row>

      {!connected && <Button className="mt-2.5" variant="solid" onClick={connectAll}>Connect devices</Button>}
      {connected && !fmMidi && fmAudio !== 'connected' && (
        <p className="mt-2 text-xs text-muted">Plug the FM-1 in over USB-C and it connects by itself. If it does not, choose its ports below.</p>
      )}

      <Heading>Ports</Heading>
      <div className="grid grid-cols-[84px_1fr] items-center gap-x-2 gap-y-1.5 text-xs">
        <span>MIDI port</span>
        <Select
          ariaLabel="FM-1 MIDI port"
          className="min-w-0"
          value={portName ?? AUTO}
          onChange={(v) => {
            setTop({ fmMidiPort: v === AUTO ? null : v });
            midi.rebind();
          }}
          options={[{ value: AUTO, label: 'Find automatically' }, ...midiOutputs.map((n) => ({ value: n, label: n }))]}
        />
        <span>Audio input</span>
        <Select
          ariaLabel="FM-1 audio input"
          className="min-w-0"
          value={inputLabel ?? AUTO}
          onChange={(v) => {
            setTop({ fmAudioInput: v === AUTO ? null : v });
            void audio.connectFm();
          }}
          options={[{ value: AUTO, label: 'Find automatically' }, ...inputs.map((d) => ({ value: d.label, label: d.label || 'Input' }))]}
        />
      </div>

      <Heading>Play</Heading>
      <div className="space-y-0.5">
        <Slider label="MIDI channel" value={channel} min={0} max={15} format={(v) => String(v + 1)} onChange={(v) => setTop({ fmChannel: v })} />
        <Slider
          label="Preset"
          value={preset}
          min={0}
          max={127}
          format={(v) => String(v + 1)}
          onChange={(v) => {
            setTop({ fmPreset: v });
            midi.fmProgram(channel, v);
          }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">Preset is sent as Program Change, which is not yet confirmed on this synth. Shape the sound on the FM-1 itself.</p>
      <p className="mt-1 text-xs text-muted">Write its part on the FM-1 lane in the Sequencer. Until an FM-1 is connected, a simple FM voice plays it from this device.</p>

      <Heading>Capture a sound</Heading>
      <div className="flex items-center gap-2">
        <Button variant={capturing ? 'live' : 'outline'} disabled={fmAudio !== 'connected' || (recording && !capturing)} onClick={capture}>
          {capturing ? <Square className="size-3.5" fill="currentColor" /> : <Circle className="size-3.5 text-live" fill="currentColor" />}
          {capturing ? 'Stop' : 'Record the FM-1'}
        </Button>
        <Button size="sm" className="ml-auto" onClick={() => transport.triggerFm()}>Test note</Button>
      </div>
      {error && <p className="mt-2 text-xs text-live-dark">{error}</p>}
      {take && (
        <>
          <canvas ref={wave} width={712} height={120} className="mt-2.5 block h-[60px] w-full border border-line" />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => audio.previewBuffer(take)}>Play</Button>
            <Button size="sm" variant="solid" onClick={() => audio.loadChopBuffer(take, `FM-1 take ${take.duration.toFixed(1)} s`)}>Send to Chopper</Button>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(encodeWav(take));
                a.download = 'fm1-take.wav';
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
              }}
            >
              <Download className="size-3" /> WAV
            </Button>
          </div>
        </>
      )}
    </Part>
  );
}
