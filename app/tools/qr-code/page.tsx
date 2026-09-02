import type { Metadata } from 'next';
import QrClient from '@/components/tools/QrClient';

export const metadata: Metadata = {
  title: '二维码生成 / 解码 · 本地隐私',
  description: '本地生成店铺/商品二维码、扫码解析，零上传。',
  alternates: { canonical: '/tools/qr-code' },
};

export default function Page() {
  return <QrClient />;
}
