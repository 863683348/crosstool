'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useT, ZH, EN } from '@/lib/i18n';
import { TOOLS, GROUP_LABEL_KEY, HOT_SLUGS, type ToolMeta } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import { blogPosts } from '@/content/blog';
import { ShieldCheck, Search, Flame, Clock, PackageOpen, BookOpen } from 'lucide-react';

const GROUPS: ToolMeta['group'][] = ['file', 'image', 'account', 'finance', 'listing', 'media', 'data', 'compliance', 'seo', 'productivity'];
const RECENT_KEY = 'ct_recent';

// 构建每个工具的可搜索文本（slug + 中英文 title/desc）
function searchText(tool: ToolMeta): string {
  return [tool.slug, ZH[tool.titleKey], ZH[tool.descKey], EN[tool.titleKey], EN[tool.descKey]]
    .join(' ')
    .toLowerCase();
}

const SEARCH_INDEX: Record<string, string> = Object.fromEntries(TOOLS.map((t) => [t.slug, searchText(t)]));

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((s) => typeof s === 'string');
  } catch {
    return [];
  }
}

export default function HomePage() {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter((tool) => SEARCH_INDEX[tool.slug].includes(q));
  }, [query]);

  const grouped = GROUPS.map((g) => ({ g, items: filtered.filter((x) => x.group === g) })).filter(
    (x) => x.items.length > 0
  );

  const hotTools = HOT_SLUGS.map((s) => TOOLS.find((x) => x.slug === s)).filter(
    (x): x is ToolMeta => Boolean(x && !x.soon)
  );
  const recentTools = recent
    .map((s) => TOOLS.find((x) => x.slug === s))
    .filter((x): x is ToolMeta => Boolean(x && !x.soon))
    .slice(0, 8);

  const searching = query.trim().length > 0;

  return (
    <div>
      <h1 className="sr-only">{t('seoH1')}</h1>

      <section className="mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-ok/40 bg-ok/10 px-3 py-1 text-xs font-semibold text-ok">
          <ShieldCheck size={14} /> {t('privacyBadge')}
        </div>
        <h2 className="text-2xl font-bold sm:text-3xl">{t('tagline')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted sm:text-base">{t('homeSub')}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          <PackageOpen size={16} /> {t('homeTotal', { n: TOOLS.length })}
        </p>
      </section>

      {/* 搜索框 */}
      <section className="mb-8">
        <div className="relative mx-auto max-w-xl">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('homeSearchPh')}
            className="w-full rounded-card border border-border bg-panel py-2.5 pl-11 pr-4 text-sm shadow-card outline-none transition placeholder:text-muted focus:border-primary"
            aria-label={t('homeSearchPh')}
          />
        </div>
      </section>

      {/* 热门工具 */}
      {!searching && hotTools.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
            <Flame size={15} className="text-primary" /> {t('homeHot')}
            <span className="ml-1 rounded-full bg-panel px-2 py-0.5 text-xs font-bold text-primary">{hotTools.length}</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hotTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* 最近使用 */}
      {!searching && recentTools.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
            <Clock size={15} className="text-primary" /> {t('homeRecent')}
            <span className="ml-1 rounded-full bg-panel px-2 py-0.5 text-xs font-bold text-primary">{recentTools.length}</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* 搜索结果为空 */}
      {searching && filtered.length === 0 && (
        <p className="rounded-card border border-border bg-panel p-8 text-center text-sm text-muted">
          {t('homeNoResult')}
        </p>
      )}

      {/* 博客入口卡（最新 3 篇） */}
      {!searching && (
        <section className="mb-8">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
            <BookOpen size={15} className="text-primary" /> {t('homeBlog')}
            <Link href="/blog" className="ml-auto text-xs font-semibold text-primary hover:underline">
              {t('homeBlogMore')} →
            </Link>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {blogPosts
              .slice()
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 3)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group block rounded-card border border-border bg-panel p-5 shadow-card transition hover:border-primary"
                >
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="rounded-full bg-panel px-2 py-0.5 font-semibold text-primary">{p.category}</span>
                    <time dateTime={p.date}>{p.date}</time>
                  </div>
                  <h4 className="mt-2 text-sm font-bold leading-snug transition group-hover:text-primary">{p.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{p.excerpt}</p>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* 分类（标题带个数） */}
      {grouped.map(({ g, items }) => (
        <section key={g} className="mb-8">
          <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-muted">
            {t(GROUP_LABEL_KEY[g])}
            <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-xs font-bold text-primary">{items.length}</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
