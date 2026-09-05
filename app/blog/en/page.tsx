import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts, CATEGORY_SLUGS, CATEGORY_EN } from '@/content/blog';

export const metadata: Metadata = {
  title: 'Cross-Border Seller Tools Blog - CrossTool',
  description:
    'Hands-on articles for cross-border sellers: product video compression, image processing, PDF tools, VAT and duty, listing optimization, account security - all paired with local zero-upload tools.',
  alternates: { canonical: '/blog/en' },
};

// 中文分类 → 英文 slug
const CAT_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([s, c]) => [c, s])
);

export default function BlogEnListPage() {
  const posts = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
  const categories = [...new Set(posts.map((p) => p.category))];
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <nav className="text-xs text-muted">
        <Link href="/blog" className="hover:text-primary">
          中文版 · Chinese Version →
        </Link>
      </nav>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Cross-Border Seller Tools Blog</h1>
      <p className="mt-2 text-sm text-muted">
        One article per pain point, all paired with browser-based local tools (zero upload).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => {
          const slug = CAT_TO_SLUG[c] || encodeURIComponent(c);
          return (
            <Link
              key={c}
              href={`/blog/en/category/${slug}`}
              className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
            >
              {CATEGORY_EN[CAT_TO_SLUG[c]] || c}
            </Link>
          );
        })}
      </div>
      <ul className="mt-8 space-y-4">
        {posts.map((p) => (
          <li key={p.slug} className="rounded-card border border-border bg-panel p-5 shadow-card">
            <Link href={`/blog/en/${p.slug}`} className="group block">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-panel px-2 py-0.5 font-semibold text-primary">
                  {CATEGORY_EN[CAT_TO_SLUG[p.category]] || p.category}
                </span>
                <time dateTime={p.date}>{p.date}</time>
              </div>
              <h2 className="mt-2 text-lg font-bold transition group-hover:text-primary sm:text-xl">
                {p.titleEn || p.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{p.excerptEn || p.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
