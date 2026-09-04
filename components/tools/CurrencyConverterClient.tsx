'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

// 硬编码汇率表（相对 USD，示例值，需定期更新）；支持手动覆盖
const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.18,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.3,
  MXN: 17.1,
  BRL: 5.05,
  SGD: 1.35,
  HKD: 7.81,
};

export default function CurrencyConverterClient() {
  const { t } = useT();
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('CNY');
  const [override, setOverride] = useState<Record<string, string>>({});

  const rateOf = (c: string) => parseFloat(override[c] || '') || RATES[c] || 1;
  const amt = parseFloat(amount) || 0;
  const result = (amt * rateOf(to)) / rateOf(from);
  const unitRate = rateOf(to) / rateOf(from);

  const cur = Object.keys(RATES);

  function setOverrideRate(c: string, v: string) {
    setOverride((p) => ({ ...p, [c]: v }));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('curTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('curDesc')}</p>

      <div className="mt-4 space-y-3 rounded-card border border-border bg-panel p-4 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('curAmount')}</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">{t('curFrom')}</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary">
              {cur.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">{t('curTo')}</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary">
              {cur.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-primary-border bg-primary-soft p-4 text-center">
        <div className="text-xs text-muted">{t('curResult')}</div>
        <div className="text-2xl font-bold text-primary">
          {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}
        </div>
        <div className="text-xs text-muted">1 {from} = {unitRate.toFixed(4)} {to}</div>
      </div>

      <details className="mt-3 rounded-card border border-border bg-panel p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-muted">{t('curOverride')}</summary>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cur.map((c) => (
            <div key={c} className="flex items-center gap-1">
              <span className="w-10 font-mono text-xs">{c}</span>
              <input
                type="number"
                placeholder={String(RATES[c])}
                value={override[c] || ''}
                onChange={(e) => setOverrideRate(c, e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1 text-xs outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
