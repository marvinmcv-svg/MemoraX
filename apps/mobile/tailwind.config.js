import type { Config } from 'tailwindcss';

export default {
  content: ['./**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#12121A',
        'surface-hover': '#1A1A24',
        border: '#2A2A3A',
        primary: {
          DEFAULT: '#6366F1',
          glow: '#818CF8',
        },
        secondary: '#10B981',
        accent: '#F59E0B',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
      },
    },
  },
  plugins: [],
} satisfies Config;
