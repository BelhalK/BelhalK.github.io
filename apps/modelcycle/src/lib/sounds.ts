import type { Machine, SoundParam } from './cycles';

export type Sound = {
  id: string;
  name: string;
  machine: Machine;
  params: Partial<Record<SoundParam, number>>;
  mine?: boolean;
};

// Starting points written for this app, not Elektron factory presets. They
// overwrite only the parameters they list.
export const STARTER_SOUNDS: Sound[] = [
  { id: 'kick-deep', name: 'Deep round kick', machine: 'Kick', params: { pitch: 40, decay: 62, color: 18, shape: 30, sweep: 34, contour: 40 } },
  { id: 'kick-punch', name: 'Punchy club kick', machine: 'Kick', params: { pitch: 46, decay: 44, color: 34, shape: 52, sweep: 58, contour: 70 } },
  { id: 'clap-room', name: 'Roomy snare clap', machine: 'Snare', params: { pitch: 62, decay: 46, color: 70, shape: 66, sweep: 20, contour: 34, reverb: 42 } },
  { id: 'hat-tight', name: 'Tight closed hat', machine: 'Metal', params: { pitch: 84, decay: 16, color: 86, shape: 40, sweep: 10, contour: 18 } },
  { id: 'hat-open', name: 'Open offbeat hat', machine: 'Metal', params: { pitch: 80, decay: 56, color: 78, shape: 48, sweep: 8, contour: 24 } },
  { id: 'perc-wood', name: 'Wood block', machine: 'Perc', params: { pitch: 76, decay: 22, color: 38, shape: 58, sweep: 26, contour: 44 } },
  { id: 'bass-round', name: 'Round sub bass', machine: 'Tone', params: { pitch: 34, decay: 64, color: 14, shape: 20, sweep: 12, contour: 30 } },
  { id: 'bass-pluck', name: 'FM pluck bass', machine: 'Tone', params: { pitch: 40, decay: 38, color: 62, shape: 44, sweep: 48, contour: 60 } },
  { id: 'chord-deep', name: 'Dub chord stab', machine: 'Chord', params: { pitch: 64, decay: 40, color: 46, shape: 36, sweep: 22, contour: 32, delay: 56, reverb: 38 } },
  { id: 'chord-organ', name: 'Organ stab', machine: 'Chord', params: { pitch: 64, decay: 30, color: 74, shape: 64, sweep: 6, contour: 20, reverb: 24 } },
];
