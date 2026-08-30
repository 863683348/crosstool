'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy } from 'lucide-react';

export default function TextNormalizerClient() {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [opts, setOpts] = useState({
    trim: true,
    removeBlank: true,
    dedupe: false,
    upper: false,
    lower: false,
    normSpace: true,
    stripNonAscii: false,
  });

  function normalize(): string {
    let lines = input.split(/\r?\n/);
    if (opts.trim) lines = lines.map((l) => l.trim());
    if (opts.normSpace) lines = lines.map((l) => l.replace(/[ \t]+/g, ' '));
    if (opts.removeBlank) lines = lines.filter((l) => l.length > 0);
    if (opts.dedupe) lines = Array.from(new Set(lines));
    if (opts.upper) lines = lines.map((l) => l.toUpperCase());
    if (opts.lower) lines = lines.map((l) => l.toLowerCase());
    if (opts.stripNonAscii) lines = lines.map((l) => l.replace(/[^\x00-\x7F]/g, ''));
    return lines.join('\n');
  }

  const output = normalize();

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  const toggles: [keyof typeof opts, string][] = [
    ['trim', 'tnTrim'],
    ['removeBlank', 'tnBlank'],
    ['dedupe', 'tnDedupe'],
    ['normSpace', 'tnSpace'],
    ['upper', 'tnUpper'],
    ['lower', 'tnLower'],
    ['stripNonAscii', 'tnAscii'],
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">{t('tnTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('tnDesc')}</p>

      <textarea
        className="mt-4 h-40 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder={t('tnInput')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-3 rounded-card border border-border bg-panel p-3 shadow-card">
        {toggles.map(([key, lbl]) => (
          <label key={key} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={opts[key]} onChange={(e) => setOpts((p) => ({ ...p, [key]: e.target.checked }))} />
            {t(lbl)}
          </label>
        ))}
      </div>

      {output && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold">
            {t('base64Output')}
            <button className="text-primary hover:underline" onClick={copy}>
              <Copy size={14} className="mr-1 inline" /> {t('base64Copy')}
            </button>
          </div>
          <textarea readOnly className="h-40 w-full rounded-card border border-border bg-panel p-3 text-sm text-text" value={output} />
        </div>
      )}
    </div>
  );
}
