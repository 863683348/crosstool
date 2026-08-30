'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy } from 'lucide-react';

type Target = 'csv' | 'yaml' | 'xml';

function toCsv(obj: any): string {
  if (!Array.isArray(obj)) throw new Error('CSV 需要 JSON 数组');
  if (!obj.length) return '';
  const keys = Object.keys(obj[0]);
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = [keys.join(',')];
  for (const row of obj) rows.push(keys.map((k) => esc(row[k])).join(','));
  return rows.join('\n');
}

function toYaml(obj: any, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(obj)) {
    if (!obj.length) return '[]';
    return obj.map((v) => `${pad}- ${scalar(v, indent + 1)}`).join('\n');
  }
  if (obj && typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (!keys.length) return '{}';
    return keys.map((k) => `${pad}${k}: ${nested(obj[k], indent + 1)}`).join('\n');
  }
  return pad + scalar(obj, indent);
}

function scalar(v: any, _indent: number): string {
  if (v == null) return 'null';
  if (typeof v === 'string') return /[:#\-?{}\[\],&*!|>'"%@`\n]/.test(v) || v === '' ? JSON.stringify(v) : v;
  return String(v);
}
function nested(v: any, indent: number): string {
  if (v && typeof v === 'object' && (Array.isArray(v) ? v.length : Object.keys(v).length)) {
    if (Array.isArray(v)) return '\n' + toYaml(v, indent);
    return '\n' + Object.keys(v).map((k) => `${'  '.repeat(indent)}${k}: ${nested(v[k], indent + 1)}`).join('\n');
  }
  return scalar(v, indent);
}

function toXml(obj: any): string {
  const ser = (v: any, key: string): string => {
    if (Array.isArray(v)) return v.map((x) => ser(x, key)).join('');
    if (v && typeof v === 'object') return `<${key}>${Object.keys(v).map((k) => ser(v[k], k)).join('')}</${key}>`;
    return `<${key}>${v == null ? '' : String(v)}</${key}>`;
  };
  if (!obj || typeof obj !== 'object') throw new Error('XML 需要 JSON 对象');
  const root = Object.keys(obj)[0] || 'root';
  return ser(obj, root);
}

export default function JsonConvertClient() {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<Target>('csv');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  function convert() {
    setError('');
    try {
      const obj = JSON.parse(input);
      setOutput(target === 'csv' ? toCsv(obj) : target === 'yaml' ? toYaml(obj) : toXml(obj));
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
      <h1 className="text-xl font-bold">{t('jsonConvTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('jsonConvDesc')}</p>

      <textarea
        className="mt-4 h-40 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder="{}"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as Target)}
          className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
        >
          <option value="csv">CSV</option>
          <option value="yaml">YAML</option>
          <option value="xml">XML</option>
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={convert}>
          {t('jsonConvBtn')}
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
