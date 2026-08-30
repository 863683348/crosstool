import type { Metadata } from 'next';
import PdfCompressClient from '@/components/tools/PdfCompressClient';

export const metadata: Metadata = {
  title: 'PDF 压缩 · 本地隐私',
  description: '重新编码 PDF 以减小体积，全程本地处理、文件不上传。适合压缩给买家发的目录、说明书。',
  alternates: { canonical: '/tools/pdf-compress' },
};

export default function Page() {
  return <PdfCompressClient />;
}
