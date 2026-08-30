import type { Metadata } from 'next';
import TextNormalizerClient from '@/components/tools/TextNormalizerClient';

export const metadata: Metadata = {
  title: '文本规范化 · 本地隐私',
  description: '批量去空格 / 去空行 / 去重 / 大小写 / 去非 ASCII，零上传。',
  alternates: { canonical: '/tools/text-normalizer' },
};

export default function Page() {
  return <TextNormalizerClient />;
}
