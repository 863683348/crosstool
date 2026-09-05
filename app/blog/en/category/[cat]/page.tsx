import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, CATEGORY_SLUGS, CATEGORY_EN } from '@/content/blog';

type Props = { params: Promise<{ cat: string }> };

const SLUG_TO_CAT: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([s, c]) => [c, s])
);

export function generateStaticParams() {
  const cats = [...new Set(blogPosts.map((p) => p.category))];
  const slugs = cats.map((c) => SLUG_TO_CAT[c]).filter(Boolean);
  return slugs.map((s) => ({ cat: s }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cat } = await params;
  const category = CATEGORY_SLUGS[cat];
  const posts = category ? blogPosts.filter((p) => p.category === category) : [];
  if (posts.length === 0) return {};
  const name = CATEGORY_EN[cat] || category;
  return {
    title: `${name} Tools - CrossTool Blog`,
    description: `Hands-on ${name.toLowerCase()} articles for cross-border sellers: tutorials, comparisons and checklists, all with local zero-upload tools.`,
    alternates: { canonical: `/blog/en/category/${cat}` },
  };
}

export default async function BlogEnCategoryPage({ params }: Props) {
  const { cat } = await params;
  const category = CATEGORY_SLUGS[cat];
  if (!category) notFound();
  const posts = blogPosts
    .filter((p) => p.category === category)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (posts.length === 0) notFound();

  const name = CATEGORY_EN[cat] || category;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <nav className="text-xs text-muted">
        <Link href="/blog/en" className="hover:text-primary">
          ← Back to blog
        </Link>
        <span className="mx-2">·</span>
        <Link href={`/blog/category/${cat}`} className="hover:text-primary">
          中文版 →
        </Link>
      </nav>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{name} Tools</h1>
      <p className="mt-2 text-sm text-muted">
        {name} articles for cross-border sellers, all with browser-based local tools (zero
        upload). {posts.length} posts.
      </p>
      <ul className="mt-8 space-y-4">
        {posts.map((p) => (
          <li key={p.slug} className="rounded-card border border-border bg-panel p-5 shadow-card">
            <Link href={`/blog/en/${p.slug}`} className="group block">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-panel px-2 py-0.5 font-semibold text-primary">{name}</span>
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
