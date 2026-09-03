import { toolSeo } from '@/lib/toolSeo';

// 服务端组件：渲染工具页下方的 SEO 正文 + FAQ，并注入 FAQPage JSON-LD。
// 放在交互式 Client 工具下方，补充可索引的静态内容。
export default function ToolDoc({ slug }: { slug: string }) {
  const data = toolSeo[slug];
  if (!data) return null;

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-bold">{data.h2}</h2>
      {data.paras.map((p, i) => (
        <p key={i} className="mt-3 text-sm leading-relaxed text-muted">
          {p}
        </p>
      ))}

      <h2 className="mt-8 text-lg font-bold">常见问题</h2>
      <dl className="mt-3 space-y-4">
        {data.faq.map((f, i) => (
          <div key={i}>
            <dt className="text-sm font-semibold">Q：{f.q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{f.a}</dd>
          </div>
        ))}
      </dl>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </section>
  );
}
