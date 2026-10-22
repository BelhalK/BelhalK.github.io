import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Built into the main site's dist/ and served at /my-bento/
export default defineConfig({
  plugins: [react()],
  base: '/my-bento/',
  build: {
    outDir: '../../dist/my-bento',
    emptyOutDir: true,
  },
})
