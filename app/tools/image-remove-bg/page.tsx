import type { Metadata } from 'next';
import ImageRemoveBgClient from '@/components/tools/ImageRemoveBgClient';

export const metadata: Metadata = {
  title: '图片去背景 · 本地隐私',
  description: '一键把产品图去背景成透明 PNG，模型在浏览器本地运行，零上传。',
  alternates: { canonical: '/tools/image-remove-bg' },
};

export default function Page() {
  return <ImageRemoveBgClient />;
}
