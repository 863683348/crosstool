import type { Metadata } from 'next';
import ExifClient from '@/components/tools/ExifClient';

export const metadata: Metadata = {
  title: 'EXIF 查看 / 清除 · 本地隐私',
  description: '查看并抹除图片 GPS/设备元数据，保护隐私，零上传。',
  alternates: { canonical: '/tools/exif-cleaner' },
};

export default function Page() {
  return <ExifClient />;
}
