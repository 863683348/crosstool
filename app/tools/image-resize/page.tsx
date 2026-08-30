import type { Metadata } from 'next';
import ImageResizeClient from '@/components/tools/ImageResizeClient';

export const metadata: Metadata = {
  title: '图片缩放 · 本地隐私',
  description: '按最长边或比例缩放产品图，批量处理、零上传。',
  alternates: { canonical: '/tools/image-resize' },
};

export default function Page() {
  return <ImageResizeClient />;
}
