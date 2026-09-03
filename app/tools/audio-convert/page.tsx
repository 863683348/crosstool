import type { Metadata } from 'next';
import AudioConvertClient from '@/components/tools/AudioConvertClient';

export const metadata: Metadata = {
  title: '音频格式转换（本地）',
  description: 'MP3 / WAV / M4A 本地互转，零上传。',
  alternates: { canonical: '/tools/audio-convert' },
};

export default function Page() {
  return <AudioConvertClient />;
}
