import type { Metadata } from 'next';
import JwtDecoderClient from '@/components/tools/JwtDecoderClient';

export const metadata: Metadata = {
  title: 'JWT 解码 · 本地隐私',
  description: '解析店铺 API Token 的 Header / Payload，高亮过期时间，零上传。',
  alternates: { canonical: '/tools/jwt-decoder' },
};

export default function Page() {
  return <JwtDecoderClient />;
}
