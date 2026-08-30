'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import type { ToolMeta } from '@/lib/tools';

export default function ToolCard({ tool }: { tool: ToolMeta }) {
  const { t } = useT();
  const inner = (
    <div className="flex h-full flex-col rounded-card border border-border bg-panel p-4 shadow-card transition hover:border-primary">
      <h3 className="font-semibold">{t(tool.titleKey)}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{t(tool.descKey)}</p>
      {tool.soon ? (
        <span className="mt-3 inline-block w-fit rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
          Soon
        </span>
      ) : (
        <span className="mt-3 inline-block w-fit rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
          →
        </span>
      )}
    </div>
  );

  if (tool.soon) {
    return <div className="opacity-60">{inner}</div>;
  }
  return (
    <Link href={`/tools/${tool.slug}`} className="block">
      {inner}
    </Link>
  );
}
