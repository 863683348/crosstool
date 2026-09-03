import type { Metadata } from 'next';
import VideoTrimClient from '@/components/tools/VideoTrimClient';
import ToolDoc from '@/components/ToolDoc';

export const metadata: Metadata = {
  title: '视频裁剪（本地）',
  description: '按起止时间裁剪视频片段，零上传。',
  alternates: { canonical: '/tools/video-trim' },
};

export default function Page() {
  return (
    <>
      <VideoTrimClient />
      <ToolDoc slug="video-trim" />
    </>
  );
}
