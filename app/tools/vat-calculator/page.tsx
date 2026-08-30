import type { Metadata } from 'next';
import VatClient from '@/components/tools/VatClient';

export const metadata: Metadata = {
  title: '欧盟 VAT 计算器 · 本地隐私',
  description: '快速计算含/不含税价格与 VAT 金额，覆盖欧盟主要税率。',
  alternates: { canonical: '/tools/vat-calculator' },
};

export default function Page() {
  return <VatClient />;
}
