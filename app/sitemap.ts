import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';

const SITE = 'https://crosstool.online';

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: SITE + '/', changeFrequency: 'weekly', priority: 1 },
  ];
  for (const t of TOOLS) {
    urls.push({ url: SITE + '/tools/' + t.slug, changeFrequency: 'monthly', priority: 0.8 });
  }
  return urls;
}
