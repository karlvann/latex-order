/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        surface: {
          DEFAULT: '#18181b',
          darker: '#0a0a0a',
          border: '#27272a'
        },
        amber: {
          DEFAULT: '#d97706',
          light: '#fbbf24'
        },
        status: {
          critical: '#ef4444',
          warning: '#f97316',
          caution: '#eab308',
          healthy: '#22c55e'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
}
