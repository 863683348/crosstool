import type { Metadata } from 'next';
import TitleLocalizerClient from '@/components/tools/TitleLocalizerClient';

export const metadata: Metadata = {
  title: '多语言标题优化器 · 本地隐私',
  description: '内置词库给出同义/更本地化表达与密度提示，零上传。',
  alternates: { canonical: '/tools/title-localizer' },
};

export default function Page() {
  return <TitleLocalizerClient />;
}
