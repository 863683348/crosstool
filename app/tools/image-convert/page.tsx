import type { Metadata } from 'next';
import ImageConvertClient from '@/components/tools/ImageConvertClient';

export const metadata: Metadata = {
  title: '图片格式转换 · 本地隐私',
  description: 'JPG / PNG / WebP 互相转换，批量处理、零上传。适合统一产品图格式。',
  alternates: { canonical: '/tools/image-convert' },
};

export default function Page() {
  return <ImageConvertClient />;
}
