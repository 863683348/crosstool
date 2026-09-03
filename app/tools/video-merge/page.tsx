import type { Metadata } from 'next';
import VideoMergeClient from '@/components/tools/VideoMergeClient';

export const metadata: Metadata = {
  title: '视频合并（本地）',
  description: '按顺序合并多个视频，零上传。',
  alternates: { canonical: '/tools/video-merge' },
};

export default function Page() {
  return <VideoMergeClient />;
}
