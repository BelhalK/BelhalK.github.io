import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Edge, Node } from '@xyflow/react';
import { CC, DEVICE_TRACKS, type Machine, MACHINES, PATTERN_COUNT, type SoundParam } from '@/lib/cycles';
import { type Groove, groovePattern } from '@/lib/grooves';
import { emptyLane, emptyPattern, newStep, type Pattern, shiftLane, type Step } from '@/lib/pattern';
import type { Sound } from '@/lib/sounds';
import { midi } from '@/engine/midi';
import { useLive } from '@/store/live';
import { baseType, DEFAULT_EDGES, ALL_EDGES, ALL_NODES, DEFAULT_NODES, type PartType } from '@/flow/defaults';

type Project = {
  bpm: number;
  swing: number;
  sendProgramChange: boolean;
  masterGain: number;
  monitorGain: number;
  chopLevel: number;
  fmLevel: number;
  patterns: (Pattern | null)[];
  current: number;
  page: number;
  grooveId: string | null;
  mySounds: Sound[];
  trackSound: (string | null)[];
  slices: number[];
  chopSteps: number;
  fmChannel: number;
  fmPreset: number | undefined;
  fmMidiPort: string | null;
  fmAudioInput: string | null;
  nodes: Node[];
  edges: Edge[];

  pattern: () => Pattern;
  setTop: (patch: Partial<Project>) => void;
  toggleStep: (lane: number, step: number, over?: Partial<Step>) => void;
  updateStep: (lane: number, step: number, patch: Partial<Step>) => void;
  shift: (lane: number | 'all', by: number) => void;
  moveStep: (lane: number, from: number, to: number) => void;
  setLength: (length: number) => void;
  toggleMute: (lane: number) => void;
  clearLane: (lane: number) => void;
  clearAll: () => void;
  captureSteps: (hits: { lane: number; step: number; note: number; vel: number }[]) => void;
  selectPattern: (index: number) => void;
  copyPatternTo: (index: number) => void;
  loadGroove: (groove: Groove) => void;
  sendParam: (track: number, key: SoundParam, value: number) => void;
  sendMachine: (track: number, machine: Machine) => void;
  applySound: (track: number, sound: Sound) => void;
  saveSound: (track: number, name: string, machine: Machine, params: Sound['params']) => void;
  deleteSound: (id: string) => void;
  setLayout: (nodes: Node[], edges: Edge[]) => void;
  resetLayout: () => void;
  addPart: (type: PartType, position: { x: number; y: number }) => string;
  removePart: (id: string) => void;
};

const rememberParam = (track: number, cc: number, value: number) => {
  const { deviceParams, set } = useLive.getState();
  set({ deviceParams: { ...deviceParams, [track]: { ...deviceParams[track], [cc]: value } } });
};

// Shared so selectors get a stable reference for an unwritten slot.
const EMPTY_PATTERN = emptyPattern();

const emptyPatterns = () => Array.from({ length: PATTERN_COUNT }, () => null as Pattern | null);

export const useProject = create<Project>()(
  persist(
    (set, get) => {
      const editPattern = (fn: (p: Pattern) => Pattern) =>
        set((s) => {
          const patterns = [...s.patterns];
          patterns[s.current] = fn(patterns[s.current] ?? emptyPattern());
          return { patterns };
        });
      const editLane = (lane: number, fn: (l: Pattern['lanes'][number]) => Pattern['lanes'][number]) =>
        editPattern((p) => ({ ...p, lanes: p.lanes.map((l, i) => (i === lane ? fn(l) : l)) }));

      return {
        bpm: 124,
        swing: 54,
        sendProgramChange: false,
        masterGain: 0.8,
        monitorGain: 1,
        chopLevel: 1,
        fmLevel: 1,
        patterns: emptyPatterns(),
        current: 0,
        page: 0,
        grooveId: null,
        mySounds: [],
        trackSound: [null, null, null, null, null, null],
        slices: [],
        chopSteps: 16,
        fmChannel: 0,
        fmPreset: undefined,
        fmMidiPort: null,
        fmAudioInput: null,
        nodes: DEFAULT_NODES,
        edges: DEFAULT_EDGES,

        pattern: () => get().patterns[get().current] ?? EMPTY_PATTERN,
        setTop: (patch) => set(patch),

        toggleStep: (lane, step, over) =>
          editLane(lane, (l) => {
            const next = [...l];
            next[step] = next[step] ? null : newStep(over);
            return next;
          }),
        updateStep: (lane, step, patch) =>
          editLane(lane, (l) => {
            const next = [...l];
            if (next[step]) next[step] = { ...next[step]!, ...patch };
            return next;
          }),
        shift: (lane, by) =>
          editPattern((p) => ({
            ...p,
            lanes: p.lanes.map((l, i) => (lane === 'all' || lane === i ? shiftLane(l, by, p.length) : l)),
          })),
        moveStep: (lane, from, to) =>
          editLane(lane, (l) => {
            const next = [...l];
            [next[from], next[to]] = [next[to], next[from]];
            return next;
          }),
        setLength: (length) => {
          editPattern((p) => ({ ...p, length }));
          set({ page: 0 });
        },
        toggleMute: (lane) => {
          editPattern((p) => ({ ...p, muted: p.muted.map((m, i) => (i === lane ? !m : m)) }));
          if (lane < 6) midi.cc(lane, CC.mute, get().pattern().muted[lane] ? 127 : 0);
        },
        clearLane: (lane) => editLane(lane, (l) => l.map(() => null)),
        clearAll: () => editPattern((p) => ({ ...p, lanes: p.lanes.map((l) => l.map(() => null)) })),
        // Replaces the six device tracks with what was heard; Chops and FM-1 are the app's own.
        captureSteps: (hits) =>
          editPattern((p) => ({
            ...p,
            lanes: p.lanes.map((l, lane) => {
              if (lane >= DEVICE_TRACKS) return l;
              const next = l.map(() => null as Step | null);
              for (const h of hits) if (h.lane === lane && h.step < next.length) next[h.step] = newStep({ note: h.note, vel: h.vel });
              return next;
            }),
          })),
        selectPattern: (index) => {
          set({ current: index, page: 0 });
          if (get().sendProgramChange) midi.programChange(0, index);
        },
        copyPatternTo: (index) =>
          set((s) => {
            const patterns = [...s.patterns];
            patterns[index] = structuredClone(s.patterns[s.current] ?? emptyPattern());
            return { patterns };
          }),
        loadGroove: (groove) => {
          editPattern(() => groovePattern(groove));
          set({ grooveId: groove.id, swing: groove.swing, bpm: groove.bpm, page: 0 });
        },
        sendParam: (track, key, value) => {
          midi.cc(track, CC[key], value);
          rememberParam(track, CC[key], value);
        },
        sendMachine: (track, machine) => {
          midi.cc(track, CC.machine, MACHINES.indexOf(machine));
          rememberParam(track, CC.machine, MACHINES.indexOf(machine));
        },
        applySound: (track, sound) => {
          get().sendMachine(track, sound.machine);
          for (const [key, value] of Object.entries(sound.params)) {
            get().sendParam(track, key as SoundParam, value!);
          }
          set((s) => ({ trackSound: s.trackSound.map((v, i) => (i === track ? sound.id : v)) }));
        },
        saveSound: (track, name, machine, params) => {
          const sound: Sound = { id: crypto.randomUUID(), name, machine, params, mine: true };
          set((s) => ({
            mySounds: [...s.mySounds, sound],
            trackSound: s.trackSound.map((v, i) => (i === track ? sound.id : v)),
          }));
        },
        deleteSound: (id) => set((s) => ({ mySounds: s.mySounds.filter((x) => x.id !== id) })),
        setLayout: (nodes, edges) => set({ nodes, edges }),
        resetLayout: () => set({ nodes: DEFAULT_NODES, edges: DEFAULT_EDGES }),
        addPart: (type, position) => {
          const { nodes, edges } = get();
          const first = !nodes.some((n) => baseType(n.id) === type);
          if (first) {
            const nextNodes = [...nodes, ALL_NODES.find((n) => n.id === type)!];
            const ids = new Set(nextNodes.map((n) => n.id));
            const restored = ALL_EDGES.filter((e) => (e.source === type || e.target === type) && ids.has(e.source) && ids.has(e.target));
            set({ nodes: nextNodes, edges: [...edges, ...restored] });
            return type;
          }
          let n = 2;
          while (nodes.some((x) => x.id === `${type}-${n}`)) n++;
          const id = `${type}-${n}`;
          // Each new copy steps down and right so several added in a row stay visible.
          const step = (nodes.length % 8) * 32;
          set({ nodes: [...nodes, { id, type, position: { x: position.x + step, y: position.y + step }, data: {} }] });
          return id;
        },
        removePart: (id) => {
          const { nodes, edges } = get();
          set({ nodes: nodes.filter((n) => n.id !== id), edges: edges.filter((e) => e.source !== id && e.target !== id) });
        },
      };
    },
    {
      name: 'modelcycle-studio',
      version: 6,
      migrate: (saved, version) => {
        const state = saved as Project;
        if (version >= 6) return state as never;
        // Version 2 added the FM-1: one more lane on every pattern.
        const patterns = version >= 2 ? state.patterns : state.patterns.map((p) =>
          p && { ...p, lanes: [...p.lanes, emptyLane()], muted: [...p.muted, false] },
        );
        // Version 6 starts everyone on the smaller default canvas.
        return { ...state, patterns, nodes: DEFAULT_NODES, edges: DEFAULT_EDGES } as never;
      },
      partialize: ({ bpm, swing, sendProgramChange, masterGain, monitorGain, chopLevel, fmLevel, patterns, current, grooveId, mySounds, trackSound, slices, chopSteps, fmChannel, fmPreset, fmMidiPort, fmAudioInput, nodes, edges }) => ({
        bpm, swing, sendProgramChange, masterGain, monitorGain, chopLevel, fmLevel, patterns, current, grooveId, mySounds, trackSound, slices, chopSteps, fmChannel, fmPreset, fmMidiPort, fmAudioInput,
        nodes: nodes.map(({ id, type, position }) => ({ id, type, position, data: {} })),
        edges,
      }),
    },
  ),
);

export const isWired = (edges: Edge[], source: string, target: string) =>
  edges.some((e) => baseType(e.source) === source && baseType(e.target) === target);
