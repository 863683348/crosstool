'use client';

import { useT } from '@/lib/i18n';
import { TOOLS, GROUP_LABEL_KEY, type ToolMeta } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import { ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const { t } = useT();

  const groups: ToolMeta['group'][] = ['file', 'image', 'account', 'finance', 'listing', 'media', 'data', 'compliance', 'seo', 'productivity'];
  const grouped = groups
    .map((g) => ({ g, items: TOOLS.filter((x) => x.group === g) }))
    .filter((x) => x.items.length > 0);

  return (
    <div>
      <h1 className="sr-only">{t('seoH1')}</h1>

      <section className="mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-ok/40 bg-ok/10 px-3 py-1 text-xs font-semibold text-ok">
          <ShieldCheck size={14} /> {t('privacyBadge')}
        </div>
        <h2 className="text-2xl font-bold sm:text-3xl">{t('tagline')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted sm:text-base">{t('homeSub')}</p>
      </section>

      {grouped.map(({ g, items }) => (
        <section key={g} className="mb-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {t(GROUP_LABEL_KEY[g])}
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
