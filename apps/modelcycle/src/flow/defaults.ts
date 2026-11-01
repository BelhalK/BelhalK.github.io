import type { Edge, Node } from '@xyflow/react';

export type PartType =
  | 'cycles' | 'sequencer' | 'groove' | 'sounds' | 'banks'
  | 'spectrogram' | 'spectrum' | 'recorder' | 'chopper' | 'reference' | 'monitor' | 'fm1';

export const PARTS: { type: PartType; name: string; group: Workspace }[] = [
  { type: 'cycles', name: 'Model:Cycles', group: 'sources' },
  { type: 'sequencer', name: 'Sequencer', group: 'produce' },
  { type: 'groove', name: 'Groove', group: 'produce' },
  { type: 'sounds', name: 'Sounds', group: 'produce' },
  { type: 'banks', name: 'Banks', group: 'produce' },
  { type: 'recorder', name: 'Recorder', group: 'sources' },
  { type: 'chopper', name: 'Chopper', group: 'sources' },
  { type: 'spectrogram', name: 'Spectrogram', group: 'mix' },
  { type: 'spectrum', name: 'Spectrum', group: 'mix' },
  { type: 'reference', name: 'Reference', group: 'mix' },
  { type: 'monitor', name: 'Monitor', group: 'mix' },
  { type: 'fm1', name: 'M-VAVE FM-1', group: 'sources' },
];

export type Workspace = 'produce' | 'sources' | 'mix';

const node = (type: PartType, x: number, y: number): Node => ({ id: type, type, position: { x, y }, data: {} });

// Where every part goes and how it is wired when first added.
// Left to right, as the signal flows: Sequencer, then sound sources, then analysers and output.
export const ALL_NODES: Node[] = [
  node('sounds', 0, 0),
  node('sequencer', 440, 0),
  node('groove', 440, 470),
  node('banks', 440, 770),
  node('cycles', 1400, 0),
  node('recorder', 1840, 480),
  node('fm1', 1400, 340),
  node('chopper', 1400, 830),
  node('monitor', 2360, 0),
  node('reference', 2360, 230),
  node('spectrogram', 3000, 0),
  node('spectrum', 3000, 360),
];

const midiEdge = (source: string, target: string): Edge => ({
  id: `${source}-${target}-midi`, source, target, sourceHandle: 'midi-out', targetHandle: 'midi-in', type: 'leader', data: { kind: 'midi' },
});
const audioEdge = (source: string, target: string, targetHandle = 'audio-in'): Edge => ({
  id: `${source}-${target}-audio`, source, target, sourceHandle: 'audio-out', targetHandle, type: 'leader', data: { kind: 'audio' },
});

const SOURCES = ['cycles', 'fm1', 'chopper'];
const SINKS = ['monitor', 'reference', 'spectrogram', 'spectrum'];

export const ALL_EDGES: Edge[] = [
  midiEdge('sequencer', 'cycles'),
  midiEdge('sounds', 'sequencer'),
  midiEdge('groove', 'sequencer'),
  midiEdge('banks', 'sequencer'),
  midiEdge('sequencer', 'fm1'),
  midiEdge('sequencer', 'chopper'),
  ...SOURCES.flatMap((source) => SINKS.map((sink) => audioEdge(source, sink))),
  audioEdge('reference', 'monitor'),
  audioEdge('recorder', 'spectrogram'),
  { id: 'recorder-chopper-audio', source: 'recorder', target: 'chopper', sourceHandle: 'chop-out', targetHandle: 'chop-in', type: 'leader', data: { kind: 'audio' } },
];

// What the app opens with, and what Reset layout returns to.
const STARTER = new Set<string>(['sounds', 'sequencer', 'groove', 'cycles', 'monitor'] satisfies PartType[]);
export const DEFAULT_NODES = ALL_NODES.filter((n) => STARTER.has(n.id));
export const DEFAULT_EDGES = ALL_EDGES.filter((e) => STARTER.has(e.source) && STARTER.has(e.target));

/** 'spectrum-2' is a second Spectrum. */
export const baseType = (id: string) => id.replace(/-\d+$/, '') as PartType;

export const KIND_OF_HANDLE = (handle?: string | null) => (handle?.startsWith('midi') ? 'midi' : 'audio');
