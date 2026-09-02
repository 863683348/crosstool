'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input
        type={type || 'text'}
        className="rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}

export default function ReturnCostClient() {
  const { t } = useT();
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [ship, setShip] = useState('');
  const [com, setCom] = useState('15');
  const [units, setUnits] = useState('');
  const [rr, setRr] = useState('5');

  const p = Number(price) || 0;
  const c = Number(cost) || 0;
  const s = Number(ship) || 0;
  const cm = Number(com) || 0;
  const u = Number(units) || 0;
  const r = Number(rr) || 0;

  const returned = u * (r / 100);
  const soldReal = u - returned;
  const revenue = p * soldReal;
  const cogs = c * u;
  const shipping = s * u;
  const commission = p * u * (cm / 100);
  const returnLoss = returned * (c + s); // 退货不可售，成本 + 运费沉没
  const net = revenue - cogs - shipping - commission - returnLoss;
  const gmv = p * u;
  const margin = gmv > 0 ? (net / gmv) * 100 : 0;

  const fmt = (n: number) => (n < 0 ? '-$' + Math.abs(n).toFixed(2) : '$' + n.toFixed(2));

  return (
    <div>
      <h1 className="text-xl font-bold">{t('returnCostTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('returnCostDesc')}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-card border border-border bg-panel p-4 sm:grid-cols-3">
        <Field label="售价 (USD)" value={price} onChange={setPrice} type="number" />
        <Field label="单件成本 (USD)" value={cost} onChange={setCost} type="number" />
        <Field label="单件运费 (USD)" value={ship} onChange={setShip} type="number" />
        <Field label="平台佣金 %" value={com} onChange={setCom} type="number" />
        <Field label="销量 (件)" value={units} onChange={setUnits} type="number" />
        <Field label="退货率 %" value={rr} onChange={setRr} type="number" />
      </div>

      {u > 0 && (
        <div className="mt-4 space-y-1 rounded-card border border-border bg-panel p-4 text-sm">
          <Row k="实际售出" v={`${soldReal.toFixed(0)} 件`} />
          <Row k="退货量" v={`${returned.toFixed(0)} 件`} />
          <Row k="毛收入" v={fmt(revenue)} />
          <Row k="商品成本" v={fmt(cogs)} />
          <Row k="运费" v={fmt(shipping)} />
          <Row k="平台佣金" v={fmt(commission)} />
          <Row k="退货沉没成本" v={fmt(returnLoss)} />
          <div className="flex justify-between border-t border-border pt-1">
            <span className="font-semibold">真实净利</span>
            <span className="font-semibold text-primary">{fmt(net)}</span>
          </div>
          <Row k="净利率 (vs GMV)" v={`${margin.toFixed(1)}%`} />
          <p className="pt-2 text-xs text-muted">
            假设：退货商品不可二次销售，成本与运费沉没；佣金按全部订单计。仅供估算，以实际平台结算为准。
          </p>
        </div>
      )}
    </div>
  );
}
