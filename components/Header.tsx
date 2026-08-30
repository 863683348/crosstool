'use client';

import Link from 'next/link';
import { Sun, Moon, Globe } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function Header() {
  const { t, lang, setLang } = useT();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-panel/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-primary-text"
            style={{ background: 'linear-gradient(135deg, var(--primary), #06b6d4)' }}
          >
            C
          </span>
          <span className="text-lg">{t('brand')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-ok/40 bg-ok/10 px-3 py-1 text-xs font-semibold text-ok sm:inline">
            {t('privacyBadge')}
          </span>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-panel text-text transition hover:border-primary"
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            title={t('navTools')}
          >
            <Globe size={16} />
            <span className="sr-only">lang</span>
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-panel text-text transition hover:border-primary"
            onClick={toggle}
            title="theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
