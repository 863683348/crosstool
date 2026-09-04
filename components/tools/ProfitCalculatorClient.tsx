'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

export default function ProfitCalculatorClient() {
  const { t } = useT();
  const [price, setPrice] = useState('29.99');
  const [cost, setCost] = useState('6');
  const [ship, setShip] = useState('3.5');
  const [vat, setVat] = useState('20');
  const [commission, setCommission] = useState('15');
  const [other, setOther] = useState('2');

  const p = parseFloat(price) || 0;
  const c = parseFloat(cost) || 0;
  const s = parseFloat(ship) || 0;
  const v = parseFloat(vat) || 0;
  const com = parseFloat(commission) || 0;
  const o = parseFloat(other) || 0;

  const vatAmt = (p * v) / 100;
  const comAmt = (p * com) / 100;
  const profit = p - c - s - vatAmt - comAmt - o;
  const margin = p > 0 ? (profit / p) * 100 : 0;

  const fields: [string, string, (x: string) => void][] = [
    [t('profitPrice'), price, setPrice],
    [t('profitCost'), cost, setCost],
    [t('profitShip'), ship, setShip],
    [t('profitVat'), vat, setVat],
    [t('profitCommission'), commission, setCommission],
    [t('profitOther'), other, setOther],
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">{t('profitTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('profitDesc')}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-card border border-border bg-panel p-4 shadow-card sm:grid-cols-2">
        {fields.map(([label, val, set]) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">{label}</label>
            <input
              type="number"
              value={val}
              onChange={(e) => set(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-card border border-border bg-panel p-3 shadow-card">
          <div className="text-xs text-muted">{t('profitCommission')}</div>
          <div className="text-lg font-bold">{comAmt.toFixed(2)}</div>
        </div>
        <div className="rounded-card border border-border bg-panel p-3 shadow-card">
          <div className="text-xs text-muted">{t('profitVat')}</div>
          <div className="text-lg font-bold">{vatAmt.toFixed(2)}</div>
        </div>
        <div className="rounded-card border border-border bg-panel p-3 shadow-card">
          <div className="text-xs text-muted">{t('profitOther')}</div>
          <div className="text-lg font-bold">{o.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-primary-border bg-primary-soft p-4 text-center">
        <div className="text-xs text-muted">{t('profitNet')}</div>
        <div className={`text-2xl font-bold ${profit >= 0 ? 'text-ok' : 'text-warn'}`}>{profit.toFixed(2)}</div>
        <div className="text-xs text-muted">{t('profitMargin')}: {margin.toFixed(1)}%</div>
      </div>
    </div>
  );
}
