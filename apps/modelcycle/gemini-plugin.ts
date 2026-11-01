import type { IncomingMessage } from 'node:http';
import { fileURLToPath, URL } from 'node:url';
import { loadEnv, type Plugin } from 'vite';
import { handleGenerate, reply } from './server/generate.ts';

// The same route server/service.ts gives belhal.com, for npm run dev. GEMINI_ has
// no VITE_ prefix, so the key can never reach a bundle in dist/.
const ROUTE = '/modelcycle/api/generate';
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** Other websites open in the same browser must not be able to spend the key through localhost. */
const fromThisApp = (req: IncomingMessage) => {
  const { host, origin } = req.headers;
  if (!host || !LOCAL_HOST.test(host)) return false;
  if (!req.headers['content-type']?.startsWith('application/json')) return false;
  return !origin || new URL(origin).host === host;
};

export function geminiPlugin(): Plugin {
  return {
    name: 'modelcycle-gemini',
    apply: 'serve',
    configureServer(server) {
      const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
      server.middlewares.use((req, res, next) => {
        if (req.url !== ROUTE) return next();
        if (req.method !== 'POST') return reply(res, 405, { error: 'Use POST' });
        if (!fromThisApp(req)) return reply(res, 403, { error: 'Not allowed' });
        void handleGenerate(req, res, loadEnv('development', repoRoot, 'GEMINI_').GEMINI_API_KEY);
      });
    },
  };
}
