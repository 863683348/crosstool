import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ToolRunnerClient from '@/components/tools/ToolRunnerClient';
import { TOOLS } from '@/lib/tools';
import { TOOL_IMPLS } from '@/lib/toolImpl';
import { TOOL_STRINGS } from '@/lib/toolStrings';

const SITE = 'https://crosstool.online';

export function generateStaticParams() {
  return Object.keys(TOOL_IMPLS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = TOOLS.find((t) => t.slug === slug);
  if (!meta) return {};
  const title = TOOL_STRINGS[meta.titleKey]?.zh || meta.titleKey;
  const desc = TOOL_STRINGS[meta.descKey]?.zh || meta.descKey;
  return {
    title,
    description: desc,
    alternates: { canonical: `/tools/${slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = TOOLS.find((t) => t.slug === slug);
  if (!meta || !TOOL_IMPLS[slug]) notFound();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: meta.titleKey,
    description: meta.descKey,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    url: SITE + '/tools/' + slug,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolRunnerClient slug={slug} />
    </>
  );
}
