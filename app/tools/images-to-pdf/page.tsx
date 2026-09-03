import type { Metadata } from 'next';
import ImagesToPdfClient from '@/components/tools/ImagesToPdfClient';
import ToolDoc from '@/components/ToolDoc';

export const metadata: Metadata = {
  title: '图片批量转 PDF（本地）',
  description: '把多张产品图合并为一个 PDF，零上传。',
  alternates: { canonical: '/tools/images-to-pdf' },
};

export default function Page() {
  return (
    <>
      <ImagesToPdfClient />
      <ToolDoc slug="images-to-pdf" />
    </>
  );
}
