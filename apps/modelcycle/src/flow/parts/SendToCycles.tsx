import { midi } from '@/engine/midi';
import { transport } from '@/engine/transport';
import { patternName } from '@/lib/cycles';
import { compareHeard, sendSummary } from '@/lib/send';
import { mirrorProblem, useLive } from '@/store/live';
import { isWired, useProject } from '@/store/project';
import { Button } from '@/components/ui';

const FIRST_FEW = 6;
const firstFew = (items: string[]) => items.slice(0, FIRST_FEW).join(', ') + (items.length > FIRST_FEW ? `, and ${items.length - FIRST_FEW} more` : '');

function Setup() {
  const pattern = useProject((s) => s.pattern());
  const name = useProject((s) => patternName(s.current));
  const bpm = useProject((s) => s.bpm);
  const swing = useProject((s) => (isWired(s.edges, 'groove', 'sequencer') ? s.swing : 50));
  const devicePattern = useLive((s) => s.devicePattern);
  const playing = useLive((s) => s.playing);
  const summary = sendSummary(pattern);
  const left = [
    summary.chops > 0 && `${summary.chops} Chops steps`,
    summary.fm > 0 && `${summary.fm} FM-1 steps`,
    summary.muted > 0 && `${summary.muted} steps on muted tracks`,
  ].filter(Boolean);

  return (
    <>
      <p className="text-xs font-semibold">Record {name} into the Cycles: {summary.steps} steps on T1 to T6</p>
      <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs">
        <li>On the Cycles, open a project you can change and select {name}. It should be empty, because recording adds to any trigs already there.</li>
        <li>Set its pattern length to {pattern.length} steps and its tempo to {bpm} BPM{swing !== 50 ? ', with swing at 50%, because the app plays its swing as timing' : ''}. The app cannot set these.</li>
        <li>Turn on clock and transport receive in its MIDI sync settings.</li>
        <li>Press Start here. During the count-in, turn on live record on the Cycles, then leave its knobs alone.</li>
      </ol>
      {devicePattern !== null && devicePattern !== useProject.getState().current && (
        <p className="mt-1.5 text-xs text-live-dark">The Cycles last reported {patternName(devicePattern)}. Check it has moved to {name}.</p>
      )}
      {left.length > 0 && <p className="mt-1.5 text-xs text-muted">Not sent: {left.join(', ')}. The Cycles cannot play the Chops or FM-1 lanes.</p>}
      {summary.chance > 0 && <p className="mt-1.5 text-xs text-muted">{summary.chance} steps with a chance setting are sent as always playing.</p>}
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="solid" disabled={playing} onClick={() => transport.startSend()}>Start</Button>
        <Button size="sm" onClick={() => transport.endSend()}>Cancel</Button>
      </div>
    </>
  );
}

function Check() {
  const pattern = useProject((s) => s.pattern());
  const incoming = useLive((s) => s.incoming);
  const heard = useLive((s) => s.heard);
  const playing = useLive((s) => s.playing);
  const link = useLive((s) => s.deviceLink);
  const problem = mirrorProblem(heard);
  const result = compareHeard(pattern, incoming);
  const clean = result.matched === result.expected && result.extra.length === 0;

  return (
    <>
      <p className="text-xs font-semibold">The pass is finished. Turn off live record on the Cycles.</p>
      <p className="mt-1.5 text-xs">Press Play on the Cycles and let it loop once. The app stays silent, so you only hear what the Cycles recorded.</p>
      {incoming.length > 0 && (
        <div className="mt-1.5 text-xs">
          <p className={clean ? 'font-semibold' : 'font-semibold text-live-dark'}>Heard {result.matched} of {result.expected} steps back from the Cycles.</p>
          {result.missing.length > 0 && <p className="mt-1">Not heard yet: {firstFew(result.missing)}.</p>}
          {result.extra.length > 0 && <p className="mt-1">Not in the app: {firstFew(result.extra)}.</p>}
        </div>
      )}
      {playing && problem && <p className="mt-1.5 text-xs text-live-dark">{problem.fix}</p>}
      <p className="mt-1.5 text-xs">When it sounds right, save the project from the Cycles' own menu. The app cannot save it for you, and the recording is lost if the project reloads first.</p>
      {link.status === 'ready' && <p className="mt-1.5 text-xs text-muted">Last read: {link.projects.length} {link.projects.length === 1 ? 'project' : 'projects'} on the Cycles.</p>}
      <div className="mt-2 flex gap-2">
        <Button size="sm" disabled={playing} onClick={() => void midi.readDevice()}>Read projects</Button>
        <Button size="sm" onClick={() => transport.endSend()}>Done</Button>
      </div>
    </>
  );
}

export function SendToCycles() {
  const send = useLive((s) => s.send);
  const step = useLive((s) => s.step);
  const length = useProject((s) => s.pattern().length);
  if (send.phase === 'idle') return null;

  return (
    <div className="mt-3 border-t border-ink pt-2.5" role="status">
      {send.phase === 'setup' && <Setup />}
      {send.phase === 'count-in' && (
        <>
          <p className="text-xs font-semibold text-live-dark">Turn on live record on the Cycles now. Recording starts in {send.seconds} s.</p>
          <Button size="sm" className="mt-2" onClick={() => transport.stop()}>Cancel</Button>
        </>
      )}
      {send.phase === 'recording' && (
        <>
          <p className="text-xs font-semibold text-live-dark">Recording: step {step + 1} of {length}. Leave the Cycles' knobs alone.</p>
          <Button size="sm" className="mt-2" onClick={() => transport.stop()}>Stop</Button>
        </>
      )}
      {send.phase === 'check' && <Check />}
      {send.phase === 'stopped' && (
        <>
          <p className="text-xs text-live-dark">Stopped before the pass finished, so the Cycles may hold part of the pattern. If live record was on, clear the pattern on the Cycles before trying again.</p>
          <Button size="sm" className="mt-2" onClick={() => transport.endSend()}>Close</Button>
        </>
      )}
    </div>
  );
}
