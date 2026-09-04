import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-80': 'var(--panel-80)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
        'primary-text': 'var(--primary-text)',
        ok: 'var(--ok)',
        'ok-soft': 'var(--ok-soft)',
        'ok-border': 'var(--ok-border)',
        'ok-border-30': 'var(--ok-border-30)',
        warn: 'var(--warn)',
        'warn-soft': 'var(--warn-soft)',
        'warn-border': 'var(--warn-border)',
        'primary-border': 'var(--primary-border)',
      },
      borderRadius: {
        card: 'var(--radius)',
      },
      boxShadow: {
        card: 'var(--shadow)',
      },
    },
  },
  plugins: [],
};

export default config;
