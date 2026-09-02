import type { Metadata } from 'next';
import ImageRenameClient from '@/components/tools/ImageRenameClient';

export const metadata: Metadata = {
  title: '图片批量重命名 · 本地隐私',
  description: '按规则批量重命名产品图（如 SKU_001…），零上传。',
  alternates: { canonical: '/tools/image-batch-rename' },
};

export default function Page() {
  return <ImageRenameClient />;
}
