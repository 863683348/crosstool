'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy, RefreshCw } from 'lucide-react';

const NAMED: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&trade;': '™',
  '&euro;': '€', '&pound;': '£', '&yen;': '¥', '&cent;': '¢',
  '&hellip;': '…', '&mdash;': '—', '&ndash;': '–', '&bull;': '•',
  '&middot;': '·', '&times;': '×', '&divide;': '÷', '&deg;': '°',
  '&frac12;': '½', '&frac14;': '¼', '&frac34;': '¾', '&sect;': '§',
  '&para;': '¶', '&plusmn;': '±', '&sup2;': '²', '&sup3;': '³',
  '&radic;': '√', '&infin;': '∞', '&alpha;': 'α', '&beta;': 'β',
  '&laquo;': '«', '&raquo;': '»', '&ldquo;': '“',
  '&rdquo;': '”', '&lsquo;': '‘', '&rsquo;': '’',
};

function decodeEntities(s: string): string {
  let out = s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  for (const k in NAMED) out = out.split(k).join(NAMED[k]);
  return out;
}

function encodeEntities(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default function HtmlEntityClient() {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'decode' | 'encode'>('decode');

  function go(nextMode?: 'decode' | 'encode') {
    const m = nextMode ?? mode;
    setMode(m);
    if (!input) {
      setOutput('');
      return;
    }
    setOutput(m === 'decode' ? decodeEntities(input) : encodeEntities(input));
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('htmlEntityTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('htmlEntityDesc')}</p>

      <div className="mt-4 flex gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'decode' ? 'bg-primary text-primary-text' : 'border border-border bg-panel'}`}
          onClick={() => go('decode')}
        >
          {t('base64Decode')}
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'encode' ? 'bg-primary text-primary-text' : 'border border-border bg-panel'}`}
          onClick={() => go('encode')}
        >
          {t('base64Encode')}
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
          <RefreshCw size={14} /> {mode === 'decode' ? t('base64Decode') : t('base64Encode')}
        </button>
      </div>

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
