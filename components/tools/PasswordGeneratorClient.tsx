'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy, RefreshCw } from 'lucide-react';

export default function PasswordGeneratorClient() {
  const { t } = useT();
  const [len, setLen] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digit, setDigit] = useState(true);
  const [symbol, setSymbol] = useState(true);
  const [pw, setPw] = useState('');

  function gen() {
    const sets = [
      upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
      lower ? 'abcdefghijklmnopqrstuvwxyz' : '',
      digit ? '0123456789' : '',
      symbol ? '!@#$%^&*()-_=+[]{};:,.?/' : '',
    ].filter(Boolean);
    if (!sets.length) {
      setPw('');
      return;
    }
    const all = sets.join('');
    const buf = new Uint32Array(len);
    crypto.getRandomValues(buf);
    let out = '';
    for (let i = 0; i < len; i++) out += all[buf[i] % all.length];
    setPw(out);
  }

  function copy() {
    if (!pw) return;
    navigator.clipboard.writeText(pw).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  const sets: { label: string; val: boolean; set: (v: boolean) => void }[] = [
    { label: 'A-Z', val: upper, set: setUpper },
    { label: 'a-z', val: lower, set: setLower },
    { label: '0-9', val: digit, set: setDigit },
    { label: '!@#$%', val: symbol, set: setSymbol },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">{t('pwTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('pwDesc')}</p>

      <div className="mt-4 space-y-3 rounded-card border border-border bg-panel p-4 shadow-card">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted">{t('pwLength')}</label>
          <input
            type="number"
            min={4}
            max={64}
            value={len}
            onChange={(e) => setLen(Math.max(4, Math.min(64, parseInt(e.target.value, 10) || 4)))}
            className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary"
          />
          <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-text hover:opacity-90" onClick={gen}>
            <RefreshCw size={14} className="mr-1 inline" /> {t('pwGen')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {sets.map((s) => (
            <label key={s.label} className="flex items-center gap-2">
              <input type="checkbox" checked={s.val} onChange={(e) => s.set(e.target.checked)} />
              <code className="font-mono">{s.label}</code>
            </label>
          ))}
        </div>
        {pw && (
          <div className="rounded-lg bg-bg p-3 font-mono text-sm break-all">
            {pw}
            <button className="ml-2 align-middle text-primary hover:underline" onClick={copy}>
              <Copy size={14} className="inline" /> {t('base64Copy')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
