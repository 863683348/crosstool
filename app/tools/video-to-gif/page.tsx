import type { Metadata } from 'next';
import VideoToGifClient from '@/components/tools/VideoToGifClient';

export const metadata: Metadata = {
  title: '视频转 GIF（本地）',
  description: '截取片段转成 GIF 动图，零上传。',
  alternates: { canonical: '/tools/video-to-gif' },
};

export default function Page() {
  return <VideoToGifClient />;
}
