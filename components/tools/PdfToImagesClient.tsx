'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { pdfToImages } from '@/lib/pdf/pdfToImages';
import { buildZip } from '@/lib/image/imageEngine';
import { Download, Loader2, X, Eye } from 'lucide-react';

interface Page {
  blob: Blob;
  url: string;
  w: number;
  h: number;
}

export default function PdfToImagesClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [fmt, setFmt] = useState<'image/jpeg' | 'image/png'>('image/png');
  const [scale, setScale] = useState(2);
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function add(f: File) {
    if (f.type !== 'application/pdf') {
      alert('PDF only');
      return;
    }
    setFile(f);
    setPages([]);
    setError('');
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const res = await pdfToImages(file, fmt, scale);
      const ps = res.map((p) => ({ blob: p.blob, url: URL.createObjectURL(p.blob), w: p.width, h: p.height }));
      setPages(ps);
    } catch (e) {
      setError(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function downloadSingle(i: number) {
    const p = pages[i];
    const a = document.createElement('a');
    a.href = p.url;
    a.download = `page_${i + 1}.${fmt === 'image/png' ? 'png' : 'jpg'}`;
    a.click();
  }

  async function downloadZip() {
    if (!pages.length) return;
    const counter: Record<string, number> = {};
    const real = await Promise.all(
      pages.map(async (p, i) => {
        let name = `page_${i + 1}.${fmt === 'image/png' ? 'png' : 'jpg'}`;
        if (counter[name] != null && counter[name] > 0) {
          name = name.replace(/(\.[^.]+)$/, `_${counter[name]}$1`);
        }
        counter[name] = (counter[name] || 0) + 1;
        const buf = new Uint8Array(await p.blob.arrayBuffer());
        return { name, data: buf };
      })
    );
    const zip = buildZip(real);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip);
    a.download = `pdf_images_${Date.now()}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function clearAll() {
    pages.forEach((p) => URL.revokeObjectURL(p.url));
    setPages([]);
    setFile(null);
    setError('');
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('pdfToImgTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('pdfToImgDesc')}</p>

      <div
        className="mt-4 cursor-pointer rounded-card border-2 border-dashed border-border bg-panel p-10 text-center shadow-card transition hover:border-primary"
        onClick={() => inputRef.current?.click()}
      >
        <div className="font-semibold">{t('dropBig')}</div>
        <div className="text-sm text-muted">{t('dropFmtPdf')}</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => e.target.files && e.target.files[0] && add(e.target.files[0])}
        />
      </div>

      {file && (
        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-card border border-border bg-panel p-4 shadow-card">
          <div className="text-sm font-medium">{file.name}</div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">{t('imgFmt')}</label>
            <select
              value={fmt}
              onChange={(e) => setFmt(e.target.value as 'image/jpeg' | 'image/png')}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary"
            >
              <option value="image/png">{t('imgFmtPng')}</option>
              <option value="image/jpeg">{t('imgFmtJpg')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">{t('imgScale')}</label>
            <select
              value={scale}
              onChange={(e) => setScale(+e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary"
            >
              <option value={1}>{t('imgScale1')}</option>
              <option value={2}>{t('imgScale2')}</option>
            </select>
          </div>
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50"
            onClick={run}
            disabled={busy}
          >
            {busy ? <Loader2 size={14} className="mr-1 inline animate-spin" /> : null}
            {t('pdfToImgRun')}
          </button>
          <button className="rounded-lg border border-border bg-panel px-3 py-2 text-sm hover:border-primary" onClick={clearAll}>
            {t('clear')}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      {pages.length > 0 && (
        <>
          <div className="mt-3 flex items-center gap-3 rounded-card border border-primary/30 bg-primary-soft px-4 py-3 text-sm">
            <span>
              {t('imgPages')}: <b>{pages.length}</b>
            </span>
            <span className="flex-1" />
            <button className="flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 font-semibold hover:border-primary" onClick={downloadZip}>
              <Download size={14} className="mr-1 inline" /> {t('downloadZip')}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pages.map((p, i) => (
              <div key={i} className="rounded-card border border-border bg-panel p-2 shadow-card">
                <img src={p.url} alt={`page ${i + 1}`} className="w-full rounded-lg border border-border object-contain" style={{ maxHeight: 240 }} />
                <div className="mt-1 flex items-center justify-between px-1">
                  <span className="text-xs text-muted">
                    {p.w}×{p.h}
                  </span>
                  <div className="flex items-center gap-1">
                    <a className="p-1 text-muted hover:text-text" href={p.url} target="_blank" rel="noreferrer" title={t('preview')}>
                      <Eye size={15} />
                    </a>
                    <button className="p-1 text-muted hover:text-text" onClick={() => downloadSingle(i)} title={t('download')}>
                      <Download size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
