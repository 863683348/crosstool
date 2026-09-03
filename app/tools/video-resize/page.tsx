import type { Metadata } from 'next';
import VideoResizeClient from '@/components/tools/VideoResizeClient';

export const metadata: Metadata = {
  title: '视频分辨率调整（本地）',
  description: '调整视频分辨率/比例，零上传。',
  alternates: { canonical: '/tools/video-resize' },
};

export default function Page() {
  return <VideoResizeClient />;
}
