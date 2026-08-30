import type { Metadata } from 'next';
import PdfMergeClient from '@/components/tools/PdfMergeClient';

export const metadata: Metadata = {
  title: 'PDF 合并 · 本地隐私',
  description: '多个 PDF 按顺序合并成一个，100% 浏览器内处理，零上传。适合合并发票、报关单、合同。',
  alternates: { canonical: '/tools/pdf-merge' },
};

export default function Page() {
  return <PdfMergeClient />;
}
