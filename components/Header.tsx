'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sun, Moon, Globe } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function Header() {
  const { t, lang, setLang } = useT();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Blog 是独立双语路由（/blog 中文、/blog/en 英文）：切语言时按路径跳转对应版本
  const toggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    if (pathname === '/blog' || pathname.startsWith('/blog/')) {
      let target: string;
      if (pathname === '/blog/en') target = '/blog';
      else if (pathname === '/blog') target = '/blog/en';
      else if (pathname.startsWith('/blog/en/'))
        target = pathname.replace(/^\/blog\/en/, '/blog');
      else target = pathname.replace(/^\/blog/, '/blog/en');
      router.push(target);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-panel-80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg text-primary-text"
              style={{ background: 'linear-gradient(135deg, var(--primary), #06b6d4)' }}
            >
              C
            </span>
            <span className="text-lg">{t('brand')}</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/blog"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-text transition hover:bg-panel hover:text-primary-text"
            >
              {t('navBlog')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-ok-border bg-ok-soft px-3 py-1 text-xs font-semibold text-ok sm:inline">
            {t('privacyBadge')}
          </span>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-panel text-text transition hover:border-primary"
            onClick={toggleLang}
            title={lang === 'zh' ? 'English' : '中文'}
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
