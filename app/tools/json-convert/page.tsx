import type { Metadata } from 'next';
import JsonConvertClient from '@/components/tools/JsonConvertClient';

export const metadata: Metadata = {
  title: 'JSON 互转 · 本地隐私',
  description: 'JSON 转 CSV / YAML / XML，零上传。',
  alternates: { canonical: '/tools/json-convert' },
};

export default function Page() {
  return <JsonConvertClient />;
}
