'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { splitFile, downloadBytes, downloadBlob, getPageCount, type PdfPart } from '@/lib/pdf/pdfClient';
import { buildZip } from '@/lib/image/imageEngine';
import { FileUp, Download, Loader2, X } from 'lucide-react';

interface Part {
  name: string;
  pages: number[];
}

function parseRanges(input: string): Part[] {
  const out: Part[] = [];
  const tokens = input.split(',').map((s) => s.trim()).filter(Boolean);
  tokens.forEach((tok, idx) => {
    if (tok.includes('-')) {
      const [a, b] = tok.split('-').map((x) => parseInt(x, 10));
      if (!isNaN(a) && !isNaN(b) && a <= b) {
        const pages: number[] = [];
        for (let p = a; p <= b; p++) pages.push(p);
        out.push({ name: `split_${idx + 1}_p${a}-${b}.pdf`, pages });
      }
    } else {
      const n = parseInt(tok, 10);
      if (!isNaN(n)) out.push({ name: `split_${idx + 1}_p${n}.pdf`, pages: [n] });
    }
  });
  return out;
}

export default function PdfSplitClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [range, setRange] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PdfPart[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(files: FileList | File[]) {
    setError('');
    setResults([]);
    const f = Array.from(files)[0];
    if (!f || f.type !== 'application/pdf') {
      setError('请选择 PDF 文件');
      return;
    }
    setFile(f);
    try {
      setPages(await getPageCount(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function run() {
    if (!file) return;
    const parts = parseRanges(range);
    if (parts.length === 0) {
      setError('范围格式无效，例如 1-3,5,8-10');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const out = await splitFile(file, parts);
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function downloadAll() {
    if (results.length <= 1 && results[0]) {
      downloadBytes(results[0].bytes, results[0].name);
      return;
    }
    downloadBlob(buildZip(results.map((r) => ({ name: r.name, data: r.bytes }))), `split_${Date.now()}.zip`);
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('pdfSplitTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('pdfSplitDesc')}</p>

      {!file && (
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
            hidden
            onChange={(e) => e.target.files && onFile(e.target.files)}
          />
        </div>
      )}

      {file && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-card border border-border bg-panel p-3 shadow-card">
            <div className="truncate text-sm font-medium">{file.name}</div>
            <button className="text-muted hover:text-warn" onClick={() => { setFile(null); setPages(null); setResults([]); }}>
              <X size={16} />
            </button>
          </div>
          {pages != null && (
            <p className="text-sm text-muted">{t('pdfSplitPageCount', { n: pages })}</p>
          )}
          <label className="block text-sm font-semibold">{t('pdfSplitRangeLabel')}</label>
          <input
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
            placeholder={t('pdfSplitRangePh')}
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
          {error && <p className="text-sm text-warn">{error}</p>}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 font-semibold text-primary-text transition hover:opacity-90 disabled:opacity-50"
            onClick={run}
            disabled={busy || !range.trim()}
          >
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {t('pdfSplitRun')}
          </button>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.name} className="flex items-center justify-between rounded-card border border-border bg-panel p-3 shadow-card">
                  <span className="truncate text-sm">{r.name}</span>
                  <button
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary"
                    onClick={() => downloadBytes(r.bytes, r.name)}
                  >
                    <Download size={14} /> {t('download')}
                  </button>
                </div>
              ))}
              <button
                className="flex w-full items-center justify-center gap-2 rounded-card border border-border bg-panel px-4 py-2.5 text-sm font-semibold hover:border-primary"
                onClick={downloadAll}
              >
                <Download size={14} /> {t('downloadZip')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
