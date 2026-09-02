import type { Metadata } from 'next';
import MultiProfitClient from '@/components/tools/MultiProfitClient';

export const metadata: Metadata = {
  title: '多店铺利润对比 · 本地隐私',
  description: '同屏对比多个 ASIN/SKU 利润，零上传。',
  alternates: { canonical: '/tools/multi-store-profit' },
};

export default function Page() {
  return <MultiProfitClient />;
}
