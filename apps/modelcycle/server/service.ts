import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { handleGenerate, reply } from './generate.ts';

// Answers /modelcycle/api/generate for belhal.com, behind Caddy. It listens on
// localhost only. The page is public, so the limits below are what cap the key's cost.
const PORT = Number(process.env.PORT ?? 8791);
const ROUTE = '/modelcycle/api/generate';
const ORIGINS = new Set(['https://belhal.com', 'https://www.belhal.com']);
const DAILY_LIMIT = 50;
const MIN_GAP_MS = 5000;

const stateDir = process.env.STATE_DIRECTORY ?? '/tmp/modelcycle-generate';
const stateFile = join(stateDir, 'usage.json');
mkdirSync(stateDir, { recursive: true });

const today = () => new Date().toISOString().slice(0, 10);

// Saved to disk so that a restart cannot reset the day's count.
const readUsage = (): { day: string; count: number } => {
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    return { day: today(), count: 0 };
  }
};

let usage = readUsage();
let lastStart = 0;

const admit = () => {
  const now = Date.now();
  if (usage.day !== today()) usage = { day: today(), count: 0 };
  if (usage.count >= DAILY_LIMIT) return 'The daily generation limit is used up. Try again tomorrow.';
  if (now - lastStart < MIN_GAP_MS) return 'Generating too quickly. Wait a few seconds and try again.';
  lastStart = now;
  usage = { ...usage, count: usage.count + 1 };
  writeFileSync(`${stateFile}.tmp`, JSON.stringify(usage));
  renameSync(`${stateFile}.tmp`, stateFile);
  return null;
};

createServer((req, res) => {
  if (req.url !== ROUTE) return reply(res, 404, { error: 'Not found' });
  if (req.method !== 'POST') return reply(res, 405, { error: 'Use POST' });
  if (!ORIGINS.has(req.headers.origin ?? '') || !req.headers['content-type']?.startsWith('application/json')) return reply(res, 403, { error: 'Not allowed' });
  void handleGenerate(req, res, process.env.GEMINI_API_KEY, admit);
}).listen(PORT, '127.0.0.1');
