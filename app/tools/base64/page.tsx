import type { Metadata } from 'next';
import Base64Client from '@/components/tools/Base64Client';

export const metadata: Metadata = {
  title: 'Base64 编解码 · 本地隐私',
  description: '文本与 Base64 互转，常用于调试 API、嵌入小图标。全部本地，不上传。',
  alternates: { canonical: '/tools/base64' },
};

export default function Page() {
  return <Base64Client />;
}
