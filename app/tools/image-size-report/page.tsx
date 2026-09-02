import type { Metadata } from 'next';
import ImageSizeReportClient from '@/components/tools/ImageSizeReportClient';

export const metadata: Metadata = {
  title: '图片尺寸报表 · 本地隐私',
  description: '批量读取宽高/体积并生成 CSV 报表，零上传。',
  alternates: { canonical: '/tools/image-size-report' },
};

export default function Page() {
  return <ImageSizeReportClient />;
}
