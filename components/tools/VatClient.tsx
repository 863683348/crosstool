'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

const RATES: Record<string, number> = {
  DE: 19,
  FR: 20,
  GB: 20,
  IT: 22,
  ES: 21,
  NL: 21,
  PL: 23,
  SE: 25,
  BE: 21,
  AT: 20,
  IE: 23,
  PT: 23,
  DK: 25,
  FI: 25.5,
  CZ: 21,
  HU: 27,
  GR: 24,
  RO: 19,
  EU: 21,
};

export default function VatClient() {
  const { t } = useT();
  const [country, setCountry] = useState('DE');
  const [net, setNet] = useState('100');
  const [rate, setRate] = useState('19');

  const netN = parseFloat(net) || 0;
  const rateN = parseFloat(rate) || 0;
  const vatAmount = (netN * rateN) / 100;
  const gross = netN + vatAmount;

  return (
    <div>
      <h1 className="text-xl font-bold">{t('vatTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('vatDesc')}</p>

      <div className="mt-4 space-y-3 rounded-card border border-border bg-panel p-4 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('vatCountry')}</label>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setRate(String(RATES[e.target.value] ?? 21));
            }}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary"
          >
            {Object.keys(RATES).map((c) => (
              <option key={c} value={c}>
                {c} ({RATES[c]}%)
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('vatNet')}</label>
          <input
            type="number"
            value={net}
            onChange={(e) => setNet(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('vatRate')}</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
          <div>
            <div className="text-xs text-muted">{t('vatNet')}</div>
            <div className="text-lg font-bold">{netN.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t('vatAmount')}</div>
            <div className="text-lg font-bold text-primary">{vatAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t('vatGross')}</div>
            <div className="text-lg font-bold text-ok">{gross.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
