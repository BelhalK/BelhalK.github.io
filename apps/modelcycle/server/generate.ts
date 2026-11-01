import type { IncomingMessage, ServerResponse } from 'node:http';

// Runs on the server only, for the dev server plugin and the belhal.com service.
// The API key never leaves this side.
const MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
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

async function askGemini(key: string, prompt: string, length: number): Promise<unknown> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
      contents: [{ role: 'user', parts: [{ text: `Style: ${prompt}\nPattern length: ${length} steps, so steps run from 0 to ${length - 1}.` }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
  });
  if (!response.ok) throw new Error(`Gemini answered ${response.status}`);
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') throw new Error('Gemini returned no pattern');
  return JSON.parse(text);
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
export async function handleGenerate(req: IncomingMessage, res: ServerResponse, key: string | undefined, admit?: () => string | null) {
  try {
    if (!key) return reply(res, 500, { error: 'GEMINI_API_KEY is missing from .env' });
    const { prompt, length } = await readBody(req);
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT) return reply(res, 400, { error: `Enter a prompt of up to ${MAX_PROMPT} characters` });
    if (length !== 16 && length !== 32 && length !== 64) return reply(res, 400, { error: 'Length must be 16, 32 or 64' });
    const refused = admit?.();
    if (refused) return reply(res, 429, { error: refused });
    reply(res, 200, await askGemini(key, prompt.trim(), length));
  } catch (err) {
    reply(res, 502, { error: err instanceof Error ? err.message : 'Generation failed' });
  }
}
