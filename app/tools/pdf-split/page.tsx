import type { Metadata } from 'next';
import PdfSplitClient from '@/components/tools/PdfSplitClient';

export const metadata: Metadata = {
  title: 'PDF 拆分 · 本地隐私',
  description: '按页码范围把一个 PDF 拆成多个文件，全部本地处理。例如 1-3,5,8-10。',
  alternates: { canonical: '/tools/pdf-split' },
};

export default function Page() {
  return <PdfSplitClient />;
}
