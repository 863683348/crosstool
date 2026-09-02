import type { Metadata } from 'next';
import ImageBorderClient from '@/components/tools/ImageBorderClient';

export const metadata: Metadata = {
  title: '圆角 / 边框批处理 · 本地隐私',
  description: '主图统一圆角白边（平台要求），零上传。',
  alternates: { canonical: '/tools/image-rounded-border' },
};

export default function Page() {
  return <ImageBorderClient />;
}
