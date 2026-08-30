import type { Metadata } from 'next';
import FbaFeeEstimatorClient from '@/components/tools/FbaFeeEstimatorClient';

export const metadata: Metadata = {
  title: 'FBA 费用估算 · 本地隐私',
  description: '按站点与尺寸档估算 FBA 履约费，零上传。',
  alternates: { canonical: '/tools/fba-fee-estimator' },
};

export default function Page() {
  return <FbaFeeEstimatorClient />;
}
