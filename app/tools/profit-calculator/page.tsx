import type { Metadata } from 'next';
import ProfitCalculatorClient from '@/components/tools/ProfitCalculatorClient';

export const metadata: Metadata = {
  title: '利润计算器 · 本地隐私',
  description: '采购 + 运费 + VAT + 平台佣金算净利润与利润率，零上传。',
  alternates: { canonical: '/tools/profit-calculator' },
};

export default function Page() {
  return <ProfitCalculatorClient />;
}
