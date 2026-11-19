/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0F0F0E', 2: '#2A2A27', 3: '#5C5B55', 4: '#8E8D86' },
        paper: { DEFAULT: '#F3F2ED', 2: '#E9E7E0', 3: '#DDDAD1' },
        fire: { DEFAULT: '#E5380E', dark: '#B82A06', soft: '#FCE6DE' },
        ok: { DEFAULT: '#127A4B', soft: '#DDF1E6' },
        warn: { DEFAULT: '#B87500', soft: '#FBEFD6' },
        cat1: '#2F7D4F', cat2: '#C89B00', cat3: '#E06A12', cat4: '#C21D0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { label: '0.14em' },
    },
  },
  plugins: [],
};
