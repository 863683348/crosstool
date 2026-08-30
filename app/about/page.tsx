import type { Metadata } from 'next';
import AboutClient from '@/components/AboutClient';

export const metadata: Metadata = {
  title: '关于 · 请作者喝杯咖啡',
  description:
    'CrossTool 是一个由独立开发者维护的跨境卖家本地隐私工具集合：所有工具 100% 在浏览器内运行，文件不上传服务器。',
  alternates: { canonical: '/about' },
};

export default function Page() {
  return <AboutClient />;
}
