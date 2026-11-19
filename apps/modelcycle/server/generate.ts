import type { IncomingMessage, ServerResponse } from 'node:http';

// Runs on the server only, for the dev server plugin and the belhal.com service.
// The API key never leaves this side.
// Tried in order. The lite models answer in a few seconds; full Flash was often overloaded
// (503) or ran past a minute. Each try gets ATTEMPT_MS so both fit inside Cloudflare's 100 s.
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const ATTEMPT_MS = 25_000;
const geminiUrl = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const MAX_BODY = 4096;
const MAX_PROMPT = 500;

const INSTRUCTIONS = `You write drum machine patterns for a six-track groovebox with a sixteenth-note step sequencer.
Steps are numbered from 0. Four steps make a beat and sixteen make a bar.
The tracks are kick, snare (or clap), hat, perc, bass and chord.
Give only the steps that play. Leave a track empty when the style does not need it.
velocity is 1 to 127; vary it to make the groove feel played.
note is a MIDI note. Use it on bass (28 to 48) and chord (48 to 72, the chord root), in one key. Drums ignore it.
bpm is a fitting tempo. swing is 50 for straight, up to 75 for a heavy shuffle.
name is a short title for the pattern.`;

const hits = (withNote: boolean) => ({
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      step: { type: 'INTEGER' },
      velocity: { type: 'INTEGER' },
      ...(withNote ? { note: { type: 'INTEGER' } } : {}),
    },
    required: withNote ? ['step', 'velocity', 'note'] : ['step', 'velocity'],
  },
});

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    bpm: { type: 'INTEGER' },
    swing: { type: 'INTEGER' },
    kick: hits(false),
    snare: hits(false),
    hat: hits(false),
    perc: hits(false),
    bass: hits(true),
    chord: hits(true),
  },
  required: ['name', 'bpm', 'swing', 'kick', 'snare', 'hat', 'perc', 'bass', 'chord'],
};

/** One Gemini attempt, for usage tracking: model, tokens (0 when it failed before answering), outcome. Never the prompt. */
export type Call = { model: string; input: number; cached: number; output: number; ok: boolean; error?: string };
export type Recorder = (call: Call) => void;

type Usage = { promptTokenCount?: number; cachedContentTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };

async function askModel(model: string, key: string, prompt: string, length: number, record?: Recorder): Promise<unknown> {
  const call: Call = { model, input: 0, cached: 0, output: 0, ok: false };
  try {
    const pattern = await requestModel(model, key, prompt, length, call);
    call.ok = true;
    return pattern;
  } catch (err) {
    call.error = err instanceof Error ? err.message : 'failed';
    throw err;
  } finally {
    record?.(call);
  }
}

async function requestModel(model: string, key: string, prompt: string, length: number, call: Call): Promise<unknown> {
  const response = await fetch(geminiUrl(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    signal: AbortSignal.timeout(ATTEMPT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
      contents: [{ role: 'user', parts: [{ text: `Style: ${prompt}\nPattern length: ${length} steps, so steps run from 0 to ${length - 1}.` }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
  });
  if (!response.ok) throw new Error(`Gemini answered ${response.status}`);
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: unknown }[] } }[]; usageMetadata?: Usage };
  const u = data.usageMetadata ?? {};
  call.input = u.promptTokenCount ?? 0;
  call.cached = u.cachedContentTokenCount ?? 0;
  call.output = (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') throw new Error('Gemini returned no pattern');
  return JSON.parse(text);
}

async function askGemini(key: string, prompt: string, length: number, record?: Recorder): Promise<unknown> {
  let last: unknown;
  for (const model of MODELS) {
    try {
      return await askModel(model, key, prompt, length, record);
    } catch (err) {
      last = err;
    }
  }
  const timedOut = last instanceof DOMException && last.name === 'TimeoutError';
  throw new Error(timedOut ? 'The model took too long. Try again.' : `The model is unavailable right now (${last instanceof Error ? last.message : 'no answer'}). Try again in a minute.`);
}

export const reply = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
};

const readBody = async (req: IncomingMessage) => {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > MAX_BODY) throw new Error('Request too large');
  }
  return JSON.parse(body) as { prompt?: unknown; length?: unknown };
};

/** Answers one generate request. admit may refuse it, with a reason, once it is known to be valid. */
export async function handleGenerate(req: IncomingMessage, res: ServerResponse, key: string | undefined, admit?: () => string | null, record?: Recorder) {
  try {
    if (!key) return reply(res, 500, { error: 'GEMINI_API_KEY is missing from .env' });
    const { prompt, length } = await readBody(req);
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT) return reply(res, 400, { error: `Enter a prompt of up to ${MAX_PROMPT} characters` });
    if (length !== 16 && length !== 32 && length !== 64) return reply(res, 400, { error: 'Length must be 16, 32 or 64' });
    const refused = admit?.();
    if (refused) return reply(res, 429, { error: refused });
    reply(res, 200, await askGemini(key, prompt.trim(), length, record));
  } catch (err) {
    // Not 502 or 504: Cloudflare swaps those for its own page, and the reason would be lost.
    reply(res, 500, { error: err instanceof Error ? err.message : 'Generation failed' });
  }
}
