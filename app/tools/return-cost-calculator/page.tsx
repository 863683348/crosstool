import type { Metadata } from 'next';
import ReturnCostClient from '@/components/tools/ReturnCostClient';

export const metadata: Metadata = {
  title: '退货成本计算器 · 本地隐私',
  description: '按已售 + 退货率算真实净利，零上传。',
  alternates: { canonical: '/tools/return-cost-calculator' },
};

export default function Page() {
  return <ReturnCostClient />;
}
