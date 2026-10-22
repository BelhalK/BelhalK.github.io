import { fileURLToPath } from 'node:url'

export default {
  plugins: {
    // explicit path: Tailwind otherwise looks up its config from cwd, which is the
    // root site when this app is served through the root dev server
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
}
