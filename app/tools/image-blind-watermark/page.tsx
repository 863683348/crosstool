import type { Metadata } from 'next';
import ImageBlindWatermarkClient from '@/components/tools/ImageBlindWatermarkClient';

export const metadata: Metadata = {
  title: '隐形水印 · 本地隐私',
  description: '把版权指纹嵌入图片像素（肉眼不可见），事后可提取验证归属；零上传。',
  alternates: { canonical: '/tools/image-blind-watermark' },
};

export default function Page() {
  return <ImageBlindWatermarkClient />;
}
