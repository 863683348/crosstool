import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, getPost, CATEGORY_SLUGS, CATEGORY_EN } from '@/content/blog';
import { TOOLS } from '@/lib/tools';
import { TOOL_STRINGS } from '@/lib/toolStrings';

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

function toolTitleEn(slug: string, fallback: string): string {
  const meta = TOOLS.find((t) => t.slug === slug);
  if (meta && TOOL_STRINGS[meta.titleKey]?.en) return TOOL_STRINGS[meta.titleKey].en;
  return fallback;
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
    title: `${post.titleEn || post.title} - CrossTool Blog`,
    description: post.excerptEn || post.excerpt,
    alternates: {
      canonical: `/blog/en/${post.slug}`,
      languages: {
        'zh-CN': `/blog/${post.slug}`,
        en: `/blog/en/${post.slug}`,
        'x-default': `/blog/${post.slug}`,
      },
    },
  };
}

export default async function BlogEnPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const title = post.titleEn || post.title;
  const excerpt = post.excerptEn || post.excerpt;
  const body = post.bodyEn || post.body;
  const catSlug = Object.keys(CATEGORY_SLUGS).find((s) => CATEGORY_SLUGS[s] === post.category);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    datePublished: post.date,
    description: excerpt,
    inLanguage: 'en',
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <nav className="text-xs text-muted">
        <Link href="/blog/en" className="hover:text-primary">
          ← Back to blog
        </Link>
        <span className="mx-2">·</span>
        <Link href={`/blog/${post.slug}`} className="hover:text-primary">
          阅读中文版 →
        </Link>
      </nav>
      <article className="mt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="rounded-full bg-panel px-2 py-0.5 font-semibold text-primary">
            {catSlug ? CATEGORY_EN[catSlug] || post.category : post.category}
          </span>
          <time dateTime={post.date}>{post.date}</time>
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{title}</h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
          {body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {post.relatedTools.length > 0 && (
          <section className="mt-10 rounded-card border border-border bg-panel p-5">
            <h2 className="text-sm font-bold">Related local tools (zero upload)</h2>
            <ul className="mt-3 space-y-2">
              {post.relatedTools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {toolTitleEn(t.slug, t.title)} →
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
