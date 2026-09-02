'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy, RefreshCw } from 'lucide-react';

export default function UrlCodecClient() {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');

  function go(nextMode?: 'encode' | 'decode') {
    const m = nextMode ?? mode;
    setMode(m);
    setError('');
    if (!input) {
      setOutput('');
      return;
    }
    try {
      setOutput(m === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch {
      setError(m === 'encode' ? '编码失败' : 'URL 格式无效');
      setOutput('');
    }
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('urlCodecTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('urlCodecDesc')}</p>

      <div className="mt-4 flex gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'encode' ? 'bg-primary text-primary-text' : 'border border-border bg-panel'}`}
          onClick={() => go('encode')}
        >
          {t('base64Encode')}
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'decode' ? 'bg-primary text-primary-text' : 'border border-border bg-panel'}`}
          onClick={() => go('decode')}
        >
          {t('base64Decode')}
        </button>
      </div>

      <textarea
        className="mt-4 h-40 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder={t('base64Input')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={() => go()}>
          <RefreshCw size={14} /> {mode === 'encode' ? t('base64Encode') : t('base64Decode')}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      {output && (
        <div className="mt-4">
          <div className="mb-1 text-sm font-semibold">{t('base64Output')}</div>
          <textarea readOnly className="h-40 w-full rounded-card border border-border bg-panel p-3 text-sm text-text" value={output} />
          <button className="mt-2 flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-sm hover:border-primary" onClick={copy}>
            <Copy size={14} /> {t('base64Copy')}
          </button>
        </div>
      )}
    </div>
  );
}
