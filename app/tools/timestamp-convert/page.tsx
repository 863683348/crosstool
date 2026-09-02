import type { Metadata } from 'next';
import TimestampClient from '@/components/tools/TimestampClient';

export const metadata: Metadata = {
  title: '时间戳转换 · 本地隐私',
  description: 'Unix 时间戳 ↔ 日期（多时区）互转，零上传。',
  alternates: { canonical: '/tools/timestamp-convert' },
};

export default function Page() {
  return <TimestampClient />;
}
