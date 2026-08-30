import type { Metadata } from 'next';
import PasswordGeneratorClient from '@/components/tools/PasswordGeneratorClient';

export const metadata: Metadata = {
  title: '密码生成器 · 本地隐私',
  description: '用浏览器加密随机数生成强密码，零上传。',
  alternates: { canonical: '/tools/password-generator' },
};

export default function Page() {
  return <PasswordGeneratorClient />;
}
