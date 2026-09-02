import type { Metadata } from 'next';
import TitleAbClient from '@/components/tools/TitleAbClient';

export const metadata: Metadata = {
  title: '标题 A/B 对比 · 本地隐私',
  description: '对比两版标题长度 / 关键词差异并高亮，零上传。',
  alternates: { canonical: '/tools/title-ab-test' },
};

export default function Page() {
  return <TitleAbClient />;
}
