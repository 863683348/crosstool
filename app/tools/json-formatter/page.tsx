import type { Metadata } from 'next';
import JsonFormatterClient from '@/components/tools/JsonFormatterClient';

export const metadata: Metadata = {
  title: 'JSON 格式化 · 本地隐私',
  description: '美化或压缩 JSON，零上传。',
  alternates: { canonical: '/tools/json-formatter' },
};

export default function Page() {
  return <JsonFormatterClient />;
}
