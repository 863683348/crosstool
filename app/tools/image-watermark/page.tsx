import type { Metadata } from 'next';
import ImageWatermarkClient from '@/components/tools/ImageWatermarkClient';

export const metadata: Metadata = {
  title: '批量水印 · 本地隐私',
  description: '给产品图批量叠加可见版权文字，零上传。',
  alternates: { canonical: '/tools/image-watermark' },
};

export default function Page() {
  return <ImageWatermarkClient />;
}
