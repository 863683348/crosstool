import type { Metadata } from 'next';
import VideoFrameExtractClient from '@/components/tools/VideoFrameExtractClient';
import ToolDoc from '@/components/ToolDoc';

export const metadata: Metadata = {
  title: '视频帧提取（本地）',
  description: '按间隔抽取视频静帧，零上传。',
  alternates: { canonical: '/tools/video-frame-extract' },
};

export default function Page() {
  return (
    <>
      <VideoFrameExtractClient />
      <ToolDoc slug="video-frame-extract" />
    </>
  );
}
