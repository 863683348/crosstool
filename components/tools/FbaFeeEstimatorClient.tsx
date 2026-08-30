'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

interface Mkt {
  currency: string;
  tiers: Record<string, { base: number; perKg: number }>;
}

// 简化估算表（示例值，仅供参考，请以各站点官方费率表为准）
const MKTS: Record<string, Mkt> = {
  US: {
    currency: 'USD',
    tiers: {
      small: { base: 3.22, perKg: 0.3 },
      large: { base: 4.75, perKg: 0.38 },
      smallOver: { base: 11.9, perKg: 0.78 },
      largeOver: { base: 16.3, perKg: 0.91 },
    },
  },
  UK: {
    currency: 'GBP',
    tiers: {
      small: { base: 2.74, perKg: 0.26 },
      large: { base: 3.24, perKg: 0.32 },
      smallOver: { base: 9.8, perKg: 0.64 },
      largeOver: { base: 13.4, perKg: 0.74 },
    },
  },
  DE: {
    currency: 'EUR',
    tiers: {
      small: { base: 3.19, perKg: 0.3 },
      large: { base: 3.78, perKg: 0.37 },
      smallOver: { base: 11.4, perKg: 0.74 },
      largeOver: { base: 15.6, perKg: 0.85 },
    },
  },
  JP: {
    currency: 'JPY',
    tiers: {
      small: { base: 430, perKg: 42 },
      large: { base: 610, perKg: 52 },
      smallOver: { base: 1500, perKg: 110 },
      largeOver: { base: 2050, perKg: 128 },
    },
  },
  CA: {
    currency: 'CAD',
    tiers: {
      small: { base: 4.3, perKg: 0.4 },
      large: { base: 6.1, perKg: 0.5 },
      smallOver: { base: 15.2, perKg: 1.0 },
      largeOver: { base: 21.0, perKg: 1.2 },
    },
  },
  AU: {
    currency: 'AUD',
    tiers: {
      small: { base: 5.1, perKg: 0.5 },
      large: { base: 7.2, perKg: 0.6 },
      smallOver: { base: 18.5, perKg: 1.2 },
      largeOver: { base: 25.0, perKg: 1.4 },
    },
  },
};

const TIERS = [
  ['small', 'fbaSmall'],
  ['large', 'fbaLarge'],
  ['smallOver', 'fbaSmallOver'],
  ['largeOver', 'fbaLargeOver'],
] as const;

export default function FbaFeeEstimatorClient() {
  const { t } = useT();
  const [mkt, setMkt] = useState('US');
  const [tier, setTier] = useState('large');
  const [weight, setWeight] = useState('0.5');

  const m = MKTS[mkt];
  const tr = m.tiers[tier];
  const w = parseFloat(weight) || 0;
  const fee = tr.base + tr.perKg * Math.max(0, w);

  return (
    <div>
      <h1 className="text-xl font-bold">{t('fbaTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('fbaDesc')}</p>

      <div className="mt-4 space-y-3 rounded-card border border-border bg-panel p-4 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('fbaMarket')}</label>
          <select value={mkt} onChange={(e) => setMkt(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary">
            {Object.keys(MKTS).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('fbaTier')}</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary">
            {TIERS.map(([v, lbl]) => (
              <option key={v} value={v}>{t(lbl)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('fbaWeight')} (kg)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-4 rounded-card border border-primary/30 bg-primary-soft p-4 text-center">
        <div className="text-xs text-muted">{t('fbaEstFee')}</div>
        <div className="text-2xl font-bold text-primary">
          {fee.toLocaleString(undefined, { maximumFractionDigits: 2 })} {m.currency}
        </div>
        <div className="text-xs text-muted">{t('fbaNote')}</div>
      </div>
    </div>
  );
}
