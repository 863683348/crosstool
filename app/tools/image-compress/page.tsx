import type { Metadata } from 'next';
import ImageCompressClient from '@/components/tools/ImageCompressClient';

export const metadata: Metadata = {
  title: '图片压缩 · 本地隐私',
  description: 'JPG/PNG/WebP/AVIF 本地压缩与格式转换，零上传、无水印、批量处理、ZIP 导出。',
  alternates: { canonical: '/tools/image-compress' },
};

export default function Page() {
  return <ImageCompressClient />;
}
