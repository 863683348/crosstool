import type { Metadata } from 'next';
import BarcodeClient from '@/components/tools/BarcodeClient';

export const metadata: Metadata = {
  title: '条形码生成 · 本地隐私',
  description: '本地生成 FNSKU/UPC 条码（贴标用），零上传。',
  alternates: { canonical: '/tools/barcode-generator' },
};

export default function Page() {
  return <BarcodeClient />;
}
