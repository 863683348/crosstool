'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { compressFiles, downloadBytes, downloadBlob, type PdfPart } from '@/lib/pdf/pdfClient';
import { buildZip } from '@/lib/image/imageEngine';
import { FileUp, Download, Loader2 } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  size: number;
  out: PdfPart | null;
  status: 'ready' | 'processing' | 'done' | 'error';
}

function fmtSize(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

export default function PdfCompressClient() {
  const { t } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRefs = useRef<Map<string, File>>(new Map());

  function addFiles(files: FileList | File[]) {
    setError('');
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        setError(`${file.name} 不是 PDF`);
        continue;
      }
      const id = 'c' + Math.random().toString(36).slice(2);
      fileRefs.current.set(id, file);
      setItems((p) => [...p, { id, name: file.name, size: file.size, out: null, status: 'ready' }]);
    }
  }

  async function run() {
    const todo = items.filter((i) => !i.out);
    if (todo.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const parts = await compressFiles(todo.map((i) => fileRefs.current.get(i.id)!));
      const map = new Map(parts.map((p) => [p.name, p]));
      setItems((p) =>
        p.map((i) => {
          const o = map.get(i.name.replace(/\.pdf$/i, '') + '_compressed.pdf');
          return o ? { ...i, out: o, status: 'done' as const } : i;
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function downloadAll() {
    const done = items.filter((i) => i.out);
    if (done.length === 0) return;
    if (done.length === 1 && done[0].out) {
      downloadBytes(done[0].out.bytes, done[0].out.name);
      return;
    }
    const zip = buildZip(
      done.map((i) => ({ name: i.out!.name, data: i.out!.bytes }))
    );
    downloadBlob(zip, `compressed_pdfs_${Date.now()}.zip`);
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('pdfCompressTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('pdfCompressDesc')}</p>
      <p className="mt-1 text-xs text-ok">{t('pdfCompressNote')}</p>

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
          {items.map((it) => {
            const ratio = it.out ? Math.round((1 - it.out.bytes.length / it.size) * 100) : 0;
            return (
              <div key={it.id} className="flex items-center gap-3 rounded-card border border-border bg-panel p-3 shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{it.name}</div>
                  <div className="text-xs text-muted">
                    {fmtSize(it.size)}
                    {it.out ? (
                      <>
                        {' → '}
                        {fmtSize(it.out.bytes.length)}{' '}
                        <span className="font-semibold text-ok">↓{ratio}%</span>
                      </>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
                {it.out && (
                  <button
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary"
                    onClick={() => downloadBytes(it.out!.bytes, it.out!.name)}
                  >
                    <Download size={14} /> {t('download')}
                  </button>
                )}
              </div>
            );
          })}
          <button
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 font-semibold text-primary-text transition hover:opacity-90 disabled:opacity-50"
            onClick={run}
            disabled={busy || items.every((i) => i.out)}
          >
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {t('pdfCompressRun')}
          </button>
          {items.some((i) => i.out) && (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-card border border-border bg-panel px-4 py-2.5 text-sm font-semibold hover:border-primary"
              onClick={downloadAll}
            >
              <Download size={14} /> {t('downloadZip')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
