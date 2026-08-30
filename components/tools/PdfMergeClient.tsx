'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { mergeFiles, downloadBytes, getPageCount } from '@/lib/pdf/pdfClient';
import { FileUp, X, Download, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

interface Item {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number | null;
  status: 'ready' | 'processing' | 'done' | 'error';
}

function fmtSize(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

export default function PdfMergeClient() {
  const { t } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | File[]) {
    setError('');
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        setError(`${file.name} 不是 PDF`);
        continue;
      }
      const id = 'p' + Math.random().toString(36).slice(2);
      const it: Item = { id, file, name: file.name, size: file.size, pages: null, status: 'ready' };
      setItems((p) => [...p, it]);
      getPageCount(file)
        .then((n) => setItems((p) => p.map((x) => (x.id === id ? { ...x, pages: n } : x))))
        .catch(() => setItems((p) => p.map((x) => (x.id === id ? { ...x, status: 'error' } : x))));
    }
  }

  function remove(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    setItems((p) => {
      const i = p.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function run() {
    if (items.length < 2) {
      setError(t('pdfMergeDrag'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const bytes = await mergeFiles(items.map((i) => i.file));
      downloadBytes(bytes, 'merged.pdf');
      setItems((p) => p.map((x) => ({ ...x, status: 'done' })));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('pdfMergeTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('pdfMergeDesc')}</p>

      <div
        className="mt-4 cursor-pointer rounded-card border-2 border-dashed border-border bg-panel p-10 text-center shadow-card transition hover:border-primary"
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="mx-auto mb-2 text-primary" />
        <div className="font-semibold">{t('dropBig')}</div>
        <div className="text-sm text-muted">{t('dropFmtPdf')}</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-card border border-border bg-panel p-3 shadow-card"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{it.name}</div>
                <div className="text-xs text-muted">
                  {fmtSize(it.size)}
                  {it.pages != null ? ` · ${it.pages} ${t('pdfMergePages')}` : ''}
                </div>
              </div>
              <button className="p-1 text-muted hover:text-text" onClick={() => move(it.id, -1)} title="up">
                <ArrowUp size={16} />
              </button>
              <button className="p-1 text-muted hover:text-text" onClick={() => move(it.id, 1)} title="down">
                <ArrowDown size={16} />
              </button>
              <button className="p-1 text-muted hover:text-warn" onClick={() => remove(it.id)}>
                <X size={16} />
              </button>
            </div>
          ))}

          <button
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 font-semibold text-primary-text transition hover:opacity-90 disabled:opacity-50"
            onClick={run}
            disabled={busy || items.length < 2}
          >
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {t('pdfMergeRun')}
          </button>
        </div>
      )}
    </div>
  );
}
