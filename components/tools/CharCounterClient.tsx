'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

const LIMITS = [
  { key: 'amazonTitle', max: 200 },
  { key: 'amazonBullet', max: 500 },
  { key: 'amazonDesc', max: 2000 },
  { key: 'ebayTitle', max: 80 },
];

export default function CharCounterClient() {
  const { t } = useT();
  const [text, setText] = useState('');

  const count = text.length;

  return (
    <div>
      <h1 className="text-xl font-bold">{t('ccTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('ccDesc')}</p>

      <textarea
        className="mt-4 h-48 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder={t('ccInput')}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LIMITS.map((l) => {
          const over = count > l.max;
          const pct = Math.min(100, (count / l.max) * 100);
          return (
            <div key={l.key} className={`rounded-card border p-3 shadow-card ${over ? 'border-warn-border bg-warn-soft' : 'border-border bg-panel'}`}>
              <div className="text-xs text-muted">{t(l.key)}</div>
              <div className={`text-lg font-bold ${over ? 'text-warn' : 'text-ok'}`}>
                {count}/{l.max}
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
                <div className={`h-full rounded-full ${over ? 'bg-warn' : 'bg-ok'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-sm text-muted">
        {t('ccWords')}: <b>{text.trim() ? text.trim().split(/\s+/).length : 0}</b> · {t('ccChars')}: <b>{count}</b>
      </div>
    </div>
  );
}
