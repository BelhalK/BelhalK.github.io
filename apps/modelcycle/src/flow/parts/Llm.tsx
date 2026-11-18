import { useState } from 'react';
import { useNodeId } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { DEVICE_TRACKS } from '@/lib/cycles';
import { emptyPattern, type Pattern } from '@/lib/pattern';
import { readGenerated } from '@/lib/generated';
import { useLive } from '@/store/live';
import { useProject } from '@/store/project';
import { Button, Segmented } from '@/components/ui';
import { baseType } from '../defaults';
import { Part } from '../Part';

type Length = '16' | '32' | '64';

/** Writes T1 to T6 of the current pattern from a prompt, keeping what was there for Undo. */
export function useGenerator() {
  const setTop = useProject((s) => s.setTop);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ patterns: (Pattern | null)[]; bpm: number; swing: number; grooveId: string | null } | null>(null);

  const generate = async (prompt: string, steps: number) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, length: steps }),
      });
      // A static host such as GitHub Pages has no generator and refuses the POST without JSON.
      // Any other page without JSON is a proxy error, usually from a model that took too long.
      const data = await response.json().catch(() => ({
        error: response.status === 404 || response.status === 405 ? 'Generating is not available on this site.' : 'The generator did not answer in time. Try again.',
      }));
      if (!response.ok) throw new Error(data.error);
      const result = readGenerated(data, steps);
      if (!result) throw new Error('The model returned an empty pattern. Try again.');
      const s = useProject.getState();
      const before = s.patterns[s.current] ?? emptyPattern();
      const patterns = [...s.patterns];
      // Chops and FM-1 belong to their own parts, so they keep what they have.
      patterns[s.current] = { ...before, length: steps, lanes: before.lanes.map((l, i) => (i < DEVICE_TRACKS ? result.lanes[i] : l)) };
      setUndo({ patterns: s.patterns, bpm: s.bpm, swing: s.swing, grooveId: s.grooveId });
      setTop({ patterns, bpm: result.bpm, swing: result.swing, grooveId: null, page: 0 });
      useLive.getState().set({ selectedStep: null });
      setMade(`${result.name}, ${result.bpm} BPM`);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Generation failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const restore = () => {
    if (!undo) return;
    setTop(undo);
    setUndo(null);
    setMade(null);
  };

  return { generate, busy, error, made, canUndo: !!undo, restore };
}

export function LlmPart() {
  const id = useNodeId();
  const wired = useProject((s) => s.edges.some((e) => e.source === id && baseType(e.target) === 'sequencer'));
  const [prompt, setPrompt] = useState('');
  const [length, setLength] = useState<Length>('32');
  const { generate, busy, error, made, canUndo, restore } = useGenerator();

  return (
    <Part type="llm" width={340} status={busy ? 'Generating' : wired ? 'Ready' : 'Not connected'} ports={[{ id: 'midi-out', side: 'right', label: 'Notes', top: 58 }]}>
      <textarea
        value={prompt}
        aria-label="Describe the pattern"
        placeholder="Hip hop house line"
        rows={3}
        maxLength={500}
        onChange={(e) => setPrompt(e.target.value)}
        className="nowheel nopan block w-full resize-none rounded-[2px] border border-ink bg-paper p-2 text-xs placeholder:text-muted"
      />
      <div className="mt-2 flex items-center gap-2">
        <Segmented
          ariaLabel="Pattern length"
          value={length}
          onChange={setLength}
          options={[{ value: '16', label: '16' }, { value: '32', label: '32' }, { value: '64', label: '64' }]}
        />
        <span className="text-xs text-muted">steps</span>
        <Button className="ml-auto" variant="solid" disabled={!wired || busy || !prompt.trim()} onClick={() => void generate(prompt, Number(length))}>
          <Sparkles className="size-3.5" /> {busy ? 'Generating' : 'Generate'}
        </Button>
      </div>
      {!wired && <p className="mt-2 text-xs text-muted">Connect Notes to the Sequencer to generate.</p>}
      {error && <p className="mt-2 text-xs text-live-dark">{error}</p>}
      {made && !error && (
        <div className="mt-2 flex items-center gap-2">
          <p className="min-w-0 truncate text-xs text-muted" title={made}>{made}</p>
          {canUndo && <Button size="sm" className="ml-auto" onClick={restore}>Undo</Button>}
        </div>
      )}
    </Part>
  );
}
