import type { Metadata } from 'next';
import VideoExtractAudioClient from '@/components/tools/VideoExtractAudioClient';

export const metadata: Metadata = {
  title: '视频提取音频（本地）',
  description: '把视频中的音轨提取为 MP3，零上传。',
  alternates: { canonical: '/tools/video-extract-audio' },
};

export default function Page() {
  return <VideoExtractAudioClient />;
}
