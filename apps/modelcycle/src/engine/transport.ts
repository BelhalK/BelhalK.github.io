import { CHOPS_LANE, DEVICE_TRACKS, FM_LANE, PATTERN_COUNT } from '@/lib/cycles';
import { countInLoops, trackSetup } from '@/lib/send';
import { STARTER_SOUNDS } from '@/lib/sounds';
import { kitVoice } from '@/lib/kits';
import { type Pattern, stepDuration, stepOffset } from '@/lib/pattern';
import { pulse, useLive } from '@/store/live';
import { isWired, useProject } from '@/store/project';
import { baseType, type PartType } from '@/flow/defaults';
import { audio } from './audio';
import { midi } from './midi';

const LOOKAHEAD_MS = 120;
const TICK_MS = 25;
const PPQN = 24;
// The Cycles answers a Start from the app with its own Stop and Start within a few ms.
const ECHO_MS = 250;

// Runs in a worker so timing survives a backgrounded tab.
const timer = new Worker(
  URL.createObjectURL(new Blob([`setInterval(() => postMessage(0), ${TICK_MS})`], { type: 'text/javascript' })),
);

class Transport {
  private nextStepTime = 0;
  private nextClockTime = 0;
  private stepIndex = 0;
  private followTicks = -1;
  private clockTimes: number[] = [];
  private visuals: number[] = [];
  private headTime = 0;
  private appStartedAt = -Infinity;
  private headIndex = 0;
  /** The one pass being recorded into the Cycles, fixed when it starts so edits cannot reach it. */
  private sendRun: { pattern: Pattern; bpm: number; countIn: number; startsAt: number; endsAt: number } | null = null;

  constructor() {
    timer.onmessage = () => this.tick();
    midi.handlers = {
      onClock: (t) => this.onExternalClock(t),
      onStart: () => this.onExternalStart(),
      onContinue: () => this.onExternalContinue(),
      onStop: () => this.onExternalStop(),
      onNote: (channel, note, velocity) => this.onExternalNote(channel, note, velocity),
      onProgram: (program) => {
        if (program < PATTERN_COUNT) useLive.getState().set({ devicePattern: program });
      },
      onCC: (channel, cc, value) => {
        const { deviceParams, set } = useLive.getState();
        set({ deviceParams: { ...deviceParams, [channel]: { ...deviceParams[channel], [cc]: value } } });
      },
    };
  }

  /** Play pressed in the app. */
  toggle() {
    const { playing } = useLive.getState();
    if (playing) this.stop();
    else this.play();
  }

  play() {
    audio.boot();
    const { lanes } = useProject.getState().pattern();
    if (lanes[CHOPS_LANE].some(Boolean)) ensurePart('chopper');
    if (lanes[FM_LANE].some(Boolean)) ensurePart('fm1');
    this.begin();
  }

  private begin() {
    this.appStartedAt = performance.now();
    midi.start();
    const now = performance.now() + 60;
    this.stepIndex = 0;
    this.nextStepTime = now;
    this.nextClockTime = now;
    this.visuals = [];
    this.headTime = now;
    this.headIndex = 0;
    useLive.getState().set({ playing: true, clockSource: 'app', step: 0, bar: 1, beat: 1 });
    return now;
  }

  /** Opens the send panel, and moves the Cycles to the pattern being sent so it can be checked first. */
  openSend() {
    const { playing, midi: status, set } = useLive.getState();
    if (playing || status !== 'connected') return;
    midi.programChange(0, useProject.getState().current);
    set({ send: { phase: 'setup' } });
  }

  /** Plays a silent count-in, then the pattern once, then stops. */
  startSend() {
    const project = useProject.getState();
    const live = useLive.getState();
    if (live.playing || live.midi !== 'connected') return;
    const pattern = structuredClone(project.pattern());
    const sounds = [...STARTER_SOUNDS, ...project.mySounds];
    // Sent before the Cycles is armed, so these set its sound and are not recorded as locks.
    for (let track = 0; track < DEVICE_TRACKS; track++) {
      if (!pattern.lanes[track].some(Boolean)) continue;
      const sound = sounds.find((s) => s.id === project.trackSound[track]);
      for (const [cc, value] of trackSetup(sound, live.deviceParams[track])) midi.cc(track, cc, value);
    }
    live.set({ incoming: [] });
    const stepMs = stepDuration(project.bpm) * 1000;
    const countIn = countInLoops(project.bpm, pattern.length) * pattern.length;
    this.sendRun = { pattern, bpm: project.bpm, countIn, startsAt: 0, endsAt: 0 };
    const now = this.begin();
    this.sendRun.startsAt = now + countIn * stepMs;
    this.sendRun.endsAt = this.sendRun.startsAt + pattern.length * stepMs;
    live.set({ send: { phase: 'count-in', seconds: Math.ceil((countIn * stepMs) / 1000) } });
  }

  /** Closes the panel and lets the app play along with the Cycles again. */
  endSend() {
    useLive.getState().set({ send: { phase: 'idle' }, incoming: [] });
  }

  private tickSend(now: number) {
    const run = this.sendRun!;
    const live = useLive.getState();
    if (live.midi !== 'connected') {
      this.stop();
      return;
    }
    if (now >= run.endsAt) {
      this.sendRun = null;
      this.stop();
      live.set({ send: { phase: 'check' }, incoming: [] });
    } else if (now >= run.startsAt) {
      if (live.send.phase !== 'recording') live.set({ send: { phase: 'recording' } });
    } else {
      const seconds = Math.ceil((run.startsAt - now) / 1000);
      if (live.send.phase !== 'count-in' || live.send.seconds !== seconds) live.set({ send: { phase: 'count-in', seconds } });
    }
  }

  /** Sends only T1 to T6, every step that is not muted, and only during the pass. */
  private scheduleSendStep(index: number, gridTime: number, stepMs: number) {
    const run = this.sendRun!;
    const project = useProject.getState();
    this.visuals.push(gridTime, index);
    const pos = index - run.countIn;
    if (pos < 0 || pos >= run.pattern.length) return;
    const swing = isWired(project.edges, 'groove', 'sequencer') ? project.swing : 50;
    for (let lane = 0; lane < DEVICE_TRACKS; lane++) {
      const step = run.pattern.lanes[lane][pos];
      if (!step || run.pattern.muted[lane]) continue;
      const at = Math.max(performance.now(), gridTime + stepOffset(pos, stepMs / 1000, swing, step.micro) * 1000);
      midi.note(lane, step.note, step.vel, at, stepMs * 0.9);
      this.pulseAt(at, 'cycles', lane);
    }
  }

  stop() {
    midi.stop();
    this.halt();
  }

  private halt() {
    if (this.sendRun) {
      this.sendRun = null;
      useLive.getState().set({ send: { phase: 'stopped' } });
    }
    midi.panic();
    audio.stopChops();
    useLive.getState().set({ playing: false, clockSource: 'app', step: 0, bar: 1, beat: 1 });
  }

  private tick() {
    const live = useLive.getState();
    if (!live.playing) return;
    const now = performance.now();
    this.flushVisuals(now);
    const project = useProject.getState();
    if (live.clockSource !== 'app') return;
    if (this.sendRun) {
      this.tickSend(now);
      if (!useLive.getState().playing) return;
    }

    const horizon = now + LOOKAHEAD_MS;
    const bpm = this.sendRun?.bpm ?? project.bpm;
    const stepMs = stepDuration(bpm) * 1000;
    // A step can land up to one step early through micro timing, so it is
    // scheduled one step ahead of its grid position.
    while (this.nextStepTime - stepMs < horizon) {
      this.scheduleStep(this.stepIndex, this.nextStepTime, stepMs);
      this.nextStepTime += stepMs;
      this.stepIndex++;
    }
    const clockMs = (60000 / bpm) / PPQN;
    while (this.nextClockTime < horizon) {
      midi.clock(this.nextClockTime);
      this.nextClockTime += clockMs;
    }
  }

  private scheduleStep(index: number, gridTime: number, stepMs: number) {
    if (this.sendRun) return this.scheduleSendStep(index, gridTime, stepMs);
    // While checking a recording, the Cycles must be heard alone.
    if (useLive.getState().send.phase === 'check') {
      this.visuals.push(gridTime, index);
      return;
    }
    const project = useProject.getState();
    const live = useLive.getState();
    const pattern = project.pattern();
    const pos = index % pattern.length;
    const swing = live.compareStraight || !isWired(project.edges, 'groove', 'sequencer') ? 50 : project.swing;
    const toDevice = isWired(project.edges, 'sequencer', 'cycles');
    const toChops = isWired(project.edges, 'sequencer', 'chopper');
    const toFm = isWired(project.edges, 'sequencer', 'fm1');
    this.visuals.push(gridTime, index);

    pattern.lanes.forEach((lane, laneIndex) => {
      const step = lane[pos];
      if (!step || pattern.muted[laneIndex]) return;
      if (step.chance < 100 && Math.random() * 100 >= step.chance) return;
      const at = Math.max(performance.now(), gridTime + stepOffset(pos, stepMs / 1000, swing, step.micro) * 1000);
      if (laneIndex < DEVICE_TRACKS && toDevice) {
        if (live.midi === 'connected') midi.note(laneIndex, step.note, step.vel, at, stepMs * 0.9);
        else audio.playKit(laneIndex, step.note, step.vel, at);
        this.pulseAt(at, 'cycles', laneIndex);
      } else if (laneIndex === CHOPS_LANE && toChops) {
        audio.playSlice(step.slice ?? 0, at, step.vel / 127);
        this.pulseAt(at, 'chopper', laneIndex);
      } else if (laneIndex === FM_LANE && toFm) {
        if (live.fmMidi) midi.fmNote(project.fmChannel, step.note, step.vel, at, stepMs * 0.9);
        else audio.playFm(step.note, step.vel, at, 0.4);
        this.pulseAt(at, 'fm1', laneIndex);
      }
    });
  }

  private pulseAt(time: number, target: string, lane: number) {
    setTimeout(() => {
      pulse(`sequencer>${target}`);
      flashLane(lane);
    }, Math.max(0, time - performance.now()));
  }

  private flushVisuals(now: number) {
    while (this.visuals.length && this.visuals[0] <= now) {
      this.headTime = this.visuals.shift()!;
      this.headIndex = this.visuals.shift()!;
      this.publishPosition(this.headIndex);
    }
  }

  /**
   * The playhead between steps, for drawing every frame. It reads the scheduled
   * step times, not the moment a timer tick got round to publishing the step.
   */
  playheadPosition(now = performance.now()) {
    let time = this.headTime;
    let index = this.headIndex;
    for (let i = 0; i < this.visuals.length && this.visuals[i] <= now; i += 2) {
      time = this.visuals[i];
      index = this.visuals[i + 1];
    }
    const project = useProject.getState();
    const stepMs = stepDuration(useLive.getState().followBpm ?? project.bpm) * 1000;
    return (index % project.pattern().length) + Math.min(1, Math.max(0, (now - time) / stepMs));
  }

  private publishPosition(index: number) {
    const { length } = useProject.getState().pattern();
    const live = useLive.getState();
    // A trig the Cycles has stopped playing fades from the grid after two loops.
    if (index % length === 0) {
      const horizon = performance.now() - (stepDuration(live.followBpm ?? useProject.getState().bpm) * 1000 * length * 2 + 200);
      const kept = live.incoming.filter((h) => h.at > horizon);
      if (kept.length !== live.incoming.length) live.set({ incoming: kept });
    }
    live.set({
      step: index % length,
      bar: Math.floor(index / 16) + 1,
      beat: Math.floor((index % 16) / 4) + 1,
    });
  }

  // Pressing play on the Cycles runs the whole app from its clock.

  private isEcho() {
    return performance.now() - this.appStartedAt < ECHO_MS;
  }

  private onExternalStart() {
    if (this.isEcho()) return;
    if (useLive.getState().clockSource === 'app' && useLive.getState().playing) return;
    audio.resume();
    this.headTime = performance.now();
    this.headIndex = 0;
    this.followTicks = -1;
    this.visuals = [];
    useLive.getState().set({ playing: true, clockSource: 'device', step: 0, bar: 1, beat: 1, incoming: [] });
  }
  private onExternalContinue() {
    if (useLive.getState().playing) return;
    useLive.getState().set({ playing: true, clockSource: 'device' });
  }
  private onExternalStop() {
    if (this.isEcho()) return;
    if (useLive.getState().clockSource === 'device' || useLive.getState().playing) this.halt();
  }

  private onExternalClock(time: number) {
    this.clockTimes.push(time);
    if (this.clockTimes.length > PPQN * 2) this.clockTimes.shift();
    if (this.clockTimes.length > PPQN) {
      const span = this.clockTimes[this.clockTimes.length - 1] - this.clockTimes[0];
      const bpm = (60000 * (this.clockTimes.length - 1)) / span / PPQN;
      const current = useLive.getState().followBpm;
      if (current === null || Math.abs(current - bpm) >= 0.1) useLive.getState().set({ followBpm: Math.round(bpm * 10) / 10 });
    }
    const live = useLive.getState();
    if (live.clockSource !== 'device' || !live.playing) return;
    this.followTicks++;
    if (this.followTicks % 6 !== 0) return;
    const stepMs = stepDuration(live.followBpm ?? useProject.getState().bpm) * 1000;
    this.scheduleStep(this.followTicks / 6, performance.now(), stepMs);
  }

  /** A note from the Cycles' own sequencer: remembered on its step so the grid mirrors it. */
  private onExternalNote(channel: number, note: number, velocity: number) {
    if (channel >= DEVICE_TRACKS || velocity === 0) return;
    const live = useLive.getState();
    pulse('cycles>sequencer');
    flashLane(channel);
    if (!live.playing || this.sendRun) return;
    const step = live.clockSource === 'device' ? Math.round(this.followTicks / 6) % useProject.getState().pattern().length : live.step;
    const others = live.incoming.filter((h) => !(h.lane === channel && h.step === step));
    live.set({ incoming: [...others, { step, lane: channel, at: performance.now(), note, vel: velocity }] });
  }

  /** Lets the kit be heard after a Sounds control moves. The Cycles and a running pattern already sound by themselves. */
  previewKit(track: number) {
    const { midi: status, playing } = useLive.getState();
    if (status !== 'connected' && !playing) this.trigger(track);
  }

  triggerFm(note = 60, velocity = 110) {
    if (useLive.getState().fmMidi) midi.fmNote(useProject.getState().fmChannel, note, velocity, performance.now(), 400);
    else {
      audio.boot();
      ensurePart('fm1');
      audio.playFm(note, velocity, performance.now(), 0.4);
    }
    pulse('sequencer>fm1');
    flashLane(FM_LANE);
  }

  /** Audition one track on the device, regardless of the sequencer. */
  trigger(track: number, note = 60, velocity = 110) {
    if (useLive.getState().midi === 'connected') {
      midi.note(track, note, velocity, performance.now(), 160);
    } else {
      audio.boot();
      // The bass voice sounds at note 36 when auditioned, not at its default middle C.
      const bass = kitVoice(track, useLive.getState().deviceParams[track]) === 4;
      audio.playKit(track, bass ? 36 : note, velocity, performance.now());
    }
    pulse('sequencer>cycles');
    flashLane(track);
  }
}

/** A lane with notes needs its part on the canvas, or its cables to the speakers do not exist. */
function ensurePart(type: PartType) {
  const { nodes, addPart } = useProject.getState();
  if (!nodes.some((n) => baseType(n.id) === type)) addPart(type, { x: 0, y: 0 });
}

function flashLane(lane: number) {
  const { laneFlash, set } = useLive.getState();
  set({ laneFlash: laneFlash.map((v, i) => (i === lane ? v + 1 : v)) });
}

export const transport = new Transport();
