import type { Metadata } from 'next';
import CharCounterClient from '@/components/tools/CharCounterClient';

export const metadata: Metadata = {
  title: '字符计数器 · 本地隐私',
  description: '实时统计字符数并对照 Amazon / eBay 长度上限，零上传。',
  alternates: { canonical: '/tools/char-counter' },
};

export default function Page() {
  return <CharCounterClient />;
}
