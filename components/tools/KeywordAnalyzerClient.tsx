'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'to', 'of', 'in', 'on', 'is', 'are', 'this', 'that', 'it', 'you', 'your', 'our', 'we', 'be', 'as', 'at', 'by', 'from', 'can',
]);

export default function KeywordAnalyzerClient() {
  const { t } = useT();
  const [text, setText] = useState('');
  const [limit, setLimit] = useState(15);

  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  const ranked = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const max = ranked.length ? ranked[0][1] : 1;

  return (
    <div>
      <h1 className="text-xl font-bold">{t('kwTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('kwDesc')}</p>

      <textarea
        className="mt-4 h-48 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder={t('kwInput')}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <label className="flex items-center gap-1">
          {t('kwTop')}
          <input
            type="number"
            min={5}
            max={50}
            value={limit}
            onChange={(e) => setLimit(Math.max(5, Math.min(50, parseInt(e.target.value, 10) || 15)))}
            className="w-16 rounded border border-border bg-bg px-2 py-1 outline-none focus:border-primary"
          />
        </label>
        <span>{t('kwTotal')}: {words.length}</span>
      </div>

      {ranked.length > 0 && (
        <div className="mt-3 space-y-1 rounded-card border border-border bg-panel p-3 shadow-card">
          {ranked.map(([w, n]) => (
            <div key={w} className="flex items-center gap-2 text-sm">
              <span className="w-28 truncate font-medium">{w}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="w-16 text-right text-xs text-muted">
                {n} · {total ? ((n / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
