import type { Metadata } from 'next';
import KeywordAnalyzerClient from '@/components/tools/KeywordAnalyzerClient';

export const metadata: Metadata = {
  title: '关键词密度分析 · 本地隐私',
  description: '粘贴 Listing 分析词频与密度，零上传。',
  alternates: { canonical: '/tools/keyword-analyzer' },
};

export default function Page() {
  return <KeywordAnalyzerClient />;
}
