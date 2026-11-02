import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Edge, Node } from '@xyflow/react';
import { CC, DEVICE_TRACKS, LANES, type Machine, MACHINES, MATCH_LANE, MATCH_ROWS, PATTERN_COUNT, type SoundParam } from '@/lib/cycles';
import { type Groove, groovePattern } from '@/lib/grooves';
import { emptyLane, emptyPattern, newStep, type Pattern, shiftLane, type Step } from '@/lib/pattern';
import { DEFAULT_KIT } from '@/lib/kits';
import type { Sound } from '@/lib/sounds';
import { midi } from '@/engine/midi';
import { useLive } from '@/store/live';
import { baseType, DEFAULT_EDGES, ALL_EDGES, ALL_NODES, DEFAULT_NODES, type PartType } from '@/flow/defaults';

export type MatchRow = { id: string; name: string };

type Project = {
  bpm: number;
  swing: number;
  sendProgramChange: boolean;
  masterGain: number;
  monitorGain: number;
  chopLevel: number;
  fmLevel: number;
  matchLevel: number;
  matchRows: (MatchRow | null)[];
  kitId: string;
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
  saveSound: (track: number, name: string, machine: Machine, params: Sound['params']) => Sound;
  deleteSound: (id: string) => void;
  /** Gives a found sound its own Sequencer row. Returns the row's lane, or null when all are taken. */
  addMatchRow: (row: MatchRow) => number | null;
  removeMatchRow: (lane: number) => void;
  setLayout: (nodes: Node[], edges: Edge[]) => void;
  resetLayout: () => void;
  addPart: (type: PartType, position: { x: number; y: number }) => string;
  removePart: (id: string) => void;
};

const rememberParam = (track: number, cc: number, value: number) => {
  const { deviceParams, set } = useLive.getState();
  set({ deviceParams: { ...deviceParams, [track]: { ...deviceParams[track], [cc]: value } } });
};

/** Parts below the Sequencer move with it, since a new row makes it taller. */
const ROW_HEIGHT = 32;
const SEQUENCER_WIDTH = 932;
const makeRoom = (nodes: Node[], by: number) => {
  const sequencer = nodes.find((n) => n.id === 'sequencer');
  if (!sequencer) return nodes;
  return nodes.map((n) => (
    n.position.y > sequencer.position.y && n.position.x >= sequencer.position.x && n.position.x < sequencer.position.x + SEQUENCER_WIDTH
      ? { ...n, position: { ...n.position, y: n.position.y + by } }
      : n
  ));
};

/** A Sample to Preset part added before it could play needs its cables. */
const withPresetEdges = (nodes: Node[], edges: Edge[]) => {
  const ids = new Set(nodes.map((n) => n.id));
  const known = new Set(edges.map((e) => e.id));
  const missing = ALL_EDGES.filter((e) => (e.source === 'preset' || e.target === 'preset') && ids.has(e.source) && ids.has(e.target) && !known.has(e.id));
  return missing.length ? [...edges, ...missing] : edges;
};

// Shared so selectors get a stable reference for an unwritten slot.
const EMPTY_PATTERN = emptyPattern();

const emptyPatterns = () => Array.from({ length: PATTERN_COUNT }, () => null as Pattern | null);

/** Layout and lane changes from before version 8. */
function migrateLayout(state: Project, version: number): Project {
  if (version >= 7) return state;
  // Version 7 puts the LLM on the canvas, wired to the Sequencer, and keeps the rest of the layout.
  if (version === 6) {
    if (state.nodes.some((n) => baseType(n.id) === 'llm')) return state as Project;
    const wired = state.nodes.some((n) => n.id === 'sequencer');
    return {
      ...state,
      nodes: [...state.nodes, ALL_NODES.find((n) => n.id === 'llm')!],
      edges: wired ? [...state.edges, ALL_EDGES.find((e) => e.source === 'llm')!] : state.edges,
    } as Project;
  }
  // Version 2 added the FM-1: one more lane on every pattern.
  const patterns = version >= 2 ? state.patterns : state.patterns.map((p) =>
    p && { ...p, lanes: [...p.lanes, emptyLane()], muted: [...p.muted, false] },
  );
  // Version 6 starts everyone on the smaller default canvas.
  return { ...state, patterns, nodes: DEFAULT_NODES, edges: DEFAULT_EDGES } as Project;
}

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
        matchLevel: 0.8,
        matchRows: Array.from({ length: MATCH_ROWS }, () => null),
        kitId: DEFAULT_KIT,
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
          return sound;
        },
        deleteSound: (id) => set((s) => ({ mySounds: s.mySounds.filter((x) => x.id !== id) })),
        addMatchRow: (row) => {
          const { matchRows, nodes, edges, addPart } = get();
          const free = matchRows.indexOf(null);
          if (free < 0) return null;
          const first = !nodes.some((n) => baseType(n.id) === 'preset');
          if (first) addPart('preset', { x: 0, y: 0 });
          const current = first ? get() : { nodes, edges };
          set({
            matchRows: matchRows.map((r, i) => (i === free ? row : r)),
            nodes: makeRoom(current.nodes, ROW_HEIGHT),
            edges: withPresetEdges(current.nodes, current.edges),
          });
          return MATCH_LANE + free;
        },
        removeMatchRow: (lane) => set((s) => ({
          matchRows: s.matchRows.map((r, i) => (MATCH_LANE + i === lane ? null : r)),
          // The next sound to take this row must not inherit these steps, on any pattern.
          patterns: s.patterns.map((p) => p && {
            ...p,
            lanes: p.lanes.map((l, i) => (i === lane ? emptyLane() : l)),
            muted: p.muted.map((m, i) => (i === lane ? false : m)),
          }),
          nodes: makeRoom(s.nodes, -ROW_HEIGHT),
        })),
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
        },      };
    },
    {
      name: 'modelcycle-studio',
      version: 8,
      migrate: (saved, version) => {
        const state = migrateLayout(saved as Project, version);
        // Version 8 adds the Match rows to every pattern.
        return {
          ...state,
          patterns: state.patterns.map((p) => p && {
            ...p,
            lanes: [...p.lanes, ...Array.from({ length: Math.max(0, LANES - p.lanes.length) }, emptyLane)],
            muted: [...p.muted, ...Array.from({ length: Math.max(0, LANES - p.muted.length) }, () => false)],
          }),
          edges: withPresetEdges(state.nodes, state.edges),
        } as never;
      },
      partialize: ({ bpm, swing, sendProgramChange, masterGain, monitorGain, chopLevel, fmLevel, matchLevel, matchRows, kitId, patterns, current, grooveId, mySounds, trackSound, slices, chopSteps, fmChannel, fmPreset, fmMidiPort, fmAudioInput, nodes, edges }) => ({
        bpm, swing, sendProgramChange, masterGain, monitorGain, chopLevel, fmLevel, matchLevel, matchRows, kitId, patterns, current, grooveId, mySounds, trackSound, slices, chopSteps, fmChannel, fmPreset, fmMidiPort, fmAudioInput,
        nodes: nodes.map(({ id, type, position }) => ({ id, type, position, data: {} })),
        edges,
      }),
    },
  ),
);

export const isWired = (edges: Edge[], source: string, target: string) =>
  edges.some((e) => baseType(e.source) === source && baseType(e.target) === target);
