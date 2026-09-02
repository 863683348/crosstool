'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy } from 'lucide-react';

const ALGOS: Record<string, string> = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-384': 'SHA-384',
  'SHA-512': 'SHA-512',
};

async function digest(algo: string, buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest(algo, buf);
  return Array.from(new Uint8Array(h))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function HashClient() {
  const { t } = useT();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [algo, setAlgo] = useState('SHA-256');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(getBuf: () => Promise<ArrayBuffer>) {
    setBusy(true);
    try {
      const buf = await getBuf();
      setOut(await digest(algo, buf));
    } catch {
      setOut('');
      alert('处理失败');
    } finally {
      setBusy(false);
    }
  }

  function fromText() {
    if (!text) {
      setOut('');
      return;
    }
    const enc = new TextEncoder().encode(text);
    run(async () => enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    run(() => f.arrayBuffer());
  }

  function copy() {
    if (!out) return;
    navigator.clipboard.writeText(out).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('hashTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('hashDesc')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          className="rounded-card border border-border bg-bg p-2 text-sm text-text"
          value={algo}
          onChange={(e) => setAlgo(e.target.value)}
        >
          {Object.keys(ALGOS).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50" onClick={fromText} disabled={busy}>
          {t('jsonConvBtn')}
        </button>
        <label className="cursor-pointer rounded-lg border border-border bg-panel px-4 py-2 text-sm hover:border-primary">
          {t('dropBig')}
          <input type="file" className="hidden" onChange={onFile} />
        </label>
      </div>

      <textarea
        className="mt-4 h-32 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder={t('base64Input')}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {fileName && <p className="mt-1 text-xs text-muted">{fileName}</p>}

      {out && (
        <div className="mt-4">
          <div className="mb-1 text-sm font-semibold">{algo}</div>
          <textarea readOnly className="h-24 w-full break-all rounded-card border border-border bg-panel p-3 text-sm text-text" value={out} />
          <button className="mt-2 flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-sm hover:border-primary" onClick={copy}>
            <Copy size={14} /> {t('base64Copy')}
          </button>
        </div>
      )}
    </div>
  );
}
