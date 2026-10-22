/** @type {import('tailwindcss').Config} */
export default {
  // relative: resolve globs from this file, not cwd (the root site's dev server runs from the parent dir)
  content: {
    relative: true,
    files: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
