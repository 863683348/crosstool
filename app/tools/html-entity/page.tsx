import type { Metadata } from 'next';
import HtmlEntityClient from '@/components/tools/HtmlEntityClient';

export const metadata: Metadata = {
  title: 'HTML 实体编解码 · 本地隐私',
  description: '清理 Listing 富文本中的 HTML 实体，零上传。',
  alternates: { canonical: '/tools/html-entity' },
};

export default function Page() {
  return <HtmlEntityClient />;
}
