import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { geminiPlugin } from './gemini-plugin.ts';

// Built into the main site's dist/ and served at /modelcycle/
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiPlugin()],
  base: '/modelcycle/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Tailwind runs through its Vite plugin. The empty list stops PostCSS config
  // discovery from walking up to the main site's Tailwind 3 postcss.config.js.
  css: { postcss: { plugins: [] } },
  build: {
    outDir: '../../dist/modelcycle',
    emptyOutDir: true,
  },
  test: { include: ['src/**/*.test.ts'] },
});
