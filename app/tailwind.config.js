/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14233A', 2: '#2B3A52', 3: '#5A6478', 4: '#8B92A0' },
        paper: { DEFAULT: '#F9F8F3', 2: '#EFEDE4', 3: '#E1DDD0' },
        // «fire» é a cor de destaque da marca (dourado do logótipo); «ink» é o azul; «alerta» é o vermelho das desconformidades
        fire: { DEFAULT: '#DA9A1E', dark: '#B97F10', soft: '#FBF1DC', ink: '#94650A' },
        alerta: { DEFAULT: '#C2362B', soft: '#FBE6E3' },
        ok: { DEFAULT: '#127A4B', soft: '#DDF1E6' },
        warn: { DEFAULT: '#B87500', soft: '#FBEFD6' },
        cat1: '#2F7D4F', cat2: '#C89B00', cat3: '#E06A12', cat4: '#C21D0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        brand: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { label: '0.14em' },
    },
  },
  plugins: [],
};
