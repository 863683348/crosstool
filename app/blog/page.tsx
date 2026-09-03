import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts, CATEGORY_SLUGS } from '@/content/blog';

export const metadata: Metadata = {
  title: '跨境电商工具实战博客 - CrossTool',
  description:
    '跨境卖家工具实战文章：商品视频压缩、图片处理、PDF、VAT 关税计算、Listing 优化、账号安全，全部配合本地零上传工具使用。',
  alternates: { canonical: '/blog' },
};

// 中文分类 → 英文 slug（与分类页 CATEGORY_SLUGS 一致）
const CAT_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([s, c]) => [c, s])
);

export default function BlogListPage() {
  const posts = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
  const categories = [...new Set(posts.map((p) => p.category))];
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">跨境电商工具实战博客</h1>
      <p className="mt-2 text-sm text-muted">
        每篇解决一个具体痛点，全部配合浏览器内本地工具（零上传）完成。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c}
            href={`/blog/category/${CAT_TO_SLUG[c] || encodeURIComponent(c)}`}
            className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            {c}
          </Link>
        ))}
      </div>
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
