import type { Metadata } from 'next';
import ImagesToVideoClient from '@/components/tools/ImagesToVideoClient';

export const metadata: Metadata = {
  title: '图片转视频（本地）',
  description: '把多张图片合成带转场的视频，零上传。',
  alternates: { canonical: '/tools/images-to-video' },
};

export default function Page() {
  return <ImagesToVideoClient />;
}
