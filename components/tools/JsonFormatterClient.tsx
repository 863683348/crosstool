'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy } from 'lucide-react';

export default function JsonFormatterClient() {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  function pretty() {
    setError('');
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj, null, 2));
    } catch (e) {
      setError(t('jsonErr') + ' ' + (e as Error).message);
    }
  }

  function minify() {
    setError('');
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj));
    } catch (e) {
      setError(t('jsonErr') + ' ' + (e as Error).message);
    }
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('jsonFmtTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('jsonFmtDesc')}</p>

      <textarea
        className="mt-4 h-40 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder="{}"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={pretty}>
          {t('jsonPretty')}
        </button>
        <button className="rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold hover:border-primary" onClick={minify}>
          {t('jsonMinify')}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      {output && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold">
            {t('base64Output')}
            <button className="text-primary hover:underline" onClick={copy}>
              <Copy size={14} className="mr-1 inline" /> {t('base64Copy')}
            </button>
          </div>
          <pre className="h-56 overflow-auto rounded-card border border-border bg-panel p-3 text-xs">{output}</pre>
        </div>
      )}
    </div>
  );
}
