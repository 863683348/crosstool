'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

interface Row {
  name: string;
  price: string;
  cost: string;
  units: string;
}

function calc(r: Row) {
  const p = Number(r.price) || 0;
  const c = Number(r.cost) || 0;
  const u = Number(r.units) || 0;
  return { profit: (p - c) * u, revenue: p * u, u };
}

export default function MultiProfitClient() {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([
    { name: 'ASIN-1', price: '', cost: '', units: '' },
    { name: 'ASIN-2', price: '', cost: '', units: '' },
  ]);

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => setRows((rs) => [...rs, { name: `ASIN-${rs.length + 1}`, price: '', cost: '', units: '' }]);
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const profits = rows.map(calc);
  let best = 0;
  profits.forEach((x, i) => {
    if (x.profit > profits[best].profit) best = i;
  });

  const total = profits.reduce((a, x) => a + x.profit, 0);
  const fmt = (n: number) => (n < 0 ? '-$' + Math.abs(n).toFixed(2) : '$' + n.toFixed(2));

  return (
    <div>
      <h1 className="text-xl font-bold">{t('multiProfitTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('multiProfitDesc')}</p>

      <div className="mt-4 space-y-2">
        {rows.map((r, i) => {
          const { profit } = profits[i];
          const isBest = rows.length > 1 && i === best && profit > 0;
          return (
            <div
              key={i}
              className={`flex flex-wrap items-end gap-2 rounded-card border border-border bg-panel p-3 ${isBest ? 'ring-2 ring-primary' : ''}`}
            >
              <label className="flex flex-col gap-1 text-xs text-muted">
                名称
                <input
                  className="w-28 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
                  value={r.name}
                  onChange={(e) => set(i, { name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                售价
                <input
                  className="w-24 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
                  value={r.price}
                  onChange={(e) => set(i, { price: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                成本
                <input
                  className="w-24 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
                  value={r.cost}
                  onChange={(e) => set(i, { cost: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                月销
                <input
                  className="w-24 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
                  value={r.units}
                  onChange={(e) => set(i, { units: e.target.value })}
                />
              </label>
              <span className="text-sm">
                利润 <b className="text-primary">{fmt(profit)}</b>
              </span>
              {isBest && <span className="rounded-card bg-primary px-2 py-0.5 text-xs text-primary-text">最优</span>}
              <button
                className="ml-auto rounded-card border border-border px-2 py-1 text-xs text-muted hover:text-text"
                onClick={() => remove(i)}
                disabled={rows.length <= 1}
              >
                删除
              </button>
            </div>
          );
        })}
      </div>

      <button className="mt-3 rounded-card border border-border px-3 py-1.5 text-sm hover:bg-panel" onClick={add}>
        + 添加店铺 / ASIN
      </button>

      <div className="mt-4 rounded-card border border-border bg-panel p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">总利润（{rows.length} 项）</span>
          <span className="font-semibold text-primary">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
