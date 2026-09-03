import type { Metadata } from 'next';
import VideoCompressClient from '@/components/tools/VideoCompressClient';
import ToolDoc from '@/components/ToolDoc';

export const metadata: Metadata = {
  title: '视频压缩（本地）',
  description: '本地压缩视频体积、可选分辨率与码率，零上传，适合商品短视频。',
  alternates: { canonical: '/tools/video-compress' },
};

export default function Page() {
  return (
    <>
      <VideoCompressClient />
      <ToolDoc slug="video-compress" />
    </>
  );
}
