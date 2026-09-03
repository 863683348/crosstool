import type { Metadata } from 'next';
import AudioTrimClient from '@/components/tools/AudioTrimClient';
import ToolDoc from '@/components/ToolDoc';

export const metadata: Metadata = {
  title: '音频裁剪（本地）',
  description: '按起止时间裁剪音频，零上传。',
  alternates: { canonical: '/tools/audio-trim' },
};

export default function Page() {
  return (
    <>
      <AudioTrimClient />
      <ToolDoc slug="audio-trim" />
    </>
  );
}
