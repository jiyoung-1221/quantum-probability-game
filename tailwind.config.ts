import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18202f',
        chalk: '#f8fafc',
        cobalt: '#2563eb',
        mint: '#10b981',
        coral: '#f97316',
        violet: '#7c3aed',
      },
      boxShadow: {
        panel: '0 18px 60px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
