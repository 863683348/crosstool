'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

// 示例参考税率（%），仅供估算，以官方税则为基准
const RATES: Record<string, number> = {
  US: 0, // 美国多数消费品免关税（以官方 HTS 为准）
  DE: 0.19, // 德国进口增值税（VAT），关税按 HS 另计
  GB: 0.2,
  FR: 0.2,
  JP: 0.1, // 日本消费税（参考）
  AU: 0.1,
  CA: 0.05,
};

export default function DutyClient() {
  const { t } = useT();
  const [hs, setHs] = useState('');
  const [country, setCountry] = useState('DE');
  const [value, setValue] = useState('');
  const [rate, setRate] = useState('');

  const vat = RATES[country] ?? 0;
  const customs = Number(rate) || 0;
  const v = Number(value) || 0;
  const duty = (v * customs) / 100;
  const tax = ((v + duty) * vat) / 100;

  return (
    <div>
      <h1 className="text-xl font-bold">{t('dutyTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('dutyDesc')}</p>

      <div className="mt-4 space-y-3 rounded-card border border-border bg-panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-40 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
            placeholder="HS 编码 (如 6109.10)"
            value={hs}
            onChange={(e) => setHs(e.target.value)}
          />
          <select className="rounded-card border border-border bg-bg p-2 text-sm text-text" value={country} onChange={(e) => setCountry(e.target.value)}>
            {Object.keys(RATES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            className="w-32 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
            placeholder={`${t('profitPrice')} (USD)`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <input
            type="number"
            className="w-24 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
            placeholder="关税 %"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted">{t('fbaNote')}（{country} 进口环节税率参考 {vat * 100}%）</p>
      </div>

      {v > 0 && (
        <div className="mt-4 space-y-1 rounded-card border border-border bg-panel p-4 text-sm">
          <div className="flex justify-between"><span>{t('dutyTitle')}</span><span className="font-semibold">${duty.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>{t('vatTitle')}</span><span className="font-semibold">${tax.toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-border pt-1"><span className="font-semibold">合计税费</span><span className="font-semibold text-primary">${(duty + tax).toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );
}
