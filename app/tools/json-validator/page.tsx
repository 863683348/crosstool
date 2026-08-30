import type { Metadata } from 'next';
import JsonValidatorClient from '@/components/tools/JsonValidatorClient';

export const metadata: Metadata = {
  title: 'JSON 校验 · 本地隐私',
  description: '检查 JSON 语法错误并定位行号，零上传。',
  alternates: { canonical: '/tools/json-validator' },
};

export default function Page() {
  return <JsonValidatorClient />;
}
