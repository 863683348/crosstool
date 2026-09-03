import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, getPost } from '@/content/blog';

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} - CrossTool 博客`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    inLanguage: 'zh-CN',
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <nav className="text-xs text-muted">
        <Link href="/blog" className="hover:text-primary">
          ← 返回博客
        </Link>
      </nav>
      <article className="mt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="rounded-full bg-panel px-2 py-0.5 font-semibold text-primary">{post.category}</span>
          <time dateTime={post.date}>{post.date}</time>
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{post.title}</h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {post.relatedTools.length > 0 && (
          <section className="mt-10 rounded-card border border-border bg-panel p-5">
            <h2 className="text-sm font-bold">相关本地工具（打开即用，零上传）</h2>
            <ul className="mt-3 space-y-2">
              {post.relatedTools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {t.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
