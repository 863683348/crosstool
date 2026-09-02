import type { Metadata } from 'next';
import HashClient from '@/components/tools/HashClient';

export const metadata: Metadata = {
  title: '哈希生成 · 本地隐私',
  description: '本地 MD5/SHA 校验文件完整性，零上传。',
  alternates: { canonical: '/tools/hash-generator' },
};

export default function Page() {
  return <HashClient />;
}
