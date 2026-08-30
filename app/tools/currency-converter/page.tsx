import type { Metadata } from 'next';
import CurrencyConverterClient from '@/components/tools/CurrencyConverterClient';

export const metadata: Metadata = {
  title: '货币换算 · 本地隐私',
  description: '多币种换算，汇率表可手动覆盖，零上传。',
  alternates: { canonical: '/tools/currency-converter' },
};

export default function Page() {
  return <CurrencyConverterClient />;
}
