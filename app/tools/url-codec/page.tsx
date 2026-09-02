import type { Metadata } from 'next';
import UrlCodecClient from '@/components/tools/UrlCodecClient';

export const metadata: Metadata = {
  title: 'URL 编解码 · 本地隐私',
  description: '调试回调/跟踪链接的 URL 编码与解码，零上传。',
  alternates: { canonical: '/tools/url-codec' },
};

export default function Page() {
  return <UrlCodecClient />;
}
