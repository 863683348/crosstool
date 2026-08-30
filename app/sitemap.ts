import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';

const SITE = 'https://crosstool.online';

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: SITE + '/', changeFrequency: 'weekly', priority: 1 },
    { url: SITE + '/about', changeFrequency: 'monthly', priority: 0.6 },
  ];
  for (const t of TOOLS) {
    if (t.soon) continue; // 未实现页面不进 sitemap，避免死链
    urls.push({ url: SITE + '/tools/' + t.slug, changeFrequency: 'monthly', priority: 0.8 });
  }
  return urls;
}
