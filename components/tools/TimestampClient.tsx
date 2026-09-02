'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

const ZONES = [
  { id: 'UTC', label: 'UTC' },
  { id: 'local', label: 'Local' },
  { id: 'America/Los_Angeles', label: 'PT (Los Angeles)' },
  { id: 'America/New_York', label: 'ET (New York)' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Berlin', label: 'Berlin' },
  { id: 'Asia/Shanghai', label: '上海' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
];

function fmt(ts: number, zone: string): string {
  const d = new Date(ts * 1000);
  const opt: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: zone === 'local' ? undefined : zone,
  };
  return new Intl.DateTimeFormat('zh-CN', opt).format(d);
}

export default function TimestampClient() {
  const { t } = useT();
  const [ts, setTs] = useState('');
  const [date, setDate] = useState('');
  const [zone, setZone] = useState('Asia/Shanghai');
  const [fromTs, setFromTs] = useState('');
  const [fromDate, setFromDate] = useState('');

  function toDate() {
    const n = Number(ts.trim());
    if (!ts || isNaN(n)) {
      setFromDate('');
      return;
    }
    setFromDate(fmt(n, zone));
  }

  function toTs() {
    if (!date) {
      setFromTs('');
      return;
    }
    const d = new Date(date.trim());
    if (isNaN(d.getTime())) {
      setFromTs('');
      return;
    }
    setFromTs(String(Math.floor(d.getTime() / 1000)));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('tsTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('tsDesc')}</p>

      <div className="mt-4 rounded-card border border-border bg-panel p-4">
        <div className="mb-2 text-sm font-semibold">{t('tsTitle')} → {t('base64Output')}</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-44 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
            placeholder="1693542400"
            value={ts}
            onChange={(e) => setTs(e.target.value)}
          />
          <select
            className="rounded-card border border-border bg-bg p-2 text-sm text-text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>{z.label}</option>
            ))}
          </select>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={toDate}>
            {t('base64Decode')}
          </button>
        </div>
        {fromDate && <p className="mt-2 text-sm text-muted">{fromDate}</p>}
      </div>

      <div className="mt-4 rounded-card border border-border bg-panel p-4">
        <div className="mb-2 text-sm font-semibold">{t('base64Output')} → {t('tsTitle')}</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-56 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
            placeholder="2026-09-01 12:00:00"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={toTs}>
            {t('base64Encode')}
          </button>
        </div>
        {fromTs && <p className="mt-2 text-sm text-muted">{fromTs}</p>}
      </div>

      <p className="mt-3 text-xs text-muted">Now: {Math.floor(Date.now() / 1000)}</p>
    </div>
  );
}
