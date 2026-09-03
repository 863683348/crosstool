import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, CATEGORY_SLUGS } from '@/content/blog';

type Props = { params: Promise<{ cat: string }> };

const SLUG_TO_CAT: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([s, c]) => [c, s])
);

export function generateStaticParams() {
  const cats = [...new Set(blogPosts.map((p) => p.category))];
  const slugs = cats.map((c) => SLUG_TO_CAT[c]).filter(Boolean);
  // 若有未映射分类，fallback 用编码中文（仍可访问，主路径走英文 slug）
  return slugs.map((s) => ({ cat: s }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cat } = await params;
  const category = CATEGORY_SLUGS[cat];
  const posts = category ? blogPosts.filter((p) => p.category === category) : [];
  if (posts.length === 0) return {};
  return {
    title: `${category}工具实战 - CrossTool 博客`,
    description: `跨境卖家${category}工具实战合集：教程、实测与方案对比，全部本地零上传。`,
    alternates: { canonical: `/blog/category/${cat}` },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { cat } = await params;
  const category = CATEGORY_SLUGS[cat];
  if (!category) notFound();
  const posts = blogPosts
    .filter((p) => p.category === category)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <nav className="text-xs text-muted">
        <Link href="/blog" className="hover:text-primary">
          ← 返回博客
        </Link>
      </nav>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{category}实战</h1>
      <p className="mt-2 text-sm text-muted">
        {category}方向的跨境卖家工具教程与实测，全部配合浏览器内本地工具（零上传）完成。共 {posts.length} 篇。
      </p>
      <ul className="mt-8 space-y-4">
        {posts.map((p) => (
          <li key={p.slug} className="rounded-card border border-border bg-panel p-5 shadow-card">
            <Link href={`/blog/${p.slug}`} className="group block">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-panel px-2 py-0.5 font-semibold text-primary">{p.category}</span>
                <time dateTime={p.date}>{p.date}</time>
              </div>
              <h2 className="mt-2 text-lg font-bold transition group-hover:text-primary sm:text-xl">{p.title}</h2>
              <p className="mt-1 text-sm text-muted">{p.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
