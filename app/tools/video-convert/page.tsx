import type { Metadata } from 'next';
import VideoConvertClient from '@/components/tools/VideoConvertClient';
import ToolDoc from '@/components/ToolDoc';

export const metadata: Metadata = {
  title: '视频格式转换（本地）',
  description: 'MP4 / WebM / MOV 本地互转，零上传。',
  alternates: { canonical: '/tools/video-convert' },
};

export default function Page() {
  return (
    <>
      <VideoConvertClient />
      <ToolDoc slug="video-convert" />
    </>
  );
}
