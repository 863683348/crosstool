import type { Metadata } from 'next';
import DutyClient from '@/components/tools/DutyClient';

export const metadata: Metadata = {
  title: '关税估算 · 本地隐私',
  description: '按 HS 编码 + 目的地国估算进口关税，零上传。',
  alternates: { canonical: '/tools/duty-estimator' },
};

export default function Page() {
  return <DutyClient />;
}
