'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

// 内置词库：常见 Listing 词 → 同义/更本地化表达（仅本地，零上传）
const BANK: Record<string, string[]> = {
  wireless: ['cordless', 'bluetooth'],
  cheap: ['budget', 'affordable'],
  fast: ['quick', 'rapid'],
  big: ['large', 'jumbo'],
  small: ['compact', 'mini'],
  good: ['premium', 'quality'],
  new: ['2026', 'latest'],
  best: ['top', 'pro'],
  water: ['waterproof', 'water-resistant'],
  light: ['lightweight', 'portable'],
  strong: ['heavy-duty', 'durable'],
  nice: ['elegant', 'stylish'],
  hot: ['warm', 'heated'],
  bag: ['tote', 'pouch'],
  box: ['case', 'storage'],
};

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'with', 'to', 'of', 'in', 'on']);

export default function TitleLocalizerClient() {
  const { t } = useT();
  const [title, setTitle] = useState('');
  const [applied, setApplied] = useState<Record<string, string>>({});

  const words = title.toLowerCase().match(/[a-z0-9]+/g) || [];
  const suggestions: { word: string; alts: string[] }[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    if (BANK[w] && !seen.has(w)) {
      seen.add(w);
      suggestions.push({ word: w, alts: BANK[w] });
    }
  }
  const len = title.length;
  const freq: Record<string, number> = {};
  for (const w of words) if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  function apply(word: string, alt: string) {
    setApplied((p) => ({ ...p, [word]: alt }));
  }

  const preview = title
    .split(/(\s+)/)
    .map((tok) => {
      const key = tok.toLowerCase().replace(/[^a-z0-9]/g, '');
      return applied[key] ? tok.replace(new RegExp('^' + key, 'i'), applied[key]) : tok;
    })
    .join('');

  return (
    <div>
      <h1 className="text-xl font-bold">{t('titleLocTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('titleLocDesc')}</p>

      <input
        className="mt-4 w-full rounded-card border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
        placeholder={t('titleLocInput')}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setApplied({});
        }}
      />
      <div className="mt-2 text-xs text-muted">
        {t('titleLocLen')}: <b className={len > 200 ? 'text-warn' : 'text-ok'}>{len}</b> / 200
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 rounded-card border border-border bg-panel p-3 shadow-card">
          <div className="mb-2 text-sm font-semibold">{t('titleLocSuggest')}</div>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.word} className="flex flex-wrap items-center gap-2 text-sm">
                <code className="rounded bg-bg px-1.5 py-0.5">{s.word}</code>
                <span className="text-muted">→</span>
                {s.alts.map((a) => (
                  <button
                    key={a}
                    className={`rounded-lg border px-2 py-1 text-xs font-semibold ${applied[s.word] === a ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-bg hover:border-primary'}`}
                    onClick={() => apply(s.word, a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {top.length > 0 && (
        <div className="mt-3 rounded-card border border-border bg-panel p-3 shadow-card text-sm">
          <div className="mb-2 font-semibold">{t('titleLocDensity')}</div>
          <div className="flex flex-wrap gap-2">
            {top.map(([w, n]) => (
              <span key={w} className="rounded bg-bg px-2 py-0.5 text-xs">
                {w} ×{n}
              </span>
            ))}
          </div>
        </div>
      )}

      {preview && preview !== title && (
        <div className="mt-3 rounded-card border border-ok/30 bg-ok/10 p-3 text-sm">
          <div className="mb-1 font-semibold text-muted">{t('titleLocPreview')}</div>
          <div className="break-words">{preview}</div>
        </div>
      )}
    </div>
  );
}
