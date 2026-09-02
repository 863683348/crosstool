import type { Metadata } from 'next';
import BulletGenClient from '@/components/tools/BulletGenClient';

export const metadata: Metadata = {
  title: '五点描述生成器 · 本地隐私',
  description: '按卖点模板批量产出 Bullet（本地词库），零上传。',
  alternates: { canonical: '/tools/bullet-generator' },
};

export default function Page() {
  return <BulletGenClient />;
}
