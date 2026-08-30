import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

const SITE = 'https://crosstool.online';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'CrossTool · 跨境卖家本地隐私工具箱',
    template: '%s · CrossTool',
  },
  description:
    '为 Amazon / TikTok Shop / Shopify 卖家打造的本地隐私工具箱：PDF 合并/压缩/拆分、图片压缩、Base64、VAT 计算器等，100% 浏览器内处理，零上传。',
  keywords: [
    '跨境工具',
    '本地 PDF 工具',
    '图片压缩 本地',
    'vat calculator',
    'cross border seller tools',
    'private pdf tool',
  ],
  alternates: {
    canonical: '/',
    languages: { 'zh-CN': '/', en: '/', 'x-default': '/' },
  },
  openGraph: {
    type: 'website',
    title: 'CrossTool · 跨境卖家本地隐私工具箱',
    description: '100% 浏览器内处理、零上传的跨境卖家工具箱。',
    url: SITE,
    siteName: 'CrossTool',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
