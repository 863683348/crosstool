import type { Metadata } from 'next';
import PdfToImagesClient from '@/components/tools/PdfToImagesClient';

export const metadata: Metadata = {
  title: 'PDF 转图片 · 本地隐私',
  description: '逐页把 PDF 导出为 JPG/PNG，全部在浏览器本地完成，零上传。适合把合同、说明书转成图片。',
  alternates: { canonical: '/tools/pdf-to-images' },
};

export default function Page() {
  return <PdfToImagesClient />;
}
