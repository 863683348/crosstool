import type { Metadata } from 'next';
import SensitiveWordClient from '@/components/tools/SensitiveWordClient';

export const metadata: Metadata = {
  title: '敏感词检查 · 本地隐私',
  description: '扫描 Listing 中的平台违禁词（本地词库），零上传。',
  alternates: { canonical: '/tools/sensitive-word-check' },
};

export default function Page() {
  return <SensitiveWordClient />;
}
